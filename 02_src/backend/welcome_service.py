from __future__ import annotations

from datetime import datetime

from config import settings
from email_service import send_email
from NotificationEmailService import render_notification_email
import models


def _frontend_url(path: str) -> str:
    base = getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")
    return f"{base}{path}"


def _role_value(user: models.HRUser) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role or "")


def _company_name(db, company_id) -> str:
    if not company_id:
        return "TalentFlow"
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    return company.company_name if company else "TalentFlow"


def welcome_candidate(db, applicant: models.Applicant) -> dict:
    title = "Welcome to TalentFlow!"
    message = "Your account is ready. Complete your profile to increase visibility to recruiters."
    link = "/user/profile"
    notification = models.Notification(
        applicant_id=applicant.id,
        recipient_user_id=applicant.id,
        recipient_role="candidate",
        notification_category="welcome",
        recipient_scope="applicant",
        type="welcome",
        title=title,
        message=message,
        link=link,
        read=False,
        is_read=False,
    )
    db.add(notification)
    _, html = render_notification_email("employee_profile_completion", {
        "user_name": applicant.name,
        "employee_name": applicant.name,
        "completion_percent": applicant.profile_completion or 0,
        "message": message,
        "action_url": _frontend_url(link),
        "cta_label": "Complete Profile",
    })
    result = send_email(applicant.email, title, f"Hi {applicant.name},\n\n{message}\n\nTalentFlow Team", html_body=html)
    notification.email_sent = bool(result.get("sent") or result.get("dev_mode"))
    return result


def welcome_employee(db, user: models.HRUser, *, temporary_password: str | None = None) -> dict:
    company_name = _company_name(db, user.company_id)
    title = "Welcome to TalentFlow!"
    password_note = f" Temporary password: {temporary_password}. Please change it after your first login." if temporary_password else ""
    message = f"Your {company_name} workspace account is ready.{password_note}"
    link = "/hr/dashboard"
    role = _role_value(user)
    notification = models.Notification(
        company_id=user.company_id,
        recipient_user_id=user.id,
        recipient_role="interviewer" if role == "interviewer" else "hr_manager",
        notification_category="welcome",
        recipient_scope="specific_user",
        type="welcome",
        title=title,
        message=message,
        link=link,
        read=False,
        is_read=False,
    )
    db.add(notification)
    _, html = render_notification_email("employee_welcome", {
        "user_name": user.name,
        "employee_name": user.name,
        "department": user.department or "Team",
        "manager": company_name,
        "start_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "message": message,
        "action_url": _frontend_url("/hr/login"),
        "cta_label": "Open Employee Portal",
    })
    result = send_email(user.email, title, f"Hi {user.name},\n\n{message}\n\nTalentFlow Team", html_body=html)
    notification.email_sent = bool(result.get("sent") or result.get("dev_mode"))
    return result


def welcome_company(db, company: models.Company, admin: models.HRUser) -> dict:
    title = "Your Organization Has Been Successfully Activated"
    message = f"{company.company_name} is active on TalentFlow. Your company dashboard is ready."
    link = "/hr/dashboard"
    notification = models.Notification(
        company_id=company.id,
        recipient_user_id=admin.id,
        recipient_role="hr_manager",
        notification_category="welcome",
        recipient_scope="company_admins",
        type="welcome",
        title=title,
        message=message,
        link=link,
        read=False,
        is_read=False,
    )
    db.add(notification)
    _, html = render_notification_email("company_registration_approved", {
        "user_name": admin.name,
        "organization_name": company.company_name,
        "plan": company.subscription_plan,
        "activation_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "message": message,
        "action_url": _frontend_url(link),
        "cta_label": "Open Dashboard",
    })
    result = send_email(admin.email, title, f"Hi {admin.name},\n\n{message}\n\nTalentFlow Team", html_body=html)
    notification.email_sent = bool(result.get("sent") or result.get("dev_mode"))
    return result
