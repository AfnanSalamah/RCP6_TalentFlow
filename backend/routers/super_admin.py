"""Super Admin Portal — complete API router."""
from __future__ import annotations

import logging
import random
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, text, or_

from database import get_db
from config import settings
from auth import hash_password, verify_password, create_access_token, decode_token, get_current_super_admin, is_expired
from email_service import send_email
from NotificationEmailService import render_notification_email, send_notification_email
from welcome_service import welcome_candidate, welcome_company, welcome_employee
import models

log = logging.getLogger("talentflow.super_admin")

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])


def _temporary_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in "!@#$%&*" for c in password)
        ):
            return password

# ─── Schemas ──────────────────────────────────────────────────────────────────

class SALoginRequest(BaseModel):
    email: str
    password: str

class CompanyCreate(BaseModel):
    company_name: str
    industry: str = ""
    contact_person: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    subscription_plan: str = "free_trial"
    max_users: int = 5
    max_jobs: int = 10
    max_ai_requests: int = 100
    notes: str = ""

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_end_date: Optional[str] = None
    max_users: Optional[int] = None
    max_jobs: Optional[int] = None
    max_ai_requests: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class TicketCreate(BaseModel):
    company_id: int
    subject: str
    message: str
    priority: str = "Medium"

class TicketReplyCreate(BaseModel):
    message: str

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    target: str = "all"
    company_id: Optional[int] = None

class SAProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class CompanyAlertRequest(BaseModel):
    title: str
    message: str
    type: str = "warning"
    send_email: bool = False

class CompanyRegistrationCheck(BaseModel):
    company_name: Optional[str] = None
    contact_email: Optional[str] = None


class SAHRUserCreate(BaseModel):
    name: str
    email: str
    password: str
    company_id: Optional[int] = None
    employee_id: Optional[str] = None
    role: str = "hr_manager"
    department: str = ""
    title: str = ""
    status: str = "active"


class SAApplicantCreate(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""
    location: str = ""
    headline: str = ""
    status: str = "active"


class UserDeleteByEmailRequest(BaseModel):
    email: str

PLAN_DEFAULTS = {
    "free_trial":   {"max_users": 5,   "max_jobs": 10,  "max_ai_requests": 100,  "monthly_price": 0,    "yearly_price": 0},
    "basic":        {"max_users": 15,  "max_jobs": 30,  "max_ai_requests": 500,  "monthly_price": 49,   "yearly_price": 499},
    "professional": {"max_users": 50,  "max_jobs": 100, "max_ai_requests": 2000, "monthly_price": 149,  "yearly_price": 1499},
    "enterprise":   {"max_users": 500, "max_jobs": 999, "max_ai_requests": 9999, "monthly_price": 499,  "yearly_price": 4999},
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _company_out(c: models.Company) -> dict:
    end = c.subscription_end_date
    days_left = None
    if end:
        days_left = max(0, (end - datetime.utcnow()).days)
    return {
        "id": c.id,
        "company_name": c.company_name,
        "industry": c.industry,
        "contact_person": c.contact_person,
        "contact_email": c.contact_email,
        "contact_phone": c.contact_phone,
        "subscription_plan": c.subscription_plan,
        "subscription_status": c.subscription_status,
        "subscription_start_date": c.subscription_start_date,
        "subscription_end_date": c.subscription_end_date,
        "days_left": days_left,
        "max_users": c.max_users,
        "max_jobs": c.max_jobs,
        "max_ai_requests": c.max_ai_requests,
        "is_active": c.is_active,
        "is_deleted": getattr(c, "is_deleted", False),
        "deleted_at": getattr(c, "deleted_at", None),
        "notes": c.notes,
        "created_at": c.created_at,
    }

def _audit(db, sa, action, module="", detail="", company_id=None, request=None):
    ip = ""
    if request:
        ip = request.client.host if request.client else ""
    db.add(models.AuditLog(
        company_id=company_id,
        user=sa.email,
        action=action,
        module=module,
        detail=detail,
        ip_address=ip,
    ))


def _sa_notification(
    sa: models.SuperAdmin,
    *,
    title: str,
    message: str,
    type: str = "info",
    link: str = "/super-admin/notifications",
) -> models.Notification:
    return models.Notification(
        title=title,
        message=message,
        type=type,
        created_by=sa.id,
        recipient_scope="super_admin",
        recipient_role="super_admin",
        notification_category=type or "system",
        is_read=False,
        read=False,
        email_sent=False,
        link=link,
    )


def _platform_notification(
    sa: models.SuperAdmin,
    *,
    title: str,
    message: str,
    type: str,
    recipient_scope: str,
    company_id: Optional[int] = None,
    link: str = "/hr/notifications",
) -> models.Notification:
    return models.Notification(
        title=title,
        message=message,
        type=type,
        company_id=company_id,
        created_by=sa.id,
        recipient_scope=recipient_scope,
        recipient_role="hr_manager",
        notification_category=type or "platform",
        is_read=False,
        read=False,
        email_sent=False,
        link=link,
    )


def _notify_all_applicants(db: Session, *, title: str, message: str, type: str, link: str = "/user/notifications") -> int:
    applicants = db.query(models.Applicant).filter(models.Applicant.is_active == True).all()  # noqa: E712
    for applicant in applicants:
        db.add(models.Notification(
            applicant_id=applicant.id,
            recipient_user_id=applicant.id,
            recipient_role="candidate",
            notification_category=type or "candidate",
            recipient_scope="applicant",
            type=type,
            title=title,
            message=message,
            link=link,
            read=False,
        ))
    return len(applicants)


def _role_value(role) -> str:
    return role.value if hasattr(role, "value") else str(role or "")


def _summary(text: str, limit: int = 160) -> str:
    clean = " ".join((text or "").split())
    return clean if len(clean) <= limit else f"{clean[: limit - 1].rstrip()}..."


def _email_link(link: str) -> str:
    if link and link.startswith("/"):
        return f"{settings.FRONTEND_URL}{link}"
    return link or settings.FRONTEND_URL


def _send_announcement_email(to_email: str, *, name: str, title: str, message: str, type: str, link: str, company_name: str = "") -> bool:
    try:
        result = send_notification_email(to_email, "employee_company_announcement", {
            "subject": title,
            "title": title,
            "message": message,
            "user_name": name or "there",
            "employee_name": name or "there",
            "company_name": company_name or "TalentFlow",
            "announcement_title": title,
            "summary": _summary(message),
            "badge": "Platform Announcement",
            "tone": "danger" if type == "critical" else ("warning" if type in ("warning", "maintenance") else "success" if type == "success" else ""),
            "cta_label": "Open TalentFlow",
            "action_url": _email_link(link),
        })
        delivered = bool(result.get("sent") or result.get("dev_mode"))
        if not delivered:
            log.warning("[ANNOUNCEMENT-EMAIL] Provider did not accept %s: %s", to_email, result)
        return delivered
    except Exception as exc:
        log.warning("[ANNOUNCEMENT-EMAIL] Failed to %s: %s", to_email, exc)
        return False


def _deliver_platform_message(
    db: Session,
    sa: models.SuperAdmin,
    *,
    title: str,
    message: str,
    type: str,
    target: str = "all",
    company_id: Optional[int] = None,
    link: str = "/hr/notifications",
    send_email_to_candidates: bool = True,
) -> dict:
    target_key = (target or "all").lower()
    notif_type = type or "announcement_info"
    stats = {"hr_notifications": 0, "candidate_notifications": 0, "emails": 0}

    hr_query = db.query(models.HRUser).filter(models.HRUser.status == "active")
    if company_id:
        hr_query = hr_query.filter(models.HRUser.company_id == company_id)
    elif target_key in ("employees", "all_employees"):
        hr_query = hr_query.filter(models.HRUser.role != models.HRRole.super_admin)
    elif target_key in ("recruiters", "all_recruiters"):
        hr_query = hr_query.filter(models.HRUser.role.in_([
            models.HRRole.admin,
            models.HRRole.hr_manager,
            models.HRRole.hiring_manager,
        ]))
    elif target_key in ("candidates", "candidate", "all_candidates", "applicants"):
        hr_query = hr_query.filter(models.HRUser.id == -1)
    elif target_key in ("companies", "all_companies", "company_admins"):
        hr_query = hr_query.filter(models.HRUser.role.in_([
            models.HRRole.admin,
            models.HRRole.hr_manager,
            models.HRRole.hiring_manager,
        ]))
    elif target_key in ("all", "all_users", "everyone"):
        hr_query = hr_query.filter(models.HRUser.role != models.HRRole.super_admin)

    companies_by_id = {c.id: c for c in db.query(models.Company).all()}
    emailed = set()
    for user in hr_query.all():
        role = _role_value(user.role)
        user_link = link or "/hr/notifications"
        notif = models.Notification(
            company_id=user.company_id,
            created_by=sa.id,
            recipient_scope="specific_user",
            recipient_user_id=user.id,
            recipient_role="interviewer" if role == "interviewer" else "hr_manager",
            notification_category=notif_type,
            type=notif_type,
            title=title,
            message=message,
            link=user_link,
            read=False,
            is_read=False,
        )
        db.add(notif)
        stats["hr_notifications"] += 1
        if user.email and user.email.lower() not in emailed:
            company = companies_by_id.get(user.company_id)
            if _send_announcement_email(user.email, name=user.name, title=title, message=message, type=type, link=user_link, company_name=getattr(company, "company_name", "")):
                notif.email_sent = True
                stats["emails"] += 1
            emailed.add(user.email.lower())

    if target_key in ("all", "all_users", "everyone", "candidates", "candidate", "all_candidates", "applicants") and not company_id:
        applicants = db.query(models.Applicant).filter(models.Applicant.is_active == True).all()  # noqa: E712
        for applicant in applicants:
            user_link = "/user/notifications"
            notif = models.Notification(
                applicant_id=applicant.id,
                recipient_user_id=applicant.id,
                recipient_role="candidate",
                notification_category=notif_type,
                recipient_scope="applicant",
                type=notif_type,
                title=title,
                message=message,
                link=user_link,
                read=False,
                is_read=False,
            )
            db.add(notif)
            stats["candidate_notifications"] += 1
            if send_email_to_candidates and applicant.email and applicant.email.lower() not in emailed:
                if _send_announcement_email(applicant.email, name=applicant.name, title=title, message=message, type=type, link=user_link):
                    notif.email_sent = True
                    stats["emails"] += 1
                emailed.add(applicant.email.lower())

    company_query = db.query(models.Company).filter(models.Company.contact_email != "")
    if company_id:
        company_query = company_query.filter(models.Company.id == company_id)
    elif target_key not in ("all", "all_users", "everyone", "companies", "all_companies", "company_admins"):
        company_query = company_query.filter(models.Company.id == -1)
    for company in company_query.all():
        email = (company.contact_email or "").lower()
        if email and email not in emailed:
            if _send_announcement_email(company.contact_email, name=company.contact_person or company.company_name, title=title, message=message, type=type, link="/hr/notifications", company_name=company.company_name):
                stats["emails"] += 1
            emailed.add(email)

    return stats

# ─── Auth ─────────────────────────────────────────────────────────────────────

class SAOTPVerifyRequest(BaseModel):
    challenge_token: str
    code: str


@router.post("/auth/login")
def sa_login(body: SALoginRequest, db: Session = Depends(get_db)):
    sa = db.query(models.SuperAdmin).filter(
        func.lower(models.SuperAdmin.email) == body.email.lower().strip()
    ).first()
    log.info("[SA-LOGIN] Attempt for email: %s", body.email)

    if not sa or not verify_password(body.password, sa.password_hash):
        log.warning("[SA-LOGIN] Invalid credentials for: %s", body.email)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not sa.is_active:
        log.warning("[SA-LOGIN] Inactive account: %s", body.email)
        raise HTTPException(status_code=403, detail="Account is deactivated")
    if not sa.email:
        log.error("[SA-LOGIN] Super Admin %s has no email — cannot send OTP", sa.id)
        raise HTTPException(status_code=500, detail="Account has no email configured")

    log.info("[SA-LOGIN] Super Admin found — id=%s email=%s", sa.id, sa.email)

    # Generate and store OTP
    code = f"{random.randint(0, 999999):06d}"
    sa.otp_code = code
    sa.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    log.info("[SA-OTP] Generated OTP for Super Admin %s", sa.email)

    subject, html = render_notification_email("hr_login_verification", {
        "subject": "TalentFlow Super Admin Login Code",
        "title": "Verify Super Admin Access",
        "user_name": sa.name,
        "employee_name": sa.name,
        "role": "Super Admin",
        "verification_code": code,
        "expires_in": "10 minutes",
        "message": "Use this secure verification code to access the TalentFlow Super Admin portal.",
        "badge": "Super Admin Access",
        "cta_label": "Verify Access",
        "action_url": f"{settings.FRONTEND_URL}/super-admin/login",
    })
    email_result = send_email(
        sa.email,
        subject,
        f"Hi {sa.name},\n\n"
        f"Your TalentFlow Super Admin login verification code is:\n\n"
        f"  {code}\n\n"
        f"This code expires in 10 minutes.\n\n"
        f"If you did not request this, please secure your account immediately.\n\n"
        f"— TalentFlow Security Team",
        html_body=html,
    )

    if email_result.get("dev_mode"):
        log.warning("[SA-OTP] SMTP not configured — OTP printed to terminal for %s", sa.email)
    elif email_result.get("sent"):
        log.info("[SA-OTP] Email sent successfully to %s", sa.email)
    else:
        log.error("[SA-OTP] Email FAILED for %s: %s", sa.email, email_result)

    challenge = create_access_token(
        {"sub": str(sa.id), "type": "sa_2fa"},
        timedelta(minutes=10),
    )
    return {
        "requires_2fa": True,
        "method": "email",
        "challenge_token": challenge,
        "email": sa.email,
        "message": "A 6-digit verification code has been sent to your email.",
        **(
            {"email_sent": True}
            if email_result.get("sent")
            else {
                "email_sent": False,
                **({"dev_code": code} if email_result.get("dev_mode") else {}),
                "message": (
                    "Email delivery is not configured. Use the verification code shown on this page."
                    if email_result.get("dev_mode")
                    else "Could not send the verification code. Please try again."
                ),
            }
        ),
    }


@router.post("/auth/verify-otp")
def sa_verify_otp(body: SAOTPVerifyRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.challenge_token)
    if not payload or payload.get("type") != "sa_2fa":
        raise HTTPException(status_code=400, detail="Invalid or expired challenge token")

    sa = db.query(models.SuperAdmin).filter(
        models.SuperAdmin.id == int(payload.get("sub", 0))
    ).first()
    if not sa:
        raise HTTPException(status_code=400, detail="Super Admin not found")

    code = body.code.strip()
    if not sa.otp_code or sa.otp_code != code:
        log.warning("[SA-2FA] Invalid OTP for %s", sa.email)
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if is_expired(sa.otp_expires):
        log.warning("[SA-2FA] Expired OTP for %s", sa.email)
        raise HTTPException(status_code=400, detail="Verification code has expired")

    sa.otp_code = None
    sa.otp_expires = None
    sa.last_login = datetime.utcnow()
    db.add(models.LoginHistory(user_id=sa.id, user_type="super_admin", status="success"))
    db.add(models.AccountActivity(user_id=sa.id, user_type="super_admin", action="login", description="Super Admin logged in"))
    db.commit()
    log.info("[SA-2FA] Super Admin login complete for %s", sa.email)

    token = create_access_token({"sub": str(sa.id), "type": "super_admin"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": sa.id, "name": sa.name, "email": sa.email, "role": "super_admin"},
    }


@router.get("/auth/me")
def sa_me(sa: models.SuperAdmin = Depends(get_current_super_admin)):
    return {"id": sa.id, "name": sa.name, "email": sa.email, "role": "super_admin", "is_active": sa.is_active, "created_at": sa.created_at}

@router.put("/auth/profile")
def update_sa_profile(
    body: SAProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    sa: models.SuperAdmin = Depends(get_current_super_admin),
):
    changed = []
    if body.name is not None and body.name.strip():
        sa.name = body.name.strip()
        changed.append("name")
    if body.email is not None and body.email.strip():
        new_email = body.email.lower().strip()
        exists = db.query(models.SuperAdmin).filter(
            func.lower(models.SuperAdmin.email) == new_email,
            models.SuperAdmin.id != sa.id,
        ).first()
        if exists:
            raise HTTPException(status_code=409, detail="Email is already used by another super admin")
        sa.email = new_email
        changed.append("email")
    if body.new_password:
        if not body.current_password or not verify_password(body.current_password, sa.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(body.new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        sa.password_hash = hash_password(body.new_password)
        changed.append("password")
    if not changed:
        raise HTTPException(status_code=400, detail="No valid profile changes submitted")
    db.commit()
    _audit(db, sa, f"Updated super admin profile: {', '.join(changed)}", "Profile", request=request)
    db.commit()
    return {"id": sa.id, "name": sa.name, "email": sa.email, "role": "super_admin", "message": "Profile updated"}

@router.post("/companies/check-registration")
def check_company_registration(body: CompanyRegistrationCheck, db: Session = Depends(get_db)):
    name = (body.company_name or "").strip().lower()
    email = (body.contact_email or "").strip().lower()
    q = db.query(models.Company)
    filters = []
    if name:
        filters.append(func.lower(models.Company.company_name) == name)
    if email:
        filters.append(func.lower(models.Company.contact_email) == email)
    if not filters:
        raise HTTPException(status_code=400, detail="Company name or contact email is required")
    from sqlalchemy import or_
    company = q.filter(or_(*filters)).first()
    if not company:
        return {"registered": False, "message": "Company is not registered"}
    return {
        "registered": True,
        "company": _company_out(company),
        "message": "Company registration found",
    }

# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def sa_dashboard(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    now = datetime.utcnow()
    companies = db.query(models.Company).all()
    total_co     = len(companies)
    active_co    = sum(1 for c in companies if c.is_active and c.subscription_status == "active")
    expired_co   = sum(1 for c in companies if c.subscription_end_date and c.subscription_end_date < now)
    suspended_co = sum(1 for c in companies if not c.is_active)

    total_hr_users    = db.query(func.count(models.HRUser.id)).scalar() or 0
    total_applicants  = db.query(func.count(models.Applicant.id)).scalar() or 0
    total_jobs        = db.query(func.count(models.Job.id)).scalar() or 0
    total_apps        = db.query(func.count(models.Application.id)).scalar() or 0
    total_ai_requests = db.query(func.count(models.AIUsageLog.id)).scalar() or 0

    # Revenue estimates based on plan prices
    monthly_rev = 0
    yearly_rev  = 0
    for c in companies:
        if c.is_active and c.subscription_status == "active":
            plan = PLAN_DEFAULTS.get(c.subscription_plan, {})
            monthly_rev += plan.get("monthly_price", 0)
            yearly_rev  += plan.get("yearly_price", 0)

    # Recent 6 months company growth
    months = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        label = d.strftime("%b")
        count = sum(1 for c in companies if c.created_at and c.created_at.replace(tzinfo=None) <= d)
        months.append({"month": label, "companies": count})

    # Plan distribution
    plan_dist = {}
    for c in companies:
        plan_dist[c.subscription_plan] = plan_dist.get(c.subscription_plan, 0) + 1

    # AI usage last 7 days
    ai_daily = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        cnt = db.query(func.count(models.AIUsageLog.id)).filter(
            models.AIUsageLog.created_at >= day_start,
            models.AIUsageLog.created_at < day_end,
        ).scalar() or 0
        ai_daily.append({"day": day.strftime("%a"), "requests": cnt})

    # Expiring soon (≤30 days)
    expiring_soon = [
        _company_out(c) for c in companies
        if c.subscription_end_date
        and 0 < (c.subscription_end_date - now).days <= 30
        and c.is_active
    ]

    return {
        "kpis": {
            "total_companies": total_co,
            "active_companies": active_co,
            "expired_subscriptions": expired_co,
            "suspended_companies": suspended_co,
            "total_hr_users": total_hr_users,
            "total_applicants": total_applicants,
            "total_jobs": total_jobs,
            "total_applications": total_apps,
            "total_ai_requests": total_ai_requests,
            "monthly_revenue": monthly_rev,
            "annual_revenue": yearly_rev,
        },
        "subscription_growth": months,
        "plan_distribution": [{"plan": k, "count": v} for k, v in plan_dist.items()],
        "ai_daily_usage": ai_daily,
        "expiring_soon": expiring_soon,
    }

# ─── Companies ────────────────────────────────────────────────────────────────

@router.get("/companies")
def list_companies(
    search: str = "", status_filter: str = "", plan_filter: str = "",
    db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)
):
    q = db.query(models.Company)
    if search:
        q = q.filter(models.Company.company_name.ilike(f"%{search}%"))
    if status_filter:
        q = q.filter(models.Company.subscription_status == status_filter)
    if plan_filter:
        q = q.filter(models.Company.subscription_plan == plan_filter)
    companies = q.order_by(models.Company.created_at.desc()).all()
    return [_company_out(c) for c in companies]

@router.post("/companies")
def create_company(body: CompanyCreate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    plan_cfg = PLAN_DEFAULTS.get(body.subscription_plan, PLAN_DEFAULTS["free_trial"])
    now = datetime.utcnow()
    end = now + timedelta(days=14) if body.subscription_plan == "free_trial" else now + timedelta(days=365)
    co = models.Company(
        company_name=body.company_name,
        industry=body.industry,
        contact_person=body.contact_person,
        contact_email=body.contact_email,
        contact_phone=body.contact_phone,
        subscription_plan=body.subscription_plan,
        subscription_status="active",
        subscription_start_date=now,
        subscription_end_date=end,
        max_users=body.max_users or plan_cfg["max_users"],
        max_jobs=body.max_jobs or plan_cfg["max_jobs"],
        max_ai_requests=body.max_ai_requests or plan_cfg["max_ai_requests"],
        notes=body.notes,
    )
    db.add(co)
    db.flush()
    temp_password = None
    admin_user = None
    if body.contact_email:
        existing = db.query(models.HRUser).filter(func.lower(models.HRUser.email) == body.contact_email.lower()).first()
        if not existing:
            temp_password = _temporary_password()
            admin_user = models.HRUser(
                company_id=co.id,
                employee_id=f"CADM-{co.id:04d}",
                name=body.contact_person or f"{body.company_name} Admin",
                email=body.contact_email,
                password_hash=hash_password(temp_password),
                role=models.HRRole.admin,
                title="Company Admin",
                department="Administration",
                status="active",
                two_factor_enabled=False,
                created_by=sa.id,
            )
            db.add(admin_user)
    db.commit()
    db.refresh(co)
    if admin_user and temp_password:
        welcome_company(db, co, admin_user)
        welcome_employee(db, admin_user, temporary_password=temp_password)
    _audit(db, sa, f"Created company: {co.company_name}", "Companies", company_id=co.id, request=request)
    db.commit()
    out = _company_out(co)
    out["admin_created"] = bool(admin_user)
    out["welcome_email_sent"] = bool(admin_user and temp_password)
    return out

@router.get("/companies/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    out = _company_out(co)
    out["tickets"] = [{"id": t.id, "subject": t.subject, "status": t.status, "priority": t.priority, "created_at": t.created_at} for t in co.tickets]
    out["ai_usage_count"] = len(co.ai_usage_logs)
    return out

@router.put("/companies/{company_id}")
def update_company(company_id: int, body: CompanyUpdate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    for field, val in body.dict(exclude_none=True).items():
        if field == "subscription_end_date" and isinstance(val, str):
            val = datetime.fromisoformat(val) if val else None
        setattr(co, field, val)
    db.commit()
    _audit(db, sa, f"Updated company: {co.company_name}", "Companies", company_id=co.id, request=request)
    db.commit()
    return _company_out(co)

@router.post("/companies/{company_id}/suspend")
def suspend_company(company_id: int, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    co.is_active = False
    co.subscription_status = "suspended"
    db.commit()
    _audit(db, sa, f"Suspended company: {co.company_name}", "Companies", company_id=co.id, request=request)
    db.commit()
    return {"message": "Company suspended"}

@router.post("/companies/{company_id}/reactivate")
def reactivate_company(company_id: int, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    co.is_active = True
    co.subscription_status = "active"
    db.commit()
    _audit(db, sa, f"Reactivated company: {co.company_name}", "Companies", company_id=co.id, request=request)
    db.commit()
    return {"message": "Company reactivated"}

@router.delete("/companies/{company_id}")
def delete_company(company_id: int, request: Request, hard_delete: bool = False, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    name = co.company_name
    if not hard_delete:
        co.is_deleted = True
        co.deleted_at = datetime.utcnow()
        co.deleted_by = sa.id
        co.is_active = False
        co.subscription_status = "cancelled"
        _audit(db, sa, f"Soft deleted company: {name}", "Companies", company_id=co.id, request=request)
        db.commit()
        return {"message": "Company soft deleted", "soft_delete": True}

    app_ids = [r[0] for r in db.query(models.Application.id).filter(models.Application.company_id == company_id).all()]
    if app_ids:
        db.query(models.ApplicationTimeline).filter(models.ApplicationTimeline.application_id.in_(app_ids)).delete(synchronize_session=False)
    db.query(models.InterviewFeedback).filter(models.InterviewFeedback.company_id == company_id).delete(synchronize_session=False)
    db.query(models.Interview).filter(models.Interview.company_id == company_id).delete(synchronize_session=False)
    db.query(models.Application).filter(models.Application.company_id == company_id).delete(synchronize_session=False)
    db.query(models.TalentPool).filter(models.TalentPool.company_id == company_id).delete(synchronize_session=False)
    db.query(models.Job).filter(models.Job.company_id == company_id).delete(synchronize_session=False)
    db.query(models.HiringRole).filter(models.HiringRole.company_id == company_id).delete(synchronize_session=False)
    db.query(models.Project).filter(models.Project.company_id == company_id).delete(synchronize_session=False)
    db.query(models.Notification).filter(models.Notification.company_id == company_id).delete(synchronize_session=False)
    db.query(models.Announcement).filter(models.Announcement.company_id == company_id).delete(synchronize_session=False)
    db.query(models.SupportTicket).filter(models.SupportTicket.company_id == company_id).delete(synchronize_session=False)
    db.query(models.AIUsageLog).filter(models.AIUsageLog.company_id == company_id).delete(synchronize_session=False)
    db.query(models.AuditLog).filter(models.AuditLog.company_id == company_id).delete(synchronize_session=False)
    db.query(models.HRUser).filter(models.HRUser.company_id == company_id).delete(synchronize_session=False)
    db.delete(co)
    _audit(db, sa, f"Hard deleted company: {name}", "Companies", request=request)
    db.commit()
    return {"message": "Company permanently deleted", "soft_delete": False}

@router.post("/companies/{company_id}/restore")
def restore_company(company_id: int, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    co.is_deleted = False
    co.deleted_at = None
    co.deleted_by = None
    co.is_active = True
    if co.subscription_status in ("cancelled", "suspended"):
        co.subscription_status = "active"
    _audit(db, sa, f"Restored company: {co.company_name}", "Companies", company_id=co.id, request=request)
    db.commit()
    return {"message": "Company restored"}


@router.post("/companies/{company_id}/alert")
def alert_company(company_id: int, body: CompanyAlertRequest, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    ann = models.Announcement(
        title=body.title,
        message=body.message,
        type=body.type or "warning",
        target=str(company_id),
        company_id=company_id,
    )
    db.add(ann)
    stats = _deliver_platform_message(
        db,
        sa,
        title=body.title,
        message=body.message,
        type=f"announcement_{body.type or 'warning'}",
        target="specific_company",
        company_id=company_id,
        link="/hr/notifications",
        send_email_to_candidates=False,
    )
    _audit(db, sa, f"Sent alert to company: {co.company_name}", "Companies", detail=body.title, company_id=co.id, request=request)
    db.commit()
    return {"message": "Company alert sent", "announcement_id": ann.id, **stats}

# ─── Subscription Management ─────────────────────────────────────────────────

class SubscriptionUpgrade(BaseModel):
    plan: str
    extend_days: int = 365

@router.post("/companies/{company_id}/subscription")
def update_subscription(company_id: int, body: SubscriptionUpgrade, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    co = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="Company not found")
    plan_cfg = PLAN_DEFAULTS.get(body.plan, PLAN_DEFAULTS["basic"])
    co.subscription_plan = body.plan
    co.subscription_status = "active"
    now = datetime.utcnow()
    base = max(co.subscription_end_date or now, now)
    co.subscription_end_date = base + timedelta(days=body.extend_days)
    co.max_users = plan_cfg["max_users"]
    co.max_jobs  = plan_cfg["max_jobs"]
    co.max_ai_requests = plan_cfg["max_ai_requests"]
    db.commit()
    _audit(db, sa, f"Changed plan to {body.plan} for {co.company_name}", "Subscriptions", company_id=co.id, request=request)
    db.commit()
    return _company_out(co)

@router.get("/plans")
def get_plans(sa: models.SuperAdmin = Depends(get_current_super_admin)):
    return [{"id": k, "name": k.replace("_", " ").title(), **v} for k, v in PLAN_DEFAULTS.items()]

# ─── Users ────────────────────────────────────────────────────────────────────

def _get_managed_user(db: Session, user_id: int, account_type: str = "employee"):
    account_type = (account_type or "employee").lower()
    if account_type in ("candidate", "applicant"):
        user = db.query(models.Applicant).filter(models.Applicant.id == user_id).first()
        return user, "candidate"
    user = db.query(models.HRUser).filter(models.HRUser.id == user_id).first()
    return user, "employee"

@router.get("/users")
def list_all_users(search: str = "", db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    q = db.query(models.HRUser)
    if search:
        q = q.filter(
            models.HRUser.name.ilike(f"%{search}%") |
            models.HRUser.email.ilike(f"%{search}%")
        )
    users = q.order_by(models.HRUser.created_at.desc()).all()
    hr_rows = [{
        "id": u.id,
        "account_type": "employee",
        "name": u.name,
        "email": u.email,
        "employee_id": u.employee_id,
        "role": u.role.value if hasattr(u.role, "value") else str(u.role),
        "department": u.department,
        "status": u.status,
        "company_id": u.company_id,
        "created_at": u.created_at,
    } for u in users]
    aq = db.query(models.Applicant)
    if search:
        aq = aq.filter(
            models.Applicant.name.ilike(f"%{search}%") |
            models.Applicant.email.ilike(f"%{search}%")
        )
    applicants = aq.order_by(models.Applicant.created_at.desc()).all()
    applicant_rows = [{
        "id": a.id,
        "account_type": "candidate",
        "name": a.name,
        "email": a.email,
        "employee_id": f"CAN-{a.id:04d}",
        "role": "candidate",
        "department": a.headline or a.location or "Candidate",
        "status": "active" if a.is_active else "inactive",
        "company_id": None,
        "created_at": a.created_at,
    } for a in applicants]
    return sorted(hr_rows + applicant_rows, key=lambda x: str(x.get("created_at") or ""), reverse=True)


@router.post("/users/hr", status_code=201)
def create_hr_user(body: SAHRUserCreate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    if db.query(models.HRUser).filter(models.HRUser.email.ilike(body.email.strip())).first():
        raise HTTPException(status_code=400, detail="Employee email already exists")
    company = db.query(models.Company).filter(models.Company.id == body.company_id).first() if body.company_id else None
    role = models.HRRole.__members__.get(body.role, models.HRRole.hr_manager)
    employee_id = body.employee_id or f"EMP-{int(datetime.utcnow().timestamp())}"
    user = models.HRUser(
        company_id=company.id if company else None,
        employee_id=employee_id,
        name=body.name.strip(),
        email=body.email.strip().lower(),
        password_hash=hash_password(body.password),
        role=role,
        department=body.department,
        title=body.title,
        status=body.status if body.status in ("active", "inactive") else "active",
        two_factor_enabled=False,
        created_by=sa.id,
    )
    db.add(user)
    db.flush()
    welcome_employee(db, user)
    db.commit()
    db.refresh(user)
    _audit(db, sa, f"Created employee user: {user.email}", "Users", company_id=user.company_id, request=request)
    db.commit()
    return {"message": "Employee created", "id": user.id}


@router.post("/users/applicants", status_code=201)
def create_applicant_user(body: SAApplicantCreate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    if db.query(models.Applicant).filter(models.Applicant.email.ilike(body.email.strip())).first():
        raise HTTPException(status_code=400, detail="Candidate email already exists")
    applicant = models.Applicant(
        name=body.name.strip(),
        email=body.email.strip().lower(),
        password_hash=hash_password(body.password),
        phone=body.phone,
        location=body.location,
        headline=body.headline,
        is_active=body.status != "inactive",
        is_verified=True,
    )
    db.add(applicant)
    db.flush()
    if not db.query(models.ApplicantSettings).filter(models.ApplicantSettings.applicant_id == applicant.id).first():
        db.add(models.ApplicantSettings(applicant_id=applicant.id))
    welcome_candidate(db, applicant)
    db.commit()
    db.refresh(applicant)
    _audit(db, sa, f"Created candidate user: {applicant.email}", "Users", request=request)
    db.commit()
    return {"message": "Candidate created", "id": applicant.id}

@router.post("/users/{user_id}/disable")
def disable_user(user_id: int, request: Request, account_type: str = "employee", db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    u, managed_type = _get_managed_user(db, user_id, account_type)
    if not u:
        raise HTTPException(404, "User not found")
    if managed_type == "candidate":
        u.is_active = False
    else:
        u.status = "inactive"
    db.commit()
    _audit(db, sa, f"Disabled {managed_type}: {u.email}", "Users", request=request)
    db.commit()
    return {"message": "User disabled"}

@router.post("/users/{user_id}/enable")
def enable_user(user_id: int, request: Request, account_type: str = "employee", db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    u, managed_type = _get_managed_user(db, user_id, account_type)
    if not u:
        raise HTTPException(404, "User not found")
    if managed_type == "candidate":
        u.is_active = True
    else:
        u.status = "active"
    db.commit()
    _audit(db, sa, f"Enabled {managed_type}: {u.email}", "Users", request=request)
    db.commit()
    return {"message": "User enabled"}

class PasswordResetRequest(BaseModel):
    new_password: str

@router.post("/users/{user_id}/reset-password")
def reset_user_password(user_id: int, body: PasswordResetRequest, request: Request, account_type: str = "employee", db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    u, managed_type = _get_managed_user(db, user_id, account_type)
    if not u:
        raise HTTPException(404, "User not found")
    u.password_hash = hash_password(body.new_password)
    db.commit()
    _audit(db, sa, f"Reset password for {managed_type}: {u.email}", "Users", request=request)
    db.commit()
    return {"message": "Password reset successfully"}


@router.delete("/users/by-email")
def delete_user_by_email(
    body: UserDeleteByEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
    sa: models.SuperAdmin = Depends(get_current_super_admin),
):
    email = body.email.lower().strip()
    deleted = {"email": email, "applicants": 0, "hr_users": 0}

    applicant = db.query(models.Applicant).filter(func.lower(models.Applicant.email) == email).first()
    if applicant:
        app_ids = [row[0] for row in db.query(models.Application.id).filter(models.Application.applicant_id == applicant.id).all()]
        interview_ids = [row[0] for row in db.query(models.Interview.id).filter(models.Interview.applicant_id == applicant.id).all()]
        if app_ids:
            db.query(models.ApplicationTimeline).filter(models.ApplicationTimeline.application_id.in_(app_ids)).delete(synchronize_session=False)
        if interview_ids:
            db.query(models.InterviewFeedback).filter(models.InterviewFeedback.interview_id.in_(interview_ids)).delete(synchronize_session=False)
            db.query(models.InterviewNote).filter(models.InterviewNote.interview_id.in_(interview_ids)).delete(synchronize_session=False)
        db.query(models.Interview).filter(models.Interview.applicant_id == applicant.id).delete(synchronize_session=False)
        db.query(models.Application).filter(models.Application.applicant_id == applicant.id).delete(synchronize_session=False)
        db.query(models.TalentPool).filter(models.TalentPool.candidate_id == applicant.id).delete(synchronize_session=False)
        db.query(models.Contract).filter(
            or_(models.Contract.applicant_id == applicant.id, func.lower(models.Contract.candidate_email) == email)
        ).delete(synchronize_session=False)
        db.query(models.Notification).filter(
            or_(models.Notification.applicant_id == applicant.id, models.Notification.recipient_user_id == applicant.id)
        ).delete(synchronize_session=False)
        ticket_ids = [row[0] for row in db.query(models.SupportTicket.id).filter(
            or_(models.SupportTicket.requester_id == applicant.id, func.lower(models.SupportTicket.requester_email) == email)
        ).all()]
        if ticket_ids:
            db.query(models.SupportAttachment).filter(models.SupportAttachment.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(models.TicketMessage).filter(models.TicketMessage.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(models.TicketReply).filter(models.TicketReply.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(models.SupportTicket).filter(models.SupportTicket.id.in_(ticket_ids)).delete(synchronize_session=False)
        db.delete(applicant)
        deleted["applicants"] = 1

    hr_user = db.query(models.HRUser).filter(func.lower(models.HRUser.email) == email).first()
    if hr_user:
        if _role_value(hr_user.role) == "super_admin":
            raise HTTPException(status_code=400, detail="Refusing to delete the platform super admin account")
        db.query(models.LoginHistory).filter(models.LoginHistory.user_id == hr_user.id, models.LoginHistory.user_type == "hr").delete(synchronize_session=False)
        db.query(models.AccountActivity).filter(models.AccountActivity.user_id == hr_user.id, models.AccountActivity.user_type == "hr").delete(synchronize_session=False)
        ticket_ids = [row[0] for row in db.query(models.SupportTicket.id).filter(
            or_(models.SupportTicket.requester_id == hr_user.id, func.lower(models.SupportTicket.requester_email) == email)
        ).all()]
        if ticket_ids:
            db.query(models.SupportAttachment).filter(models.SupportAttachment.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(models.TicketMessage).filter(models.TicketMessage.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(models.TicketReply).filter(models.TicketReply.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(models.SupportTicket).filter(models.SupportTicket.id.in_(ticket_ids)).delete(synchronize_session=False)
        db.delete(hr_user)
        deleted["hr_users"] = 1

    if not deleted["applicants"] and not deleted["hr_users"]:
        return {**deleted, "deleted": False, "message": "No user found for this email"}

    _audit(db, sa, f"Deleted user by email: {email}", "Users", request=request)
    db.commit()
    return {**deleted, "deleted": True}

# ─── Support Tickets ──────────────────────────────────────────────────────────

@router.get("/tickets")
def list_tickets(status_filter: str = "", db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    q = db.query(models.SupportTicket)
    if status_filter:
        q = q.filter(models.SupportTicket.status == status_filter)
    tickets = q.order_by(models.SupportTicket.created_at.desc()).all()
    result = []
    for t in tickets:
        co = db.query(models.Company).filter(models.Company.id == t.company_id).first()
        result.append({
            "id": t.id,
            "company_id": t.company_id,
            "company_name": co.company_name if co else "Unknown",
            "subject": t.subject,
            "message": t.message,
            "priority": t.priority,
            "status": t.status,
            "reply_count": len(t.replies),
            "created_at": t.created_at,
        })
    return result

@router.post("/tickets")
def create_ticket(body: TicketCreate, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    t = models.SupportTicket(**body.dict())
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"id": t.id, "message": "Ticket created"}

@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Ticket not found")
    co = db.query(models.Company).filter(models.Company.id == t.company_id).first()
    return {
        "id": t.id, "company_id": t.company_id, "company_name": co.company_name if co else "Unknown",
        "subject": t.subject, "message": t.message, "priority": t.priority, "status": t.status,
        "created_at": t.created_at,
        "replies": [{"id": r.id, "author": r.author, "message": r.message, "created_at": r.created_at} for r in t.replies],
    }

@router.post("/tickets/{ticket_id}/reply")
def reply_ticket(ticket_id: int, body: TicketReplyCreate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Ticket not found")
    reply = models.TicketReply(ticket_id=ticket_id, author=sa.name, message=body.message)
    db.add(reply)
    if t.status == "Open":
        t.status = "In Progress"
    db.commit()
    _audit(db, sa, f"Replied to ticket #{ticket_id}", "Support", request=request)
    db.commit()
    return {"message": "Reply added"}

@router.put("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, body: dict, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Ticket not found")
    t.status = body.get("status", t.status)
    db.commit()
    _audit(db, sa, f"Updated ticket #{ticket_id} status to {t.status}", "Support", request=request)
    db.commit()
    return {"message": "Status updated"}

# ─── Announcements ────────────────────────────────────────────────────────────

@router.get("/announcements")
def list_announcements(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    items = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
    result = []
    for a in items:
        co = db.query(models.Company).filter(models.Company.id == a.company_id).first() if a.company_id else None
        result.append({
            "id": a.id, "title": a.title, "message": a.message,
            "type": a.type, "target": a.target, "company_id": a.company_id,
            "company_name": co.company_name if co else None,
            "created_at": a.created_at,
        })
    return result

@router.post("/announcements")
def create_announcement(body: AnnouncementCreate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    target = (body.target or "all").lower()
    company_id = body.company_id if target in ("company", "specific_company") else None
    if target in ("company", "specific_company") and not company_id:
        raise HTTPException(status_code=400, detail="Please choose a company for a targeted announcement")
    if company_id and not db.query(models.Company.id).filter(models.Company.id == company_id).first():
        raise HTTPException(status_code=404, detail="Company not found")

    a = models.Announcement(
        title=body.title,
        message=body.message,
        type=body.type,
        target="company" if company_id else target,
        company_id=company_id,
    )
    db.add(a)
    db.flush()

    stats = _deliver_platform_message(
        db,
        sa,
        title=body.title,
        message=body.message,
        type=f"announcement_{body.type}",
        target="specific_company" if company_id else target,
        company_id=company_id,
        link="/hr/notifications",
        send_email_to_candidates=True,
    )
    db.add(_sa_notification(
        sa,
        title=f"Announcement published: {body.title}",
        message=f"Delivered to {stats['hr_notifications']} employees, {stats['candidate_notifications']} candidates, and {stats['emails']} email inboxes.",
        type="announcement",
        link="/super-admin/announcements",
    ))
    db.commit()
    db.refresh(a)
    _audit(db, sa, f"Created announcement: {a.title}", "Announcements", request=request)
    db.commit()
    return {"id": a.id, "message": "Announcement created", **stats}

@router.delete("/announcements/{ann_id}")
def delete_announcement(ann_id: int, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    a = db.query(models.Announcement).filter(models.Announcement.id == ann_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    db.delete(a)
    db.commit()
    return {"message": "Deleted"}

# ─── AI Usage ─────────────────────────────────────────────────────────────────

@router.get("/ai-usage")
def get_ai_usage(days: int = 30, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    logs = db.query(models.AIUsageLog).filter(models.AIUsageLog.created_at >= cutoff).order_by(models.AIUsageLog.created_at.desc()).all()

    by_action: dict = {}
    by_model: dict = {}
    by_company: dict = {}
    daily: dict = {}

    for l in logs:
        by_action[l.action] = by_action.get(l.action, 0) + 1
        by_model[l.model or "unknown"] = by_model.get(l.model or "unknown", 0) + 1
        cid = l.company_id or 0
        if cid not in by_company:
            by_company[cid] = {"company_id": cid, "requests": 0, "tokens": 0, "top_action": None, "_actions": {}}
        by_company[cid]["requests"] += 1
        by_company[cid]["tokens"] += l.tokens_used or 0
        by_company[cid]["_actions"][l.action] = by_company[cid]["_actions"].get(l.action, 0) + 1
        date_key = l.created_at.strftime("%Y-%m-%d") if l.created_at else "unknown"
        if date_key not in daily:
            daily[date_key] = {"date": date_key, "requests": 0, "tokens": 0}
        daily[date_key]["requests"] += 1
        daily[date_key]["tokens"] += l.tokens_used or 0

    # Enrich company data
    company_list = []
    for cid, cd in by_company.items():
        co = db.query(models.Company).filter(models.Company.id == cid).first() if cid else None
        top = max(cd["_actions"].items(), key=lambda x: x[1])[0] if cd["_actions"] else None
        company_list.append({
            "company_id": cid, "company_name": co.company_name if co else "Unknown",
            "requests": cd["requests"], "tokens": cd["tokens"], "top_action": top,
            "max_ai_requests": co.max_ai_requests if co else 0,
        })

    return {
        "total_requests": len(logs),
        "total_tokens": sum(l.tokens_used or 0 for l in logs),
        "by_action": [{"action": k, "count": v} for k, v in by_action.items()],
        "by_model": [{"model": k, "count": v} for k, v in by_model.items()],
        "by_company": sorted(company_list, key=lambda x: x["requests"], reverse=True),
        "daily": sorted(daily.values(), key=lambda x: x["date"]),
    }

# ─── Audit Logs ───────────────────────────────────────────────────────────────

@router.get("/audit-logs")
def get_audit_logs(
    module: str = "", search: str = "", limit: int = 50, skip: int = 0,
    db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)
):
    q = db.query(models.AuditLog)
    if module:
        q = q.filter(models.AuditLog.module.ilike(module))
    if search:
        q = q.filter(
            models.AuditLog.action.ilike(f"%{search}%") |
            models.AuditLog.user.ilike(f"%{search}%") |
            models.AuditLog.ip_address.ilike(f"%{search}%")
        )
    total = q.count()
    logs = q.order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    items = []
    for l in logs:
        co = db.query(models.Company).filter(models.Company.id == l.company_id).first() if l.company_id else None
        items.append({
            "id": l.id, "user": l.user, "action": l.action, "module": l.module,
            "detail": l.detail, "ip_address": l.ip_address, "created_at": l.created_at,
            "company_id": l.company_id, "company_name": co.company_name if co else None,
        })
    return {"items": items, "total": total}

# ─── Seed default Super Admin if none exists ─────────────────────────────────

def seed_super_admin(db: Session):
    existing = db.query(models.SuperAdmin).first()
    if not existing:
        sa = models.SuperAdmin(
            name="TalentFlow Owner",
            email="owner@talentflow.com",
            password_hash=hash_password("SuperAdmin@123"),
        )
        db.add(sa)
        db.commit()
        print("[SEED] Super Admin created: owner@talentflow.com / SuperAdmin@123")


# ─── Full Super Admin Profile / Settings / Notification Center ───────────────

class SAFullProfileUpdate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class SA2FAUpdate(BaseModel):
    enabled: bool

class SASettingsUpdate(BaseModel):
    security: Optional[Dict[str, Any]] = None
    password: Optional[Dict[str, Any]] = None
    email_notifications: Optional[Dict[str, Any]] = None
    platform: Optional[Dict[str, Any]] = None
    subscription: Optional[Dict[str, Any]] = None
    ai: Optional[Dict[str, Any]] = None

class SANotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "system_announcement"
    recipient_scope: str = "all_companies"  # all_companies / specific_company / company_admins
    company_id: Optional[int] = None
    send_email: bool = False
    link: str = "/hr/notifications"


def _sa_profile_out(sa) -> dict:
    # Works for BOTH the dedicated SuperAdmin model and an HRUser carrying the
    # super_admin role (the unified-login path). HRUser exposes `status` instead
    # of `is_active`, so derive the active flag defensively to avoid a 500.
    is_active = getattr(sa, "is_active", None)
    if is_active is None:
        is_active = getattr(sa, "status", "active") == "active"
    return {
        "id": sa.id,
        "full_name": sa.name,
        "name": sa.name,
        "email": sa.email,
        "phone": getattr(sa, "phone", "") or "",
        "role": "SuperAdmin",
        "profile_picture": getattr(sa, "profile_picture", "") or "",
        "two_factor_enabled": bool(getattr(sa, "two_factor_enabled", True)),
        "created_at": sa.created_at,
        "created_date": sa.created_at,
        "last_login": getattr(sa, "last_login", None),
        "is_active": bool(is_active),
    }

@router.get("/profile")
def get_full_profile(sa: models.SuperAdmin = Depends(get_current_super_admin)):
    return _sa_profile_out(sa)

@router.put("/profile")
def update_full_profile(body: SAFullProfileUpdate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    changed = []
    full_name = body.full_name or body.name
    if full_name is not None and full_name.strip():
        sa.name = full_name.strip(); changed.append("full_name")
    if body.phone is not None:
        sa.phone = body.phone.strip(); changed.append("phone")
    if body.email is not None and body.email.strip():
        new_email = body.email.lower().strip()
        exists = db.query(models.SuperAdmin).filter(func.lower(models.SuperAdmin.email) == new_email, models.SuperAdmin.id != sa.id).first()
        if exists:
            raise HTTPException(status_code=409, detail="Email is already used by another super admin")
        sa.email = new_email; changed.append("email")
    if body.new_password:
        if not body.current_password or not verify_password(body.current_password, sa.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(body.new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        sa.password_hash = hash_password(body.new_password); changed.append("password")
    db.add(models.AccountActivity(user_id=sa.id, user_type="super_admin", action="profile_update", description=", ".join(changed) or "Viewed profile"))
    db.commit(); db.refresh(sa)
    _audit(db, sa, f"Updated full profile: {', '.join(changed)}", "Profile", request=request)
    db.commit()
    return _sa_profile_out(sa)

@router.post("/profile/avatar")
async def upload_profile_picture(file: UploadFile = File(...), db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    import os
    from config import settings
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    content = await file.read()
    if len(content) > 3 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be 3MB or smaller")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe = f"super_admin_{sa.id}_{file.filename}".replace("/", "_").replace("\\", "_")
    path = os.path.join(settings.UPLOAD_DIR, safe)
    with open(path, "wb") as f:
        f.write(content)
    sa.profile_picture = f"/uploads/{safe}"
    db.add(models.AccountActivity(user_id=sa.id, user_type="super_admin", action="avatar_upload", description="Updated profile picture"))
    db.commit()
    return {"profile_picture": sa.profile_picture}

@router.put("/password")
def change_password(body: SAFullProfileUpdate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    if not body.current_password or not body.new_password:
        raise HTTPException(status_code=400, detail="Current and new password are required")
    return update_full_profile(body, request, db, sa)

@router.put("/email")
def change_email(body: SAFullProfileUpdate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    if not body.email:
        raise HTTPException(status_code=400, detail="Email is required")
    return update_full_profile(body, request, db, sa)

@router.put("/2fa")
def set_two_factor(body: SA2FAUpdate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    sa.two_factor_enabled = body.enabled
    db.add(models.AccountActivity(user_id=sa.id, user_type="super_admin", action="2fa_update", description=f"2FA {'enabled' if body.enabled else 'disabled'}"))
    _audit(db, sa, f"2FA {'enabled' if body.enabled else 'disabled'}", "Security", request=request)
    db.commit()
    return {"two_factor_enabled": sa.two_factor_enabled}

@router.get("/login-history")
def login_history(limit: int = 25, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    rows = db.query(models.LoginHistory).filter(models.LoginHistory.user_id == sa.id, models.LoginHistory.user_type == "super_admin").order_by(models.LoginHistory.login_time.desc()).limit(limit).all()
    return [{"id": r.id, "ip_address": r.ip_address, "device": r.device, "browser": r.browser, "status": r.status, "login_time": r.login_time} for r in rows]

@router.get("/activity")
def account_activity(limit: int = 50, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    rows = db.query(models.AccountActivity).filter(models.AccountActivity.user_id == sa.id, models.AccountActivity.user_type == "super_admin").order_by(models.AccountActivity.created_at.desc()).limit(limit).all()
    return [{"id": r.id, "action": r.action, "description": r.description, "created_at": r.created_at} for r in rows]

DEFAULT_SETTINGS = {
    "security": {"require_2fa": True, "session_timeout_minutes": 60},
    "password": {"minimum_length": 8, "require_complexity": True, "rotation_days": 90},
    "email_notifications": {"login_alerts": True, "company_alerts": True, "subscription_alerts": True},
    "platform": {"platform_name": "TalentFlow", "timezone": "Asia/Riyadh", "language": "en"},
    "subscription": {"soft_delete_companies": True, "trial_days": 14, "default_plan": "free_trial"},
    "ai": {"model": "gpt-4o-mini", "monthly_token_limit": 200000, "enabled": True},
}

@router.get("/settings")
def get_settings(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    result = dict(DEFAULT_SETTINGS)
    rows = db.query(models.SuperAdminSetting).all()
    for row in rows:
        result[row.key] = row.value
    return result

@router.put("/settings")
def update_settings(body: SASettingsUpdate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    data = body.model_dump(exclude_none=True)
    for key, value in data.items():
        row = db.query(models.SuperAdminSetting).filter(models.SuperAdminSetting.key == key).first()
        if row:
            row.value = value
        else:
            db.add(models.SuperAdminSetting(key=key, value=value))
    db.add(models.AccountActivity(user_id=sa.id, user_type="super_admin", action="settings_update", description=", ".join(data.keys())))
    _audit(db, sa, "Updated Super Admin settings", "Settings", detail=", ".join(data.keys()), request=request)
    db.commit()
    return get_settings(db, sa)

@router.get("/notifications")
def list_sa_notifications(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    rows = db.query(models.Notification).filter(
        models.Notification.recipient_role == "super_admin"
    ).order_by(models.Notification.created_at.desc()).limit(200).all()

    def section_for(notif: models.Notification) -> str:
        key = f"{notif.notification_category or ''} {notif.type or ''} {notif.title or ''}".lower()
        if any(word in key for word in ["security", "login", "auth", "2fa", "password"]):
            return "Security Alerts"
        if any(word in key for word in ["health", "error", "failed", "critical", "system"]):
            return "System Health"
        if any(word in key for word in ["analytics", "report", "insight"]):
            return "Analytics Reports"
        return "Platform Events"

    def severity_for(notif: models.Notification) -> str:
        key = f"{notif.notification_category or ''} {notif.type or ''} {notif.title or ''} {notif.message or ''}".lower()
        if any(word in key for word in ["critical", "failed", "error", "down", "security"]):
            return "Critical"
        if any(word in key for word in ["warning", "pending", "attention"]):
            return "Warning"
        if any(word in key for word in ["success", "published", "sent", "created"]):
            return "Success"
        return "Info"

    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "notification_category": n.notification_category,
        "section": section_for(n),
        "severity": severity_for(n),
        "company_id": n.company_id,
        "applicant_id": n.applicant_id,
        "created_by": n.created_by,
        "created_at": n.created_at,
        "is_read": bool(n.is_read or n.read),
        "recipient_scope": n.recipient_scope,
        "email_sent": n.email_sent,
        "link": n.link,
    } for n in rows]

@router.post("/notifications", status_code=201)
def create_sa_notification(body: SANotificationCreate, request: Request, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    if body.recipient_scope == "specific_company" and not body.company_id:
        raise HTTPException(status_code=400, detail="Please choose a company for this notification")
    if body.company_id and not db.query(models.Company.id).filter(models.Company.id == body.company_id).first():
        raise HTTPException(status_code=404, detail="Company not found")
    target = "specific_company" if body.recipient_scope == "specific_company" else body.recipient_scope
    stats = _deliver_platform_message(
        db,
        sa,
        title=body.title,
        message=body.message,
        type=body.type,
        target=target,
        company_id=body.company_id if body.recipient_scope in ("specific_company", "company_admins") else None,
        link=body.link or "/hr/notifications",
        send_email_to_candidates=True,
    )
    db.add(_sa_notification(
        sa,
        title=f"Notification sent: {body.title}",
        message=f"{body.message}\n\nDelivered to {stats['hr_notifications']} employees, {stats['candidate_notifications']} candidates, and {stats['emails']} email inboxes.",
        type=body.type,
        link="/super-admin/notifications",
    ))
    db.add(models.AccountActivity(user_id=sa.id, user_type="super_admin", action="notification_sent", description=body.title))
    _audit(db, sa, "Sent platform notification", "Notifications", detail=body.title, company_id=body.company_id, request=request)
    db.commit()
    return {"message": "Notification sent", **stats}

@router.put("/notifications/{notification_id}/read")
def mark_sa_notification_read(notification_id: int, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_role == "super_admin",
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True; notif.read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.delete("/notifications/{notification_id}")
def delete_sa_notification(notification_id: int, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_role == "super_admin",
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
