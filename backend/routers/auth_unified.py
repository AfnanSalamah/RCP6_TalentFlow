import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random

from database import get_db
from config import settings
from schemas import UnifiedLoginRequest, UnifiedLoginResponse
from auth import verify_password, create_access_token
from email_service import send_email
from NotificationEmailService import render_notification_email
import models

router = APIRouter(tags=["Unified Auth"])
log = logging.getLogger("talentflow.auth")


def _code_payload(email_result: dict, code: str) -> dict:
    if email_result.get("sent"):
        return {"email_sent": True}
    return {
        "email_sent": False,
        "message": "Email verification is temporarily unavailable. Please try again later.",
    }

_INVALID = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _hr_user_out(user: models.HRUser) -> dict:
    return {
        "id": user.id,
        "employeeId": user.employee_id,
        "displayName": user.name,
        "name": user.name,
        "email": user.email,
        "role": "hr",
        "hrRole": user.role.value if hasattr(user.role, "value") else str(user.role),
        "title": user.title,
        "department": user.department,
        "avatar": user.avatar or user.name[:2].upper(),
    }


def _hr_token_response(user: models.HRUser, db: Session) -> dict:
    user.last_login = datetime.utcnow()
    user.otp_code = None
    user.otp_expires = None
    db.commit()
    token = create_access_token({
        "sub": str(user.id),
        "type": "hr",
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "company_id": user.company_id,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "portal": "hr",
        "redirect_to": "/hr/dashboard",
        "user": _hr_user_out(user),
    }


def _applicant_out(applicant: models.Applicant) -> dict:
    return {
        "id": applicant.id,
        "name": applicant.name,
        "email": applicant.email,
        "role": "applicant",
        "profileCompletion": applicant.profile_completion,
        "headline": applicant.headline or "",
        "avatar": None,
    }


def _applicant_token_response(applicant: models.Applicant, db: Session) -> dict:
    applicant.last_login = datetime.utcnow()
    applicant.otp_code = None
    applicant.otp_expires = None
    db.commit()
    token = create_access_token({"sub": str(applicant.id), "type": "applicant"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "portal": "applicant",
        "redirect_to": "/user/dashboard",
        "user": _applicant_out(applicant),
    }


def _send_hr_otp(user: models.HRUser, db: Session) -> tuple[str, dict, str]:
    """Generate, store and email a 6-digit OTP for an HR user. Returns (challenge_token, email_result, code)."""
    code = f"{random.randint(0, 999999):06d}"
    user.otp_code = code
    user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    role_label = user.role.value if hasattr(user.role, "value") else str(user.role)
    log.info("[OTP] HR user found — id=%s email=%s role=%s", user.id, user.email, role_label)
    log.info("[OTP] Generated OTP for %s: %s", user.email, code)

    result = send_email(
        user.email,
        "TalentFlow Login Verification Code",
        f"Hi {user.name},\n\n"
        f"Your TalentFlow login verification code is:\n\n"
        f"  {code}\n\n"
        f"This code expires in 10 minutes.\n\n"
        f"If you did not attempt to log in, please secure your account immediately.\n\n"
        f"— TalentFlow Security Team",
    )

    if result.get("dev_mode"):
        log.warning("[OTP] SMTP not configured — OTP printed to terminal for %s", user.email)
    elif result.get("sent"):
        log.info("[OTP] Email sent successfully to %s", user.email)
    else:
        log.error("[OTP] Email FAILED for %s: %s", user.email, result)

    challenge = create_access_token(
        {"sub": str(user.id), "type": "hr_2fa"},
        timedelta(minutes=10),
    )
    return challenge, result, code


def _send_hr_otp(user: models.HRUser, db: Session) -> tuple[str, dict, str]:
    """Generate, store and email a branded 6-digit OTP for an HR user."""
    code = f"{random.randint(0, 999999):06d}"
    user.otp_code = code
    user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    role_label = user.role.value if hasattr(user.role, "value") else str(user.role)
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
    result = send_email(
        user.email,
        subject,
        (
            f"Hi {user.name},\n\n"
            f"Your TalentFlow HR verification code is: {code}\n\n"
            "This code expires in 10 minutes.\n\n"
            "TalentFlow Security Team"
        ),
        html,
    )

    if result.get("dev_mode"):
        log.warning("[OTP] SMTP not configured - OTP printed to terminal for %s", user.email)
    elif result.get("sent"):
        log.info("[OTP] Email sent successfully to %s", user.email)
    else:
        log.error("[OTP] Email FAILED for %s: %s", user.email, result)

    challenge = create_access_token(
        {"sub": str(user.id), "type": "hr_2fa"},
        timedelta(minutes=10),
    )
    return challenge, result, code


@router.post("/auth/login", summary="Unified login — all roles use Email OTP")
def unified_login(body: UnifiedLoginRequest, db: Session = Depends(get_db)):
    identifier = body.identifier.lower().strip()
    log.info("[LOGIN] Attempt for identifier: %s", identifier)

    # ── HR user lookup ────────────────────────────────────────────────────────
    hr_user = db.query(models.HRUser).filter(
        (func.lower(models.HRUser.employee_id) == identifier) |
        (func.lower(models.HRUser.email) == identifier)
    ).first()

    if hr_user:
        log.info("[LOGIN] HR user found — id=%s name=%s role=%s email=%s",
                 hr_user.id, hr_user.name,
                 hr_user.role.value if hasattr(hr_user.role, "value") else hr_user.role,
                 hr_user.email)

        if not verify_password(body.password, hr_user.password_hash):
            log.warning("[LOGIN] Wrong password for HR user %s", identifier)
            raise _INVALID
        if hr_user.status == "inactive":
            log.warning("[LOGIN] Inactive HR account: %s", identifier)
            raise HTTPException(status_code=403, detail="Account is deactivated")

        if not hr_user.email:
            log.error("[LOGIN] HR user %s has no email — cannot send OTP", hr_user.id)
            raise HTTPException(status_code=500, detail="Account has no email address configured")

        if hr_user.last_login:
            return _hr_token_response(hr_user, db)

        # Email OTP for the first successful login only.
        challenge, email_result, code = _send_hr_otp(hr_user, db)
        return {
            "requires_2fa": True,
            "method": "email",
            "portal": "hr",
            "challenge_token": challenge,
            "email": hr_user.email,
            "message": "A 6-digit verification code has been sent to your email.",
            **_code_payload(email_result, code),
        }

    # ── Applicant lookup ──────────────────────────────────────────────────────
    applicant = db.query(models.Applicant).filter(
        func.lower(models.Applicant.email) == identifier
    ).first()

    if applicant:
        log.info("[LOGIN] Applicant found — id=%s email=%s", applicant.id, applicant.email)

        if not verify_password(body.password, applicant.password_hash):
            log.warning("[LOGIN] Wrong password for applicant %s", identifier)
            raise _INVALID
        if not applicant.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")

        # Unverified account — send fresh verification OTP
        if not getattr(applicant, "is_verified", True):
            log.info("[LOGIN] Applicant %s not verified — sending verification OTP", applicant.email)
            code = f"{random.randint(0, 999999):06d}"
            applicant.verification_otp = code
            applicant.verification_otp_expires = datetime.utcnow() + timedelta(minutes=15)
            db.commit()
            subject, html = render_notification_email("verification", {
                "subject": "Verify your TalentFlow account",
                "title": "Verify Your Email Address",
                "user_name": applicant.name,
                "verification_code": code,
                "expires_in": "15 minutes",
                "message": "Use this secure verification code to activate your TalentFlow account.",
                "badge": "Candidate Email Verification",
                "cta_label": "Verify Email",
                "action_url": f"{settings.FRONTEND_URL}/login",
            })
            email_result = send_email(
                applicant.email,
                subject,
                f"Your email verification code is: {code}\n\nThis code expires in 15 minutes.",
                html_body=html,
            )
            if email_result.get("dev_mode"):
                log.warning("[OTP] Verification email in dev-mode for %s", applicant.email)
            challenge = create_access_token(
                {"sub": str(applicant.id), "type": "applicant_verify"},
                timedelta(minutes=15),
            )
            return {
                "requires_verification": True,
                "portal": "applicant",
                "challenge_token": challenge,
                "email": applicant.email,
                "message": "Please verify your email before logging in. A new code has been sent.",
                **_code_payload(email_result, code),
            }

        if applicant.last_login:
            return _applicant_token_response(applicant, db)

        # Email OTP for the first successful login only.
        code = f"{random.randint(0, 999999):06d}"
        applicant.otp_code = code
        applicant.otp_expires = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        log.info("[OTP] Applicant login OTP generated for %s", applicant.email)
        subject, html = render_notification_email("verification", {
            "subject": "TalentFlow Login Verification Code",
            "title": "Verify Your TalentFlow Login",
            "user_name": applicant.name,
            "verification_code": code,
            "expires_in": "10 minutes",
            "message": "Use this secure verification code to continue signing in to your TalentFlow account.",
            "badge": "Candidate Login Verification",
            "cta_label": "Open TalentFlow",
            "action_url": f"{settings.FRONTEND_URL}/login",
        })
        email_result = send_email(
            applicant.email,
            subject,
            f"Your TalentFlow verification code is: {code}\n\nThis code expires in 10 minutes.",
            html_body=html,
        )
        if email_result.get("dev_mode"):
            log.warning("[OTP] Login email in dev-mode for %s", applicant.email)
        elif email_result.get("sent"):
            log.info("[OTP] Login email sent to %s", applicant.email)
        challenge = create_access_token(
            {"sub": str(applicant.id), "type": "applicant_2fa"},
            timedelta(minutes=10),
        )
        return {
            "requires_2fa": True,
            "method": "email",
            "portal": "applicant",
            "challenge_token": challenge,
            "email": applicant.email,
            "message": "A 6-digit code was sent to your email.",
            **_code_payload(email_result, code),
        }

    log.warning("[LOGIN] No account found for identifier: %s", identifier)
    raise _INVALID
