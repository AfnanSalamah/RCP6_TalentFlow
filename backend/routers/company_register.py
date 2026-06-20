"""Company self-registration — public "Start Free Trial" signup.

Creates, in one transaction:
  • a Company (tenant) on the selected plan, starting a 14-day free trial
  • its first Company Admin (HRUser, role=admin) scoped to that company

The admin's email is then verified with a 6-digit code sent to that address:
registration returns a short-lived challenge token (NOT an access token), and
only after `/auth/verify-company-email` succeeds does the admin receive a
ready-to-use HR access token and land on the Company Dashboard.
"""
import logging
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from auth import hash_password, create_access_token, decode_token
from email_service import send_email
from NotificationEmailService import render_notification_email
from welcome_service import welcome_company
from schemas import CompanyRegisterRequest, TwoFactorVerifyRequest
import models

log = logging.getLogger("talentflow.company_register")
router = APIRouter(prefix="/auth", tags=["Company Registration"])

TRIAL_DAYS = 14
VERIFY_TTL_MINUTES = 15


def _code_payload(email_result: dict, code: str) -> dict:
    if email_result.get("sent"):
        return {"email_sent": True}
    if email_result.get("dev_mode"):
        return {
            "email_sent": False,
            "dev_code": code,
            "message": "Email delivery is not configured. Use the verification code shown on this page.",
        }
    return {
        "email_sent": False,
        "message": "Could not send the verification code. Please try again.",
    }

# UI plan id → canonical plan key used everywhere else (super-admin, billing).
PLAN_ALIASES = {
    "starter": "basic",
    "basic": "basic",
    "professional": "professional",
    "pro": "professional",
    "enterprise": "enterprise",
    "free_trial": "free_trial",
}


def _plan_defaults():
    # Imported lazily to avoid any import-order surprises at startup.
    from routers.super_admin import PLAN_DEFAULTS
    return PLAN_DEFAULTS


def _admin_user_out(user: models.HRUser) -> dict:
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {
        "id": user.id,
        "employeeId": user.employee_id,
        "displayName": user.name,
        "name": user.name,
        "email": user.email,
        "role": "hr",
        "hrRole": role,
        "companyId": user.company_id,
        "title": user.title,
        "department": user.department,
        "avatar": user.avatar or user.name[:2].upper(),
    }


def _send_company_verification(admin: models.HRUser, db: Session):
    """Generate, store and email a 6-digit verification code for a new company
    admin. Returns (challenge_token, email_result, code)."""
    code = f"{random.randint(0, 999999):06d}"
    admin.otp_code = code
    admin.otp_expires = datetime.utcnow() + timedelta(minutes=VERIFY_TTL_MINUTES)
    db.commit()
    result = send_email(
        admin.email,
        "Verify your TalentFlow company account",
        f"Hi {admin.name},\n\n"
        f"Welcome to TalentFlow! Your email verification code is:\n\n"
        f"  {code}\n\n"
        f"This code expires in {VERIFY_TTL_MINUTES} minutes.\n\n"
        f"If you did not create a TalentFlow account, please ignore this email.\n\n"
        f"— TalentFlow Team",
    )
    if result.get("dev_mode"):
        log.warning("[VERIFY] SMTP not configured — verification code printed to terminal for %s", admin.email)
    elif result.get("sent"):
        log.info("[VERIFY] Verification email sent to %s", admin.email)
    else:
        log.error("[VERIFY] Verification email FAILED for %s: %s", admin.email, result)

    challenge = create_access_token(
        {"sub": str(admin.id), "type": "company_verify", "company_id": admin.company_id},
        timedelta(minutes=VERIFY_TTL_MINUTES),
    )
    return challenge, result, code


def _auto_login_response(company: models.Company, admin: models.HRUser, db: Session | None = None) -> dict:
    """Mint the HR access token and assemble the full session payload."""
    admin.last_login = datetime.utcnow()
    admin.otp_code = None
    admin.otp_expires = None
    if db is not None:
        db.commit()
    token = create_access_token({
        "sub": str(admin.id),
        "type": "hr",
        "role": "admin",
        "company_id": company.id,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "portal": "hr",
        "redirect_to": "/hr/dashboard",
        "user": _admin_user_out(admin),
        "company": {
            "id": company.id,
            "name": company.company_name,
            "plan": company.subscription_plan,
            "trial_ends": company.subscription_end_date.isoformat(),
            "max_users": company.max_users,
            "max_jobs": company.max_jobs,
        },
    }


def _send_company_verification(admin: models.HRUser, db: Session):
    """Send a branded 6-digit company verification email."""
    code = f"{random.randint(0, 999999):06d}"
    admin.otp_code = code
    admin.otp_expires = datetime.utcnow() + timedelta(minutes=VERIFY_TTL_MINUTES)
    db.commit()

    company = db.query(models.Company).filter(models.Company.id == admin.company_id).first()
    subject, html = render_notification_email("company_email_verification", {
        "subject": "Verify your TalentFlow company account",
        "title": "Verify Your Company Account",
        "user_name": admin.name,
        "company_name": company.company_name if company else "Your company",
        "plan": company.subscription_plan if company else "",
        "verification_code": code,
        "expires_in": f"{VERIFY_TTL_MINUTES} minutes",
        "message": "Welcome to TalentFlow. To activate your company workspace and begin recruiting talent, verify your company account using the verification code below.",
        "badge": "Company Verification",
        "cta_label": "Verify Company Account",
        "action_url": "http://localhost:5173/verify-company-email",
    })
    result = send_email(
        admin.email,
        subject,
        (
            f"Hi {admin.name},\n\n"
            f"Your TalentFlow company verification code is: {code}\n\n"
            f"This code expires in {VERIFY_TTL_MINUTES} minutes.\n\n"
            "TalentFlow Team"
        ),
        html,
    )

    if result.get("dev_mode"):
        log.warning("[VERIFY] SMTP not configured - verification code printed to terminal for %s", admin.email)
    elif result.get("sent"):
        log.info("[VERIFY] Verification email sent to %s", admin.email)
    else:
        log.error("[VERIFY] Verification email FAILED for %s: %s", admin.email, result)

    challenge = create_access_token(
        {"sub": str(admin.id), "type": "company_verify", "company_id": admin.company_id},
        timedelta(minutes=VERIFY_TTL_MINUTES),
    )
    return challenge, result, code


@router.post("/register-company", status_code=201)
def register_company(body: CompanyRegisterRequest, db: Session = Depends(get_db)):
    company_name = body.company_name.strip()
    company_email = body.company_email.lower().strip()
    admin_name = body.admin_name.strip()

    # ── Validation ────────────────────────────────────────────────────────────
    if len(company_name) < 2:
        raise HTTPException(status_code=400, detail="Company name is too short")
    if len(admin_name) < 2:
        raise HTTPException(status_code=400, detail="Admin name is too short")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    plan_key = PLAN_ALIASES.get(body.plan.lower().strip())
    if not plan_key:
        raise HTTPException(status_code=400, detail=f"Unknown subscription plan: {body.plan}")

    # The admin signs in with company_email, so it must be globally unique
    # across HR users (and not collide with an applicant account either).
    if db.query(models.HRUser).filter(func.lower(models.HRUser.email) == company_email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if db.query(models.Applicant).filter(func.lower(models.Applicant.email) == company_email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    plan_cfg = _plan_defaults().get(plan_key, _plan_defaults()["basic"])
    now = datetime.utcnow()

    # ── Create the tenant ─────────────────────────────────────────────────────
    company = models.Company(
        company_name=company_name,
        industry="",
        contact_person=admin_name,
        contact_email=company_email,
        subscription_plan=plan_key,
        subscription_status="active",        # active during the trial window
        subscription_start_date=now,
        subscription_end_date=now + timedelta(days=TRIAL_DAYS),
        max_users=plan_cfg["max_users"],
        max_jobs=plan_cfg["max_jobs"],
        max_ai_requests=plan_cfg["max_ai_requests"],
        is_active=True,
        notes=f"Self-registered {now.date()} — {TRIAL_DAYS}-day free trial of {plan_key}.",
    )
    db.add(company)
    db.flush()  # assigns company.id (the generated company_id)

    # ── Create the first Company Admin (unique employee_id from company_id) ────
    # The admin starts "pending" until they confirm the verification code that
    # we email below; verification flips them to "active".
    employee_id = f"CADM-{company.id:04d}"
    admin = models.HRUser(
        company_id=company.id,
        employee_id=employee_id,
        name=admin_name,
        email=company_email,
        password_hash=hash_password(body.password),
        role=models.HRRole.admin,
        title="Company Admin",
        department="Administration",
        avatar=admin_name[:2].upper(),
        status="pending",                    # activated after email verification
        two_factor_enabled=False,            # skip OTP on the very first login
    )
    db.add(admin)

    # Audit trail for the platform owner's Super Admin portal.
    db.add(models.AuditLog(
        company_id=company.id,
        user=company_email,
        action=f"Company self-registered: {company_name}",
        module="Registration",
        detail=f"Plan={plan_key}, trial ends {company.subscription_end_date.date()}",
    ))

    db.commit()
    db.refresh(company)
    db.refresh(admin)

    log.info("[REGISTER] New company '%s' (id=%s) + admin %s — awaiting email verification",
             company_name, company.id, company_email)

    # ── Email a verification code; the admin is NOT logged in until verified ──
    challenge, email_result, code = _send_company_verification(admin, db)

    return {
        "requires_verification": True,
        "challenge_token": challenge,
        "email": company_email,
        "message": "A 6-digit verification code has been sent to your email.",
        **_code_payload(email_result, code),
    }


@router.post("/verify-company-email")
def verify_company_email(body: TwoFactorVerifyRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.challenge_token)
    if not payload or payload.get("type") != "company_verify":
        raise HTTPException(status_code=400, detail="Invalid or expired challenge token")

    admin = db.query(models.HRUser).filter(
        models.HRUser.id == int(payload.get("sub"))
    ).first()
    if not admin:
        raise HTTPException(status_code=400, detail="Account not found")

    company = db.query(models.Company).filter(models.Company.id == admin.company_id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")

    # Already verified — just hand back a fresh session.
    if admin.status == "active":
        return _auto_login_response(company, admin, db)

    if not admin.otp_code or admin.otp_code != body.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if not admin.otp_expires or datetime.utcnow() > admin.otp_expires:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    admin.status = "active"
    admin.otp_code = None
    admin.otp_expires = None
    welcome_company(db, company, admin)
    db.commit()
    db.refresh(admin)

    log.info("[VERIFY] Company admin %s verified — company id=%s activated", admin.email, company.id)

    return _auto_login_response(company, admin, db)


@router.post("/resend-company-verification")
def resend_company_verification(body: TwoFactorVerifyRequest, db: Session = Depends(get_db)):
    # Reuses TwoFactorVerifyRequest but only the challenge_token is used.
    payload = decode_token(body.challenge_token)
    if not payload or payload.get("type") != "company_verify":
        raise HTTPException(status_code=400, detail="Invalid challenge token")

    admin = db.query(models.HRUser).filter(
        models.HRUser.id == int(payload.get("sub"))
    ).first()
    if not admin:
        raise HTTPException(status_code=400, detail="Account not found")
    if admin.status == "active":
        raise HTTPException(status_code=400, detail="Account is already verified")

    challenge, email_result, code = _send_company_verification(admin, db)
    return {
        "challenge_token": challenge,
        "message": "A new verification code has been sent to your email.",
        **_code_payload(email_result, code),
    }
