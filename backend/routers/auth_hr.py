import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random
import pyotp

from database import get_db
from config import settings
from schemas import HRLoginRequest, TokenResponse, TwoFactorVerifyRequest, TwoFactorSettingsRequest, ForgotPasswordRequest, ResetPasswordOtpRequest
from auth import verify_password, create_access_token, hash_password, get_current_hr_user, decode_token
from email_service import send_email
from NotificationEmailService import render_notification_email
import models

router = APIRouter(prefix="/auth/hr", tags=["HR Auth"])
log = logging.getLogger("talentflow.auth_hr")


def _user_out(user: models.HRUser):
    return {
        "id": user.id,
        "employeeId": user.employee_id,
        "displayName": user.name,
        "name": user.name,
        "email": user.email,
        "role": "hr",
        "hrRole": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "companyId": user.company_id,
        "title": user.title,
        "department": user.department,
        "avatar": user.avatar or user.name[:2].upper(),
    }


def _token_response(user: models.HRUser, db: Session) -> dict:
    user.last_login = datetime.utcnow()
    user.otp_code = None
    user.otp_expires = None
    if user.status == "pending":
        user.status = "active"
    db.commit()
    token = create_access_token({
        "sub": str(user.id),
        "type": "hr",
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "company_id": user.company_id,
    })
    return {"access_token": token, "token_type": "bearer", "user": _user_out(user)}


@router.post("/login")
def hr_login(body: HRLoginRequest, db: Session = Depends(get_db)):
    identifier = body.identifier.strip().lower()
    user = db.query(models.HRUser).filter(
        (func.lower(models.HRUser.employee_id) == identifier) |
        (func.lower(models.HRUser.email) == identifier)
    ).first()

    if not user or not verify_password(body.password, user.password_hash):
        log.warning("[HR-LOGIN] Failed login attempt for: %s", identifier)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    role_label = user.role.value if hasattr(user.role, 'value') else str(user.role)
    log.info("[HR-LOGIN] User found — id=%s email=%s role=%s", user.id, user.email, role_label)

    if not user.email:
        log.error("[HR-LOGIN] User %s has no email — cannot send OTP", user.id)
        raise HTTPException(status_code=500, detail="Account has no email configured")

    if user.last_login:
        return _token_response(user, db)

    # Email OTP for the first successful login only.
    code = f"{random.randint(0, 999999):06d}"
    user.otp_code = code
    user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    log.info("[HR-OTP] Generated OTP for %s (%s)", user.email, role_label)

    subject, html = render_notification_email("hr_login_verification", {
        "subject": "TalentFlow Login Verification Code",
        "title": "Verify HR Dashboard Access",
        "user_name": user.name,
        "employee_name": user.name,
        "department": user.department,
        "role": role_label,
        "verification_code": code,
        "expires_in": "10 minutes",
        "message": "Use the secure verification code below to access your TalentFlow HR dashboard.",
        "badge": "HR Access Verification",
        "cta_label": "Verify Access",
        "action_url": f"{settings.FRONTEND_URL}/login",
    })
    email_result = send_email(
        user.email,
        subject,
        f"Hi {user.name},\n\n"
        f"Your TalentFlow login verification code is:\n\n"
        f"  {code}\n\n"
        f"This code expires in 10 minutes.\n\n"
        f"— TalentFlow Security Team",
        html,
    )

    if email_result.get("dev_mode"):
        log.warning("[HR-OTP] SMTP not configured — OTP printed to terminal for %s", user.email)
    elif email_result.get("sent"):
        log.info("[HR-OTP] Email sent successfully to %s", user.email)
    else:
        log.error("[HR-OTP] Email FAILED for %s: %s", user.email, email_result)

    challenge = create_access_token({"sub": str(user.id), "type": "hr_2fa"}, timedelta(minutes=10))
    return {
        "requires_2fa": True,
        "method": "email",
        "challenge_token": challenge,
        "email": user.email,
        "message": "A 6-digit verification code has been sent to your email.",
        **({"email_sent": True} if email_result.get("sent") else {"email_sent": False, "message": "Could not send the verification code. Please try again."}),
    }


@router.get("/me")
def hr_me(current_user: models.HRUser = Depends(get_current_hr_user)):
    return _user_out(current_user)


@router.post("/verify-2fa", response_model=TokenResponse)
def verify_hr_2fa(body: TwoFactorVerifyRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.challenge_token)
    if not payload or payload.get("type") not in ["hr_2fa", "hr_totp"]:
        raise HTTPException(status_code=400, detail="Invalid or expired challenge token")

    user = db.query(models.HRUser).filter(
        models.HRUser.id == int(payload.get("sub"))
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    code = body.code.strip()
    ok = False

    # Email OTP check
    if user.otp_code and user.otp_code == code:
        if user.otp_expires and datetime.utcnow() <= user.otp_expires:
            ok = True
            log.info("[HR-2FA] Email OTP verified for %s", user.email)
        else:
            log.warning("[HR-2FA] OTP expired for %s", user.email)

    # TOTP fallback (for users who still have authenticator set up)
    if not ok and user.totp_secret:
        ok = pyotp.TOTP(user.totp_secret).verify(code, valid_window=1)
        if ok:
            log.info("[HR-2FA] TOTP verified for %s", user.email)

    if not ok:
        log.warning("[HR-2FA] Invalid code for %s", user.email)
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    log.info("[HR-2FA] Login complete for %s (role=%s)", user.email,
             user.role.value if hasattr(user.role, 'value') else user.role)
    return _token_response(user, db)


@router.get("/2fa/setup")
def setup_hr_2fa(current_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    if not current_user.totp_secret:
        current_user.totp_secret = pyotp.random_base32()
        db.commit()
    return {
        "secret": current_user.totp_secret,
        "uri": pyotp.totp.TOTP(current_user.totp_secret).provisioning_uri(
            name=current_user.email, issuer_name="TalentFlow"
        ),
    }


@router.put("/2fa")
def set_hr_2fa(body: TwoFactorSettingsRequest, current_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    current_user.two_factor_enabled = body.enabled
    if body.enabled and not current_user.totp_secret:
        current_user.totp_secret = pyotp.random_base32()
    current_user.otp_code = None
    current_user.otp_expires = None
    db.commit()
    return {"two_factor_enabled": current_user.two_factor_enabled, "secret": current_user.totp_secret if body.enabled else None}


@router.post("/forgot-password")
def forgot_hr_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.HRUser).filter(
        func.lower(models.HRUser.email) == body.email.lower().strip()
    ).first()
    if user:
        code = f"{random.randint(0, 999999):06d}"
        user.reset_token = code
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        role_label = user.role.value if hasattr(user.role, 'value') else str(user.role)
        subject, html = render_notification_email("password_reset", {
            "subject": "TalentFlow HR Password Reset Code",
            "title": "Reset Your TalentFlow HR Password",
            "user_name": user.name,
            "employee_name": user.name,
            "department": user.department,
            "role": role_label,
            "verification_code": code,
            "expires_in": "10 minutes",
            "message": "Use this secure reset code to create a new password for your TalentFlow HR account.",
            "badge": "HR Password Reset",
            "cta_label": "Reset Password",
            "action_url": f"{settings.FRONTEND_URL}/login",
        })
        email_result = send_email(
            user.email,
            subject,
            f"Your password reset code is: {code}\n\nThis code expires in 10 minutes.",
            html_body=html,
        )
        return {
            "message": "If that email is registered, a reset code has been sent.",
            **({"email_sent": True} if email_result.get("sent") else {"email_sent": False, "message": "Could not send the verification code. Please try again."}),
        }
    return {"message": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password-otp")
def reset_hr_password_otp(body: ResetPasswordOtpRequest, db: Session = Depends(get_db)):
    user = db.query(models.HRUser).filter(
        func.lower(models.HRUser.email) == body.email.lower().strip()
    ).first()
    if (
        not user
        or user.reset_token != body.code.strip()
        or not user.reset_token_expires
        or datetime.utcnow() > user.reset_token_expires
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    user.password_hash = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "Password has been reset successfully"}
