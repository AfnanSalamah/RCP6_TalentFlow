from __future__ import annotations

from EmailRenderer import render_premium_email
from email_service import send_email


def paragraph(text: str) -> str:
    return f"<p style=\"margin:0 0 14px;\">{text}</p>"


def details_table(items: dict) -> str:
    rows = "".join(
        f"<tr><td style=\"padding:8px 0;color:#64748B;font-size:13px;\">{label}</td>"
        f"<td style=\"padding:8px 0;color:#0F172A;font-size:13px;font-weight:700;text-align:right;\">{value or '-'}</td></tr>"
        for label, value in items.items()
    )
    return f"<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:18px 0;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;\">{rows}</table>"


EMAIL_COPY = {
    "welcome": ("Welcome to TalentFlow", "Complete Profile"),
    "verification": ("Verify Your Email Address", "Verify Email"),
    "password_reset": ("Reset Your Password", "Reset Password"),
    "application": ("Application Received", "View Application"),
    "interview": ("Interview Invitation", "View Interview"),
    "interview_reminder": ("Interview Reminder", "Join Interview"),
    "interview_result": ("Interview Update", "View Status"),
    "offer": ("Congratulations! You Received an Offer", "Review Offer"),
    "contract": ("Your Employment Contract is Ready", "View Contract"),
    "contract_signed": ("Contract Successfully Signed", "View Contract"),
    "candidate_job_offer": ("Congratulations! You Received an Offer", "Review Offer"),
    "candidate_contract_ready": ("Your Employment Contract is Ready", "View Contract"),
    "candidate_interview_invitation": ("Interview Invitation", "View Interview"),
    "candidate_interview_reminder": ("Interview Reminder", "Join Interview"),
    "candidate_application_received": ("Application Received", "View Application"),
    "hr_offer_accepted": ("Offer Signed by Candidate", "Open Contracts"),
    "hr_contract_signed": ("Contract Signed by Candidate", "Open Contracts"),
    "hr_new_application": ("New Candidate Applied", "Review Candidate"),
    "hr_interview_scheduled": ("Interview Scheduled", "View Schedule"),
    "onboarding": ("Welcome to the Team", "Open Employee Portal"),
    "hr_notification": ("New Candidate Applied", "Review Candidate"),
    "feedback_request": ("Feedback Required", "Submit Evaluation"),
    "admin_alert": ("Super Admin Alert", "Open Dashboard"),
    "company_email_verification": ("Verify Your Company Account", "Verify Company Account"),
    "hr_email_verification": ("Verify Your Employee Account", "Activate Account"),
    "hr_login_verification": ("Verify HR Dashboard Access", "Verify Access"),
}


def render_notification_email(kind: str, variables: dict) -> tuple[str, str]:
    title, cta = EMAIL_COPY.get(kind, ("TalentFlow Notification", "Open TalentFlow"))
    payload = {
        "position": variables.get("position") or variables.get("job_title"),
        **(variables or {}),
    }
    payload.setdefault("title", title)
    payload.setdefault("cta_label", cta)
    return render_premium_email(template_key=kind, variables=payload)


def send_notification_email(to_email: str, kind: str, variables: dict) -> dict:
    subject, html = render_notification_email(kind, variables)
    plain = variables.get("message") or subject
    return send_email(to_email, variables.get("subject") or subject, plain, html)
