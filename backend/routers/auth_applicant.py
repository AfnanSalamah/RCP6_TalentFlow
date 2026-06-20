from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random

from database import get_db
from schemas import (
    ApplicantRegisterRequest, ApplicantLoginRequest,
    ForgotPasswordRequest, ResetPasswordRequest, ResetPasswordOtpRequest, TokenResponse,
    TwoFactorVerifyRequest, TwoFactorSettingsRequest
)
from auth import hash_password, verify_password, create_access_token, get_current_applicant, decode_token, is_expired
from config import settings
from email_service import send_email
from NotificationEmailService import render_notification_email
from welcome_service import welcome_candidate
import models

router = APIRouter(prefix="/auth/applicant", tags=["Applicant Auth"])


def _code_payload(email_result: dict, code: str) -> dict:
    if email_result.get("sent"):
        return {"email_sent": True}
    if email_result.get("dev_mode"):
        return {
            "email_sent": False,
            "message": "Email delivery is not configured. Please contact support or try again later.",
        }
    return {
        "email_sent": False,
        "message": "Could not send the verification code. Please try again.",
    }


def _applicant_token_response(applicant: models.Applicant, db: Session | None = None) -> dict:
    applicant.last_login = datetime.utcnow()
    applicant.otp_code = None
    applicant.otp_expires = None
    if db is not None:
        db.commit()
    token = create_access_token({"sub": str(applicant.id), "type": "applicant"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": applicant.id,
            "name": applicant.name,
            "email": applicant.email,
            "role": "applicant",
            "profileCompletion": applicant.profile_completion,
            "headline": applicant.headline,
            "avatar": None,
        },
    }


def _send_verification(applicant: models.Applicant, db: Session):
    if applicant.last_login:
        db.commit()
        return _applicant_token_response(applicant, db)

    code = f"{random.randint(0, 999999):06d}"
    applicant.verification_otp = code
    applicant.verification_otp_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    _, html = render_notification_email("verification", {
        "user_name": applicant.name,
        "verification_code": code,
        "message": "Use this code to verify your TalentFlow account. It expires in 15 minutes.",
        "action_url": getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173"),
    })
    result = send_email(
        applicant.email,
        "Verify your TalentFlow account",
        f"Your email verification code is: {code}\n\nThis code expires in 15 minutes.\n\nIf you did not register, please ignore this email.",
        html_body=html,
    )
    challenge = create_access_token(
        {"sub": str(applicant.id), "type": "applicant_verify"},
        timedelta(minutes=15),
    )
    return challenge, result, code


# ─── Register ─────────────────────────────────────────────────────────────────

@router.post("/register")
def register(body: ApplicantRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.Applicant).filter(
        func.lower(models.Applicant.email) == body.email.lower().strip()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    applicant = models.Applicant(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        profile_completion=0,
        two_factor_enabled=True,
        is_verified=False,
    )
    db.add(applicant)
    db.flush()
    if not db.query(models.ApplicantSettings).filter(models.ApplicantSettings.applicant_id == applicant.id).first():
        db.add(models.ApplicantSettings(applicant_id=applicant.id))
    db.commit()
    db.refresh(applicant)

    challenge, email_result, code = _send_verification(applicant, db)

    return {
        "requires_verification": True,
        "challenge_token": challenge,
        "email": applicant.email,
        "message": "A 6-digit verification code has been sent to your email.",
        **_code_payload(email_result, code),
    }


# ─── Verify Email ─────────────────────────────────────────────────────────────

@router.post("/verify-email", response_model=TokenResponse)
def verify_email(body: TwoFactorVerifyRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.challenge_token)
    if not payload or payload.get("type") != "applicant_verify":
        raise HTTPException(status_code=400, detail="Invalid or expired challenge token")

    applicant = db.query(models.Applicant).filter(
        models.Applicant.id == int(payload.get("sub"))
    ).first()
    if not applicant:
        raise HTTPException(status_code=400, detail="Account not found")
    if applicant.is_verified:
        # Already verified — just return a token
        return _applicant_token_response(applicant)
    if not applicant.verification_otp or applicant.verification_otp != body.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if is_expired(applicant.verification_otp_expires):
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    applicant.is_verified = True
    applicant.verification_otp = None
    applicant.verification_otp_expires = None
    welcome_candidate(db, applicant)
    db.commit()
    return _applicant_token_response(applicant, db)


# ─── Resend Verification ──────────────────────────────────────────────────────

@router.post("/resend-verification")
def resend_verification(body: TwoFactorVerifyRequest, db: Session = Depends(get_db)):
    # Reuse TwoFactorVerifyRequest but only use challenge_token (code ignored)
    payload = decode_token(body.challenge_token)
    if not payload or payload.get("type") != "applicant_verify":
        raise HTTPException(status_code=400, detail="Invalid challenge token")

    applicant = db.query(models.Applicant).filter(
        models.Applicant.id == int(payload.get("sub"))
    ).first()
    if not applicant:
        raise HTTPException(status_code=400, detail="Account not found")
    if applicant.is_verified:
        raise HTTPException(status_code=400, detail="Account is already verified")

    challenge, email_result, code = _send_verification(applicant, db)
    return {
        "challenge_token": challenge,
        "message": "A new verification code has been sent to your email.",
        **_code_payload(email_result, code),
    }


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login")
def login(body: ApplicantLoginRequest, db: Session = Depends(get_db)):
    applicant = db.query(models.Applicant).filter(
        func.lower(models.Applicant.email) == body.email.lower().strip()
    ).first()
    if not applicant or not verify_password(body.password, applicant.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not applicant.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Block unverified accounts and send a fresh verification code
    if not applicant.is_verified:
        challenge, email_result, code = _send_verification(applicant, db)
        return {
            "requires_verification": True,
            "challenge_token": challenge,
            "email": applicant.email,
            "message": "Please verify your email before logging in. A new code has been sent.",
            **_code_payload(email_result, code),
        }

    if applicant.last_login:
        return _applicant_token_response(applicant, db)

    code = f"{random.randint(0, 999999):06d}"
    applicant.otp_code = code
    applicant.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    applicant.two_factor_enabled = True
    db.commit()
    subject, html = render_notification_email("verification", {
        "subject": "TalentFlow Login Verification Code",
        "title": "Verify Your TalentFlow Login",
        "user_name": applicant.name,
        "verification_code": code,
        "expires_in": "10 minutes",
        "message": "Use this secure verification code to continue signing in to your TalentFlow account.",
        "badge": "Candidate Login Verification",
        "cta_label": "Open TalentFlow",
        "action_url": getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173"),
    })
    email_result = send_email(
        applicant.email,
        subject,
        f"Your TalentFlow verification code is: {code}\n\nThis code expires in 10 minutes.",
        html_body=html,
    )
    challenge = create_access_token(
        {"sub": str(applicant.id), "type": "applicant_2fa"},
        timedelta(minutes=10),
    )
    return {
        "requires_2fa": True,
        "method": "email",
        "challenge_token": challenge,
        "message": "A 6-digit code was sent to your email.",
        **_code_payload(email_result, code),
    }


# ─── Verify 2FA ───────────────────────────────────────────────────────────────

@router.post("/verify-2fa", response_model=TokenResponse)
def verify_2fa(body: TwoFactorVerifyRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.challenge_token)
    if not payload or payload.get("type") != "applicant_2fa":
        raise HTTPException(status_code=400, detail="Invalid challenge token")
    applicant = db.query(models.Applicant).filter(
        models.Applicant.id == int(payload.get("sub"))
    ).first()
    if not applicant or not applicant.otp_code or applicant.otp_code != body.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if is_expired(applicant.otp_expires):
        raise HTTPException(status_code=400, detail="Verification code expired")
    applicant.otp_code = None
    applicant.otp_expires = None
    db.commit()
    return _applicant_token_response(applicant, db)


@router.put("/2fa")
def set_2fa(
    body: TwoFactorSettingsRequest,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    current.two_factor_enabled = body.enabled
    current.otp_code = None
    current.otp_expires = None
    db.commit()
    return {"two_factor_enabled": current.two_factor_enabled}


# ─── Forgot / Reset Password ──────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    applicant = db.query(models.Applicant).filter(
        func.lower(models.Applicant.email) == body.email.lower().strip()
    ).first()
    if applicant:
        code = f"{random.randint(0, 999999):06d}"
        applicant.reset_token = code
        applicant.reset_token_expires = datetime.utcnow() + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )
        db.commit()
        subject, html = render_notification_email("password_reset", {
            "subject": "TalentFlow Password Reset Code",
            "title": "Reset Your TalentFlow Password",
            "user_name": applicant.name,
            "verification_code": code,
            "expires_in": f"{settings.RESET_TOKEN_EXPIRE_MINUTES} minutes",
            "message": "Use this secure reset code to create a new password for your TalentFlow account.",
            "badge": "Password Reset",
            "cta_label": "Reset Password",
            "action_url": getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173"),
        })
        email_result = send_email(
            applicant.email,
            subject,
            f"Your password reset code is: {code}\n\nThis code expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.",
            html_body=html,
        )
        return {
            "message": "If that email is registered, a reset code has been sent.",
            **_code_payload(email_result, code),
        }
    return {"message": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    applicant = db.query(models.Applicant).filter(
        models.Applicant.reset_token == body.token
    ).first()
    if not applicant or is_expired(applicant.reset_token_expires):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    applicant.password_hash = hash_password(body.new_password)
    applicant.reset_token = None
    applicant.reset_token_expires = None
    db.commit()
    return {"message": "Password has been reset successfully"}


@router.post("/reset-password-otp")
def reset_password_otp(body: ResetPasswordOtpRequest, db: Session = Depends(get_db)):
    applicant = db.query(models.Applicant).filter(
        func.lower(models.Applicant.email) == body.email.lower().strip()
    ).first()
    if (
        not applicant
        or applicant.reset_token != body.code.strip()
        or is_expired(applicant.reset_token_expires)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    applicant.password_hash = hash_password(body.new_password)
    applicant.reset_token = None
    applicant.reset_token_expires = None
    db.commit()
    return {"message": "Password has been reset successfully"}


@router.get("/me")
def me(current: models.Applicant = Depends(get_current_applicant)):
    return {
        "id": current.id,
        "name": current.name,
        "email": current.email,
        "role": "applicant",
        "profileCompletion": current.profile_completion,
        "headline": current.headline,
        "avatar": None,
    }
