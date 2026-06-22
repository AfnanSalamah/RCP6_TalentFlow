"""Production email + notification helpers for TalentFlow."""
from __future__ import annotations

import json
import logging
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage
from typing import Optional

from config import settings

log = logging.getLogger("talentflow.email")


def _is_local_environment() -> bool:
    env = (getattr(settings, "ENVIRONMENT", "") or "").strip().lower()
    frontend = (getattr(settings, "FRONTEND_URL", "") or "").strip().lower()
    return env in {"development", "dev", "local"} or "localhost" in frontend or "127.0.0.1" in frontend


def _allow_dev_fallback() -> bool:
    return bool(getattr(settings, "ALLOW_DEV_EMAIL_FALLBACK", False)) or _is_local_environment()


def _resend_config() -> tuple[str, str]:
    api_key = (getattr(settings, "RESEND_API_KEY", "") or "").strip()
    from_email = (
        getattr(settings, "EMAIL_FROM", "")
        or getattr(settings, "SMTP_FROM", "")
        or ""
    ).strip()
    return api_key, from_email


def _smtp_config() -> tuple[str, int, str, str, str]:
    host = (getattr(settings, "SMTP_HOST", "") or getattr(settings, "SMTP_SERVER", "") or "").strip()
    port = int(getattr(settings, "SMTP_PORT", 587) or 587)
    username = (
        getattr(settings, "SMTP_USER", "")
        or getattr(settings, "SMTP_EMAIL", "")
        or getattr(settings, "SMTP_USERNAME", "")
        or ""
    ).strip()
    # Gmail app passwords are often copied as four groups with spaces.
    password = (getattr(settings, "SMTP_PASSWORD", "") or "").replace(" ", "").strip()
    from_email = (
        getattr(settings, "SMTP_FROM", "")
        or getattr(settings, "EMAIL_FROM", "")
        or username
        or ""
    ).strip()
    return host, port, username, password, from_email


def _send_resend(to_email: str, subject: str, body: str, html_body: Optional[str]) -> dict:
    api_key, from_email = _resend_config()
    if not (api_key and from_email):
        missing = [name for name, value in {"RESEND_API_KEY": api_key, "EMAIL_FROM": from_email}.items() if not value]
        return {"sent": False, "configured": False, "provider": "resend", "missing": missing}

    payload = {"from": from_email, "to": [to_email], "subject": subject, "text": body}
    if html_body:
        payload["html"] = html_body

    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "TalentFlow/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response.read()
            log.info("[EMAIL] Resend accepted message for %s with status %s", to_email, response.status)
            return {"sent": 200 <= response.status < 300, "dev_mode": False, "provider": "resend", "configured": True}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        log.error("[EMAIL] Resend failed for %s: status=%s response=%s", to_email, exc.code, detail[:500])
        return {"sent": False, "dev_mode": False, "provider": "resend", "configured": True, "error": f"resend_http_{exc.code}"}
    except Exception as exc:
        log.error("[EMAIL] Resend request failed for %s: %s", to_email, exc)
        return {"sent": False, "dev_mode": False, "provider": "resend", "configured": True, "error": str(exc)}


def _send_smtp(to_email: str, subject: str, body: str, html_body: Optional[str]) -> dict:
    host, port, username, password, from_email = _smtp_config()
    if not (host and username and password and from_email):
        missing = [name for name, value in {
            "SMTP_HOST": host,
            "SMTP_USER": username,
            "SMTP_PASSWORD": password,
            "SMTP_FROM": from_email,
        }.items() if not value]
        return {"sent": False, "configured": False, "provider": "smtp", "missing": missing}

    log.info("[EMAIL] Sending to %s via SMTP host=%s port=%s from=%s", to_email, host, port, from_email)

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    try:
        import ssl as _ssl
        ctx = _ssl.create_default_context()
    except Exception:
        ctx = None

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=20, context=ctx) as server:
                server.login(username, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.ehlo()
                if ctx:
                    server.starttls(context=ctx)
                else:
                    server.starttls()
                server.login(username, password)
                server.send_message(msg)
        log.info("[EMAIL] Successfully sent to %s via SMTP", to_email)
        return {"sent": True, "dev_mode": False, "provider": "smtp", "configured": True}
    except Exception as exc:
        log.error("[EMAIL] SMTP failed for %s using host=%s port=%s: %s", to_email, host, port, exc)
        return {"sent": False, "dev_mode": False, "provider": "smtp", "configured": True, "error": str(exc)}


def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> dict:
    resend_key, _ = _resend_config()
    attempted = []
    if resend_key:
        result = _send_resend(to_email, subject, body, html_body)
        attempted.append(result)
        return result

    result = _send_smtp(to_email, subject, body, html_body)
    attempted.append(result)
    if result.get("sent"):
        return result

    missing = sorted({item for result in attempted for item in (result.get("missing") or [])})
    if missing:
        log.error("[EMAIL] Email provider is not configured. Missing variables: %s", ", ".join(missing))
    else:
        log.error("[EMAIL] Email delivery failed for %s using configured provider(s).", to_email)

    if _allow_dev_fallback():
        log.warning("[EMAIL:DEV-FALLBACK] To: %s | Subject: %s", to_email, subject)
        log.warning("[EMAIL:DEV-FALLBACK] Body:\n%s", body)
        return {"sent": False, "dev_mode": True, "message": "Email printed to backend logs for development."}

    return {"sent": False, "dev_mode": False, "message": "Email provider is not configured."}


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
