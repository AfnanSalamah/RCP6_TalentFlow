"""Simple email + notification helpers for TalentFlow.

If SMTP settings are missing, emails are logged to the terminal instead of
failing the workflow. This keeps local demos working and makes it obvious what
would have been emailed.
"""
from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from typing import Optional
from config import settings

log = logging.getLogger("talentflow.email")


def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> dict:
    host = getattr(settings, "SMTP_HOST", "") or getattr(settings, "SMTP_SERVER", "")
    port = int(getattr(settings, "SMTP_PORT", 587) or 587)
    username = getattr(settings, "SMTP_EMAIL", "") or getattr(settings, "SMTP_USERNAME", "")
    password = (getattr(settings, "SMTP_PASSWORD", "") or "").replace(" ", "")
    from_email = getattr(settings, "SMTP_FROM", "") or username

    if not (host and username and password and from_email):
        log.warning("[EMAIL:DEV-MODE] SMTP not configured. To: %s | Subject: %s", to_email, subject)
        log.warning("[EMAIL:DEV-MODE] Body:\n%s", body)
        print(f"\n[EMAIL:DEV-MODE] To: {to_email} | Subject: {subject}\n{body}\n[/EMAIL:DEV-MODE]\n")
        return {"sent": False, "dev_mode": True, "message": "SMTP not configured; email printed to backend terminal."}

    log.info("[EMAIL] Sending to %s via %s:%s", to_email, host, port)

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    # Attach an HTML alternative when provided — clients that support it render
    # the formatted version, others fall back to the plain-text body above.
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    try:
        import ssl as _ssl
        ctx = _ssl.create_default_context()
    except Exception:
        ctx = None

    try:
        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            if ctx:
                server.starttls(context=ctx)
            else:
                server.starttls()
            server.login(username, password)
            server.send_message(msg)
        log.info("[EMAIL] Successfully sent to %s", to_email)
        return {"sent": True, "dev_mode": False}
    except Exception as first_err:
        log.warning("[EMAIL] Primary SSL failed for %s: %s — retrying with unverified context", to_email, first_err)
        try:
            import ssl as _ssl
            ctx_ssl = _ssl.create_default_context()
            with smtplib.SMTP_SSL(host, 465, context=ctx_ssl) as server:
                server.login(username, password)
                server.send_message(msg)
            log.info("[EMAIL] Sent to %s (SMTP_SSL fallback)", to_email)
            return {"sent": True, "dev_mode": False}
        except Exception as ssl_err:
            log.warning("[EMAIL] SMTP_SSL fallback failed for %s: %s", to_email, ssl_err)
        try:
            import ssl as _ssl
            ctx2 = _ssl._create_unverified_context()
            with smtplib.SMTP(host, port) as server:
                server.ehlo()
                server.starttls(context=ctx2)
                server.login(username, password)
                server.send_message(msg)
            log.info("[EMAIL] Sent to %s (unverified SSL fallback)", to_email)
            return {"sent": True, "dev_mode": False}
        except Exception as second_err:
            log.error("[EMAIL] FAILED to send to %s: %s", to_email, second_err)
            return {"sent": False, "dev_mode": False, "error": str(second_err)}


def notify_applicant(db, models, applicant_id: int, *, type: str, title: str, message: str, link: str = "", email_subject: Optional[str] = None):
    applicant = db.query(models.Applicant).filter(models.Applicant.id == applicant_id).first()
    if not applicant:
        return None

    notification = models.Notification(
        applicant_id=applicant.id,
        recipient_user_id=applicant.id,
        recipient_role="candidate",
        notification_category=type or "candidate",
        recipient_scope="applicant",
        type=type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    action_url = f"{settings.FRONTEND_URL}{link}" if link and link.startswith("/") else (link or settings.FRONTEND_URL)
    kind_map = {
        "application": "candidate_application_received",
        "interview": "candidate_interview_invitation",
        "interview_reminder": "candidate_interview_reminder",
        "offer": "candidate_job_offer",
        "contract": "candidate_contract_ready",
        "contract_signed": "contract_signed",
    }
    try:
        from NotificationEmailService import render_notification_email

        subject, html = render_notification_email(kind_map.get(type, type or "welcome"), {
            "user_name": applicant.name,
            "candidate_name": applicant.name,
            "title": title,
            "message": message,
            "action_url": action_url,
            "profile_url": action_url,
            "offer_url": action_url,
            "contract_url": action_url,
            "interview_url": action_url,
        })
        result = send_email(
            applicant.email,
            email_subject or subject or title,
            f"Hi {applicant.name},\n\n{message}\n\nOpen TalentFlow: {action_url}\n\nTalentFlow Team",
            html,
        )
    except Exception as exc:
        log.exception("[EMAIL] Failed to render notification email for applicant %s: %s", applicant.id, exc)
        result = send_email(applicant.email, email_subject or title, f"Hi {applicant.name},\n\n{message}\n\nTalentFlow Team")
    notification.email_sent = bool(result.get("sent") or result.get("dev_mode"))
    db.commit()
    return notification
