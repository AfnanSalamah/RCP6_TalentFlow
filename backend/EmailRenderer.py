from __future__ import annotations

import html
from pathlib import Path


TEMPLATE_DIR = Path(__file__).resolve().parent / "templates" / "emails"


def _escape(value) -> str:
    return html.escape(str(value or ""))


BRAND = {
    "primary": "#6D28D9",
    "secondary": "#8B5CF6",
    "success": "#10B981",
    "warning": "#F59E0B",
    "danger": "#EF4444",
    "accent": "#14B8A6",
    "ink": "#FFFFFF",
    "muted": "#94A3B8",
    "surface": "#111827",
    "page": "#0F172A",
}


TEMPLATES = {
    "candidate_welcome": {
        "audience": "candidate",
        "title": "Welcome to TalentFlow",
        "cta": "Complete Your Profile",
        "illustration": "person",
        "fields": [("Candidate", "candidate_name"), ("Company", "company_name")],
    },
    "candidate_email_verification": {
        "audience": "candidate",
        "title": "Verify Your Email Address",
        "cta": "Verify Email Address",
        "illustration": "security",
        "fields": [("Verification Code", "verification_code")],
        "tone": "success",
    },
    "candidate_password_reset": {
        "audience": "candidate",
        "title": "Reset Your Password",
        "cta": "Reset Password",
        "illustration": "security",
        "fields": [("Reset Code", "verification_code"), ("Expires In", "expires_in")],
        "tone": "warning",
    },
    "candidate_interview_invitation": {
        "audience": "candidate",
        "title": "You're Invited to an Interview",
        "cta": "View Interview Details",
        "illustration": "calendar",
        "fields": [("Position", "job_title"), ("Date", "interview_date"), ("Time", "interview_time"), ("Location", "interview_location")],
    },
    "candidate_interview_reminder": {
        "audience": "candidate",
        "title": "Interview Reminder",
        "cta": "Join Interview",
        "illustration": "reminder",
        "fields": [("Position", "job_title"), ("Date", "interview_date"), ("Time", "interview_time"), ("Location", "interview_location")],
        "tone": "warning",
    },
    "candidate_interview_result": {
        "audience": "candidate",
        "title": "Interview Update",
        "cta": "View Your Status",
        "illustration": "trophy",
        "fields": [("Status", "status"), ("Next Step", "next_step")],
        "tone": "success",
    },
    "candidate_job_offer": {
        "audience": "candidate",
        "title": "Congratulations! You Received an Offer",
        "cta": "Review Offer",
        "illustration": "gift",
        "fields": [("Position", "job_title"), ("Department", "department"), ("Salary", "salary"), ("Start Date", "start_date")],
        "tone": "success",
    },
    "candidate_contract_ready": {
        "audience": "candidate",
        "title": "Your Employment Contract is Ready",
        "cta": "View Contract",
        "illustration": "contract",
        "fields": [("Position", "job_title"), ("Company", "company_name"), ("Contract ID", "contract_id")],
    },
    "candidate_contract_signed": {
        "audience": "candidate",
        "title": "Contract Successfully Signed",
        "cta": "View Contract",
        "illustration": "success",
        "fields": [("Candidate", "candidate_name"), ("Contract Date", "contract_date"), ("Contract ID", "contract_id")],
        "tone": "success",
    },
    "candidate_onboarding_welcome": {
        "audience": "candidate",
        "title": "Welcome to Onboarding",
        "cta": "Open Onboarding",
        "illustration": "team",
        "fields": [("Candidate", "candidate_name"), ("Company", "company_name"), ("Start Date", "start_date")],
        "tone": "success",
    },
    "company_registration_approved": {
        "audience": "company",
        "title": "Your Organization Has Been Successfully Activated",
        "cta": "Open Dashboard",
        "illustration": "office",
        "fields": [("Organization Name", "organization_name"), ("Plan", "plan"), ("Activation Date", "activation_date")],
    },
    "company_email_verification": {
        "audience": "company",
        "title": "Verify Your Company Account",
        "cta": "Verify Company Account",
        "illustration": "office",
        "fields": [("Company", "company_name"), ("Plan", "plan"), ("Expires In", "expires_in")],
        "tone": "success",
        "code": True,
    },
    "hr_email_verification": {
        "audience": "hr",
        "title": "Verify Your Employee Account",
        "cta": "Activate Account",
        "illustration": "profile",
        "fields": [("Employee", "employee_name"), ("Department", "department"), ("Role", "role"), ("Expires In", "expires_in")],
        "tone": "success",
        "code": True,
    },
    "hr_login_verification": {
        "audience": "hr",
        "title": "Verify HR Dashboard Access",
        "cta": "Verify Access",
        "illustration": "security",
        "fields": [("Employee", "employee_name"), ("Role", "role"), ("Expires In", "expires_in")],
        "tone": "success",
        "code": True,
    },
    "subscription_purchased": {
        "audience": "company",
        "title": "Subscription Activated",
        "cta": "Manage Subscription",
        "illustration": "billing",
        "fields": [("Plan Name", "plan_name"), ("Billing Cycle", "billing_cycle"), ("Renewal Date", "renewal_date")],
        "tone": "success",
    },
    "subscription_expiring": {
        "audience": "company",
        "title": "Subscription Expiring Soon",
        "cta": "Renew Subscription",
        "illustration": "warning",
        "fields": [("Days Remaining", "days_remaining"), ("Plan Name", "plan_name")],
        "tone": "warning",
    },
    "subscription_renewal_reminder": {
        "audience": "company",
        "title": "Subscription Renewal Reminder",
        "cta": "Manage Renewal",
        "illustration": "billing",
        "fields": [("Plan Name", "plan_name"), ("Renewal Date", "renewal_date"), ("Company", "company_name")],
        "tone": "warning",
    },
    "new_candidate_applied": {
        "audience": "company",
        "title": "New Candidate Application",
        "cta": "Review Candidate",
        "illustration": "candidate",
        "fields": [("Candidate Name", "candidate_name"), ("Position", "position"), ("Match Score", "match_score"), ("Application Date", "application_date")],
    },
    "interview_scheduled": {
        "audience": "company",
        "title": "Interview Successfully Scheduled",
        "cta": "View Interview",
        "illustration": "calendar",
        "fields": [("Candidate", "candidate_name"), ("Date", "interview_date"), ("Time", "interview_time"), ("Interviewer", "interviewer")],
    },
    "candidate_hired": {
        "audience": "company",
        "title": "Hiring Completed Successfully",
        "cta": "View Employee Profile",
        "illustration": "success",
        "fields": [("Candidate Name", "candidate_name"), ("Position", "position"), ("Department", "department"), ("Start Date", "start_date")],
        "tone": "success",
    },
    "hr_new_application_alert": {
        "audience": "hr",
        "title": "A New Candidate Applied",
        "cta": "Review Application",
        "illustration": "candidate",
        "fields": [("Candidate", "candidate_name"), ("Position", "position"), ("Match Score", "match_score")],
    },
    "hr_evaluation_submitted": {
        "audience": "hr",
        "title": "Interview Feedback Submitted",
        "cta": "View Evaluation",
        "illustration": "score",
        "fields": [("Interviewer", "interviewer"), ("Candidate", "candidate_name"), ("Score", "score")],
    },
    "hr_offer_accepted": {
        "audience": "hr",
        "title": "Offer Accepted",
        "cta": "View Details",
        "illustration": "success",
        "fields": [("Candidate", "candidate_name"), ("Position", "position")],
        "tone": "success",
    },
    "hr_offer_rejected": {
        "audience": "hr",
        "title": "Offer Rejected",
        "cta": "View Details",
        "illustration": "warning",
        "fields": [("Candidate", "candidate_name"), ("Position", "job_title"), ("Reason", "reason")],
        "tone": "warning",
    },
    "hr_contract_signed": {
        "audience": "hr",
        "title": "Employment Contract Signed",
        "cta": "View Contract",
        "illustration": "contract",
        "fields": [("Candidate", "candidate_name"), ("Contract Date", "contract_date")],
        "tone": "success",
    },
    "hr_hiring_completed": {
        "audience": "hr",
        "title": "Hiring Completed",
        "cta": "Open Candidate Profile",
        "illustration": "success",
        "fields": [("Candidate", "candidate_name"), ("Position", "job_title"), ("Department", "department")],
        "tone": "success",
    },
    "employee_welcome": {
        "audience": "employee",
        "title": "Welcome to the Team",
        "cta": "Open Employee Portal",
        "illustration": "team",
        "fields": [("Employee Name", "employee_name"), ("Department", "department"), ("Manager", "manager"), ("Start Date", "start_date")],
        "tone": "success",
    },
    "employee_profile_completion": {
        "audience": "employee",
        "title": "Complete Your Employee Profile",
        "cta": "Update Profile",
        "illustration": "profile",
        "fields": [("Completion", "completion_percent"), ("Required By", "deadline")],
        "progress": True,
    },
    "employee_training_assignment": {
        "audience": "employee",
        "title": "New Training Assigned",
        "cta": "Start Training",
        "illustration": "learning",
        "fields": [("Course Name", "course_name"), ("Deadline", "deadline")],
    },
    "employee_performance_review": {
        "audience": "employee",
        "title": "Performance Review Due",
        "cta": "Open Review",
        "illustration": "review",
        "fields": [("Review Period", "review_period"), ("Manager", "manager")],
        "tone": "warning",
    },
    "employee_company_announcement": {
        "audience": "employee",
        "title": "New Company Announcement",
        "cta": "Read Full Announcement",
        "illustration": "announcement",
        "fields": [("Announcement Title", "announcement_title"), ("Summary", "summary")],
    },
    "employee_promotion_notification": {
        "audience": "employee",
        "title": "Promotion Notification",
        "cta": "View Details",
        "illustration": "trophy",
        "fields": [("Employee Name", "employee_name"), ("New Title", "new_title"), ("Effective Date", "effective_date")],
        "tone": "success",
    },
    "employee_internal_transfer": {
        "audience": "employee",
        "title": "Internal Transfer Notification",
        "cta": "View Transfer",
        "illustration": "office",
        "fields": [("Employee Name", "employee_name"), ("Department", "department"), ("Manager", "manager_name")],
    },
    "super_admin_new_company_registered": {
        "audience": "super_admin",
        "title": "New Company Registered",
        "cta": "Open Executive Dashboard",
        "illustration": "office",
        "fields": [("Company", "company_name"), ("Owner", "owner_name"), ("Registered", "registered_at")],
    },
    "super_admin_subscription_purchased": {
        "audience": "super_admin",
        "title": "Subscription Purchased",
        "cta": "View Subscription",
        "illustration": "billing",
        "fields": [("Company", "company_name"), ("Plan", "plan_name"), ("Amount", "amount")],
        "tone": "success",
    },
    "super_admin_platform_error_alert": {
        "audience": "super_admin",
        "title": "Platform Error Alert",
        "cta": "Review Incident",
        "illustration": "danger",
        "fields": [("Service", "service"), ("Severity", "severity"), ("Detected At", "detected_at")],
        "tone": "danger",
    },
    "super_admin_security_alert": {
        "audience": "super_admin",
        "title": "Security Alert",
        "cta": "Open Security Center",
        "illustration": "security",
        "fields": [("Event", "event"), ("Risk Level", "risk_level"), ("Detected At", "detected_at")],
        "tone": "danger",
    },
    "super_admin_ai_processing_failure": {
        "audience": "super_admin",
        "title": "AI Processing Failure",
        "cta": "Review AI Queue",
        "illustration": "ai",
        "fields": [("Workflow", "workflow"), ("Failure Count", "failure_count"), ("Last Attempt", "last_attempt")],
        "tone": "warning",
    },
    "super_admin_monthly_platform_report": {
        "audience": "super_admin",
        "title": "Monthly Platform Report",
        "cta": "Open Report",
        "illustration": "analytics",
        "fields": [("Reporting Month", "reporting_month"), ("Companies", "companies_count"), ("Active Users", "active_users")],
    },
    "super_admin_revenue_report": {
        "audience": "super_admin",
        "title": "Revenue Report",
        "cta": "View Revenue",
        "illustration": "revenue",
        "fields": [("Period", "period"), ("Revenue", "revenue"), ("Growth", "growth")],
        "tone": "success",
    },
    "super_admin_usage_analytics": {
        "audience": "super_admin",
        "title": "Usage Analytics",
        "cta": "Open Analytics",
        "illustration": "analytics",
        "fields": [("Period", "period"), ("AI Requests", "ai_requests"), ("Interviews", "interviews_count")],
    },
}


LEGACY_TEMPLATE_ALIASES = {
    "welcome": "candidate_welcome",
    "verification": "candidate_email_verification",
    "password_reset": "candidate_password_reset",
    "application": "new_candidate_applied",
    "interview": "candidate_interview_invitation",
    "interview_reminder": "candidate_interview_reminder",
    "interview_result": "candidate_interview_result",
    "offer": "candidate_job_offer",
    "contract": "candidate_contract_ready",
    "contract_signed": "candidate_contract_signed",
    "onboarding": "candidate_onboarding_welcome",
    "hr_notification": "hr_new_application_alert",
    "feedback_request": "hr_evaluation_submitted",
    "admin_alert": "super_admin_platform_error_alert",
}


def _tone_color(tone: str) -> str:
    return {
        "success": BRAND["success"],
        "warning": BRAND["warning"],
        "danger": BRAND["danger"],
    }.get(tone or "", BRAND["primary"])


def _audience_color(audience: str, tone: str = "") -> str:
    if tone:
        return _tone_color(tone)
    return {
        "candidate": BRAND["primary"],
        "company": BRAND["success"],
        "hr": BRAND["secondary"],
        "employee": "#F97316",
        "super_admin": BRAND["danger"],
    }.get(audience or "", BRAND["primary"])


def _illustration(kind: str, tone: str = "") -> str:
    color = _tone_color(tone)
    label = {
        "office": "Office Building",
        "person": "Candidate Welcome",
        "billing": "Credit Card + Success Badge",
        "warning": "Renewal Notice",
        "reminder": "Smart Reminder",
        "trophy": "Achievement Update",
        "gift": "Offer Package",
        "candidate": "Candidate Profile Card",
        "calendar": "Calendar",
        "success": "Success Milestone",
        "score": "Evaluation Score",
        "contract": "Signed Contract",
        "team": "Team Celebration",
        "profile": "Profile Progress",
        "learning": "Learning Dashboard",
        "review": "Performance Review",
        "announcement": "Company Announcement",
        "danger": "Incident Alert",
        "security": "Security Center",
        "ai": "AI Processing",
        "analytics": "Executive Analytics",
        "revenue": "Revenue Report",
    }.get(kind, "TalentFlow Update")
    icon = {
        "office": "TF",
        "person": "HI",
        "billing": "$",
        "warning": "!",
        "reminder": "!",
        "trophy": "WIN",
        "gift": "BOX",
        "candidate": "CV",
        "calendar": "31",
        "success": "OK",
        "score": "%",
        "contract": "DOC",
        "team": "HR",
        "profile": "ID",
        "learning": "EDU",
        "review": "OKR",
        "announcement": "NEW",
        "danger": "!",
        "security": "SEC",
        "ai": "AI",
        "analytics": "BI",
        "revenue": "$",
    }.get(kind, "TF")
    return f"""
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0 4px;border-collapse:separate;border-spacing:0;">
        <tr>
          <td style="background:#0F172A;border:1px solid rgba(139,92,246,.28);border-radius:16px;padding:18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="78" valign="middle">
                  <div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,{color},#4F46E5);color:#fff;font-size:17px;font-weight:900;line-height:64px;text-align:center;box-shadow:0 12px 28px rgba(37,99,235,0.22);">{_escape(icon)}</div>
                </td>
                <td valign="middle">
                  <div style="font-size:13px;font-weight:800;color:{color};text-transform:uppercase;letter-spacing:.08em;">{_escape(label)}</div>
                  <div style="font-size:14px;line-height:1.6;color:#CBD5E1;margin-top:4px;">Premium enterprise notification generated by TalentFlow.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    """


def render_details_section(items: list[tuple[str, object]], tone: str = "") -> str:
    rows = ""
    for label, value in items:
        if value in (None, ""):
            continue
        rows += f"""
          <tr>
            <td style="padding:12px 0;color:#94A3B8;font-size:13px;border-bottom:1px solid rgba(148,163,184,.16);">{_escape(label)}</td>
            <td align="right" style="padding:12px 0;color:#FFFFFF;font-size:13px;font-weight:800;border-bottom:1px solid rgba(148,163,184,.16);">{_escape(value)}</td>
          </tr>
        """
    if not rows:
        return ""
    return f"""
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid rgba(139,92,246,.28);border-radius:14px;padding:4px 16px;background:#0F172A;border-collapse:separate;">
        {rows}
      </table>
    """


def render_progress_bar(percent) -> str:
    try:
        value = max(0, min(100, int(str(percent).replace("%", "").strip())))
    except (TypeError, ValueError):
        value = 64
    return f"""
      <div style="margin:20px 0 4px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
        <td style="font-size:13px;font-weight:800;color:#FFFFFF;">Profile completion</td>
            <td align="right" style="font-size:13px;font-weight:800;color:#8B5CF6;">{value}%</td>
          </tr>
        </table>
        <div style="height:10px;background:#1F2937;border-radius:999px;overflow:hidden;margin-top:10px;">
          <div style="height:10px;width:{value}%;background:linear-gradient(135deg,#14B8A6,#8B5CF6);border-radius:999px;"></div>
        </div>
      </div>
    """


def render_verification_code(code) -> str:
    if not code:
        return ""
    digits = " ".join(str(code).strip())
    return f"""
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border-collapse:separate;">
        <tr>
          <td align="center" style="padding:18px;background:#0F172A;border:1px solid rgba(139,92,246,.36);border-radius:16px;">
            <div style="font-size:12px;color:#A78BFA;font-weight:900;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px;">Verification Code</div>
            <div style="font-size:34px;line-height:1.1;color:#FFFFFF;font-weight:900;letter-spacing:.22em;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">{_escape(digits)}</div>
            <div style="font-size:12px;color:#94A3B8;margin-top:10px;">Use this code to continue securely.</div>
          </td>
        </tr>
      </table>
    """


def render_premium_email(
    *,
    template_key: str,
    variables: dict | None = None,
) -> tuple[str, str]:
    variables = variables or {}
    key = LEGACY_TEMPLATE_ALIASES.get(template_key, template_key)
    template = TEMPLATES.get(key)
    if key == "verification":
        template = {
            "title": "Verify Your Email Address",
            "cta": "Verify Email",
            "illustration": "security",
            "fields": [("Verification Code", "verification_code")],
            "tone": "success",
        }
    elif key == "password_reset":
        template = {
            "title": "Reset Your Password",
            "cta": "Reset Password",
            "illustration": "security",
            "fields": [("Reset Code", "verification_code"), ("Expires In", "expires_in")],
            "tone": "warning",
        }
    if not template:
        template = {"title": "TalentFlow Notification", "cta": "Open TalentFlow", "illustration": "announcement", "fields": []}

    title = variables.get("title") or template["title"]
    tone = variables.get("tone") or template.get("tone", "")
    audience = variables.get("audience") or template.get("audience", "")
    accent = _audience_color(audience, tone)
    message = variables.get("message") or "A new update is ready in your TalentFlow workspace."
    name = variables.get("user_name") or variables.get("employee_name") or variables.get("candidate_name") or variables.get("company_name") or "there"
    fields = [(label, variables.get(field)) for label, field in template.get("fields", [])]
    body = f"""
      <p style="margin:0 0 14px;">Hi {_escape(name)},</p>
      <p style="margin:0 0 14px;">{_escape(message)}</p>
      {_illustration(variables.get("illustration") or template.get("illustration", "announcement"), tone)}
      {render_verification_code(variables.get("verification_code") or variables.get("otp_code")) if template.get("code") or variables.get("verification_code") else ""}
      {render_details_section(fields, tone)}
      {render_progress_bar(variables.get("completion_percent")) if template.get("progress") else ""}
    """
    subject = variables.get("subject") or title
    html = render_email_layout(
        title=title,
        preheader=variables.get("preheader") or title,
        body_html=body,
        cta_label=variables.get("cta_label") or template.get("cta", "Open TalentFlow"),
        cta_url=variables.get("action_url") or variables.get("login_url") or "#",
        badge=variables.get("badge") or ("Executive Dashboard" if template.get("audience") == "super_admin" else ""),
        tone=tone,
        audience=audience,
        accent=accent,
    )
    return subject, html


def render_email_layout(
    *,
    title: str,
    preheader: str = "",
    body_html: str = "",
    cta_label: str = "",
    cta_url: str = "",
    badge: str = "",
    tone: str = "",
    audience: str = "",
    accent: str = "",
) -> str:
    accent = accent or _audience_color(audience, tone)
    cta = ""
    if cta_label and cta_url:
        cta = f"""
        <tr><td align="center" style="padding:24px 0 8px;">
          <a href="{_escape(cta_url)}" style="display:inline-block;background:linear-gradient(135deg,{accent},#8B5CF6);color:#fff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 28px;border-radius:10px;box-shadow:0 14px 30px rgba(109,40,217,0.34);">{_escape(cta_label)}</a>
        </td></tr>
        """
    badge_html = f"""<div style="display:inline-block;background:rgba(139,92,246,.16);color:#C4B5FD;border:1px solid rgba(139,92,246,.34);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:800;margin-bottom:14px;">{_escape(badge)}</div>""" if badge else ""
    return f"""<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{_escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0F172A;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#FFFFFF;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;">{_escape(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0F172A;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="650" cellspacing="0" cellpadding="0" style="width:100%;max-width:650px;border-collapse:separate;border-spacing:0;">
        <tr><td style="background:linear-gradient(135deg,{accent},#8B5CF6);padding:0;border-radius:18px 18px 0 0;color:#fff;overflow:hidden;">
          <div style="padding:28px 32px 24px;background:radial-gradient(circle at 88% 18%,rgba(255,255,255,.30),transparent 25%),radial-gradient(circle at 72% 88%,rgba(255,255,255,.16),transparent 24%);">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <div style="font-size:23px;font-weight:900;letter-spacing:0;">TalentFlow</div>
                <div style="font-size:13px;color:#EDE9FE;margin-top:4px;">AI-Powered Hiring Platform</div>
              </td>
              <td align="right">
                <div style="width:74px;height:58px;border-radius:16px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.34);text-align:center;line-height:58px;font-size:22px;font-weight:900;color:#fff;">TF</div>
              </td>
            </tr>
          </table>
          </div>
        </td></tr>
        <tr><td style="background:#111827;padding:32px;border:1px solid rgba(139,92,246,.28);border-top:0;border-radius:0 0 18px 18px;box-shadow:0 22px 55px rgba(0,0,0,0.34);">
          {badge_html}
          <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#FFFFFF;">{_escape(title)}</h1>
          <div style="font-size:15px;line-height:1.75;color:#E5E7EB;">{body_html}</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">{cta}</table>
        </td></tr>
        <tr><td style="padding:22px 10px;text-align:center;color:#94A3B8;font-size:12px;line-height:1.7;">
          <strong style="color:#FFFFFF;">TalentFlow Team</strong><br>
          Support: support@talentflow.com<br>
          <a href="https://talentflow.ai/privacy" style="color:#C4B5FD;text-decoration:none;">Privacy Policy</a>
          &nbsp;|&nbsp;
          <a href="https://talentflow.ai/terms" style="color:#C4B5FD;text-decoration:none;">Terms of Service</a>
          &nbsp;|&nbsp;
          <a href="https://talentflow.ai/help" style="color:#C4B5FD;text-decoration:none;">Help Center</a><br>
          Copyright 2026 TalentFlow. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def render_template(template_name: str, variables: dict) -> str:
    path = TEMPLATE_DIR / template_name
    text = path.read_text(encoding="utf-8")
    for key, value in (variables or {}).items():
        text = text.replace("{{" + key + "}}", _escape(value))
    return text
