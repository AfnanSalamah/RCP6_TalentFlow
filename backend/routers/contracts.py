"""Contracts & Offers — send to candidate (email + in-app portal).

HR endpoints create/send offers and contracts; the document is persisted and
linked to the candidate's Applicant account (by email) so it appears in their
portal under "My Contracts", and a professionally formatted HTML email is
dispatched. Candidate endpoints let the applicant review and sign/decline.
"""
import logging
import html as _html
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from auth import get_current_hr_user, get_current_applicant, tenant_filter
from email_service import send_email, notify_applicant
from NotificationEmailService import render_notification_email
from config import settings
import models

log = logging.getLogger("talentflow.contracts")

hr_router = APIRouter(prefix="/hr", tags=["Contracts"])
applicant_router = APIRouter(prefix="/applicant/contracts", tags=["Contracts"])


# ─── Schemas ────────────────────────────────────────────────────────────────────

class SendOfferRequest(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    content: str
    role_title: str = ""
    subject: Optional[str] = None


class SendContractRequest(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    content: str
    title: str = "Employment Contract"
    role_title: str = ""
    salary: str = ""
    start_date: str = ""
    document_type: str = "contract"   # "offer" | "contract"


class SignRequest(BaseModel):
    signature_name: str


class DeclineRequest(BaseModel):
    reason: str = ""


# ─── HTML email template ──────────────────────────────────────────────────────

def _offer_email_html(candidate_name: str, company: str, role_title: str, body_text: str, portal_url: str) -> str:
    """A clean, inline-styled HTML email (inline CSS = best email-client support)."""
    safe_body = _html.escape(body_text).replace("\n", "<br>")
    role_line = f" for the position of <strong>{_html.escape(role_title)}</strong>" if role_title else ""
    return f"""\
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="background:linear-gradient(135deg,#001D39,#0A4174);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;">{_html.escape(company)}</h1>
          <p style="margin:6px 0 0;color:#BDD8E9;font-size:13px;">Official Offer Document</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:15px;color:#0f172a;margin:0 0 16px;">Dear {_html.escape(candidate_name)},</p>
          <p style="font-size:14px;color:#334155;margin:0 0 20px;">
            We are pleased to share your official document{role_line}. The full text is below.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;font-size:13px;color:#334155;line-height:1.7;">
            {safe_body}
          </div>
          <div style="text-align:center;margin:28px 0 8px;">
            <a href="{_html.escape(portal_url)}" style="display:inline-block;background:#0A4174;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
              Review &amp; Sign in Your Portal
            </a>
          </div>
          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:16px 0 0;">
            Or copy this link: {_html.escape(portal_url)}
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">This message was sent by {_html.escape(company)} via TalentFlow. If you did not expect it, please ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def _company_name(db: Session, hr_user) -> str:
    if hr_user.company_id:
        co = db.query(models.Company).filter(models.Company.id == hr_user.company_id).first()
        if co:
            return co.company_name
    return "TalentFlow"


def _link_applicant(db: Session, email: str) -> Optional[int]:
    """Find an existing candidate account by email so the contract shows in their portal."""
    applicant = db.query(models.Applicant).filter(func.lower(models.Applicant.email) == email.lower()).first()
    return applicant.id if applicant else None


def _document_email(kind: str, *, candidate_name: str, company: str, role_title: str, content: str, portal_url: str, contract_id: int) -> tuple[str, str]:
    template_key = "candidate_job_offer" if kind == "offer" else "candidate_contract_ready"
    return render_notification_email(template_key, {
        "user_name": candidate_name,
        "candidate_name": candidate_name,
        "company_name": company,
        "job_title": role_title,
        "position": role_title,
        "message": content,
        "action_url": f"{portal_url}?contract={contract_id}",
        "offer_url": f"{portal_url}?contract={contract_id}",
        "contract_url": f"{portal_url}?contract={contract_id}",
    })


def _role_value(role) -> str:
    return getattr(role, "value", role) or "hr"


def _notify_hr_document_signed(db: Session, contract: models.Contract, candidate: models.Applicant):
    if not contract.company_id:
        return
    is_offer = (contract.document_type or "").lower() == "offer"
    title = "Offer signed" if is_offer else "Contract signed"
    message = f"{candidate.name} signed {contract.title}."
    kind = "hr_offer_accepted" if is_offer else "hr_contract_signed"
    link = "/hr/contracts"
    recipients = []
    if contract.created_by:
        creator = db.query(models.HRUser).filter(models.HRUser.id == contract.created_by).first()
        if creator:
            recipients.append(creator)
    recipients.extend(db.query(models.HRUser).filter(
        models.HRUser.company_id == contract.company_id,
        models.HRUser.email != "",
    ).all())

    seen = set()
    for hr in recipients:
        if not hr or hr.id in seen:
            continue
        seen.add(hr.id)
        notification = models.Notification(
            company_id=contract.company_id,
            created_by=contract.created_by,
            recipient_scope="specific_user",
            recipient_user_id=hr.id,
            recipient_role=_role_value(hr.role),
            notification_category="offer" if is_offer else "contract",
            type="offer_signed" if is_offer else "contract_signed",
            title=title,
            message=message,
            link=link,
        )
        db.add(notification)
        db.flush()
        subject, html = render_notification_email(kind, {
            "user_name": hr.name,
            "candidate_name": candidate.name,
            "company_name": _company_name(db, hr),
            "job_title": contract.role_title,
            "position": contract.role_title,
            "title": title,
            "message": message,
            "action_url": f"{settings.FRONTEND_URL}{link}",
            "contract_url": f"{settings.FRONTEND_URL}{link}",
            "offer_url": f"{settings.FRONTEND_URL}{link}",
        })
        result = send_email(hr.email, subject, f"{message}\n\nOpen: {settings.FRONTEND_URL}{link}", html)
        notification.email_sent = bool(result.get("sent") or result.get("dev_mode"))


# ─── HR: send offer (email only — used by Offer Generator) ──────────────────────

@hr_router.post("/offers/send", status_code=201)
def send_offer(body: SendOfferRequest, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    company = _company_name(db, hr_user)
    applicant_id = _link_applicant(db, body.candidate_email)
    portal_url = f"{settings.FRONTEND_URL}/user/contracts"

    contract = models.Contract(
        applicant_id=applicant_id,
        company_id=hr_user.company_id,
        created_by=hr_user.id,
        document_type="offer",
        title=body.subject or f"Offer — {body.role_title}".strip(" —"),
        candidate_name=body.candidate_name,
        candidate_email=body.candidate_email,
        role_title=body.role_title,
        content=body.content,
        status="Sent",
        sent_at=datetime.utcnow(),
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    subject, html_body = _document_email(
        "offer",
        candidate_name=body.candidate_name,
        company=company,
        role_title=body.role_title,
        content=body.content,
        portal_url=portal_url,
        contract_id=contract.id,
    )
    result = send_email(
        body.candidate_email, body.subject or subject or f"Your Offer from {company}",
        body=f"Dear {body.candidate_name},\n\n{body.content}\n\nView it in your portal: {portal_url}",
        html_body=html_body,
    )
    if applicant_id:
        notify_applicant(db, models, applicant_id, type="offer", title="You received an offer",
                         message=f"{contract.title} is ready. Review it under My Contracts.",
                         link=f"/user/contracts?contract={contract.id}")
    if not (result.get("sent") or result.get("dev_mode")):
        log.error("[OFFER] Email dispatch failed for %s: %s", body.candidate_email, result)
        raise HTTPException(status_code=502, detail=f"Offer saved but email could not be sent: {result.get('error') or result.get('message') or 'SMTP rejected the message'}")
    return {"id": contract.id, "emailed": bool(result.get("sent")), "dev_mode": bool(result.get("dev_mode")),
            "linked_to_portal": applicant_id is not None, "message": "Offer sent to candidate."}


# ─── HR: send contract (save + email + portal) ──────────────────────────────────

@hr_router.post("/contracts/send", status_code=201)
def send_contract(body: SendContractRequest, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    company = _company_name(db, hr_user)
    applicant_id = _link_applicant(db, body.candidate_email)
    portal_url = f"{settings.FRONTEND_URL}/user/contracts"

    contract = models.Contract(
        applicant_id=applicant_id,
        company_id=hr_user.company_id,
        created_by=hr_user.id,
        document_type=body.document_type,
        title=body.title,
        candidate_name=body.candidate_name,
        candidate_email=body.candidate_email,
        role_title=body.role_title,
        salary=body.salary,
        start_date=body.start_date,
        content=body.content,
        status="Pending Signature",
        sent_at=datetime.utcnow(),
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    email_kind = "offer" if (body.document_type or "").lower() == "offer" else "contract"
    _, html_body = _document_email(
        email_kind,
        candidate_name=body.candidate_name,
        company=company,
        role_title=body.role_title,
        content=body.content,
        portal_url=portal_url,
        contract_id=contract.id,
    )

    result = send_email(
        body.candidate_email, f"{body.title} — {company}",
        body=f"Dear {body.candidate_name},\n\nPlease review and sign your contract in your portal: {portal_url}\n\n{body.content}",
        html_body=html_body,
    )
    if applicant_id:
        notify_applicant(db, models, applicant_id, type=email_kind, title="Offer ready to review" if email_kind == "offer" else "Contract ready to sign",
                         message=f"{contract.title} is ready. Review it under My Contracts.",
                         link=f"/user/contracts?contract={contract.id}")
    if not (result.get("sent") or result.get("dev_mode")):
        log.error("[CONTRACT] Email dispatch failed for %s: %s", body.candidate_email, result)
        raise HTTPException(status_code=502, detail=f"Contract saved but email could not be sent: {result.get('error') or result.get('message') or 'SMTP rejected the message'}")

    return {
        "id": contract.id,
        "status": contract.status,
        "emailed": bool(result.get("sent")),
        "dev_mode": bool(result.get("dev_mode")),
        "linked_to_portal": applicant_id is not None,
        "message": "Contract sent successfully via Email and to Candidate Portal."
                   if applicant_id else
                   "Contract emailed. It will appear in the portal once the candidate registers with this email.",
    }


@hr_router.get("/contracts")
def hr_list_contracts(hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    rows = tenant_filter(db.query(models.Contract), models.Contract, hr_user).order_by(
        models.Contract.created_at.desc()
    ).all()
    return [_contract_out(c) for c in rows]


@hr_router.get("/contracts/{contract_id}")
def hr_get_contract(contract_id: int, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    c = tenant_filter(db.query(models.Contract), models.Contract, hr_user).filter(
        models.Contract.id == contract_id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    return _contract_out(c, include_content=True)


@hr_router.delete("/contracts/{contract_id}")
def hr_delete_contract(contract_id: int, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    c = tenant_filter(db.query(models.Contract), models.Contract, hr_user).filter(
        models.Contract.id == contract_id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(c)
    db.commit()
    return {"message": "Contract deleted"}


# ─── Candidate: My Contracts ────────────────────────────────────────────────────

@applicant_router.get("")
def my_contracts(current: models.Applicant = Depends(get_current_applicant), db: Session = Depends(get_db)):
    # Match by linked id OR by email (covers contracts sent before the candidate signed up).
    rows = db.query(models.Contract).filter(
        (models.Contract.applicant_id == current.id) |
        (func.lower(models.Contract.candidate_email) == current.email.lower())
    ).order_by(models.Contract.created_at.desc()).all()
    # Backfill the link so future queries are fast and notifications work.
    for c in rows:
        if c.applicant_id is None:
            c.applicant_id = current.id
    db.commit()
    return [_contract_out(c) for c in rows]


@applicant_router.get("/{contract_id}")
def get_my_contract(contract_id: int, current: models.Applicant = Depends(get_current_applicant), db: Session = Depends(get_db)):
    c = _owned_contract(db, contract_id, current)
    return _contract_out(c, include_content=True)


@applicant_router.post("/{contract_id}/sign")
def sign_contract(contract_id: int, body: SignRequest, current: models.Applicant = Depends(get_current_applicant), db: Session = Depends(get_db)):
    c = _owned_contract(db, contract_id, current)
    if c.status == "Signed":
        return {"message": "Already signed", "status": c.status}
    is_offer = (c.document_type or "").lower() == "offer"
    c.status = "Signed"
    c.signature_name = body.signature_name.strip()
    c.signed_at = datetime.utcnow()
    app_query = db.query(models.Application).join(models.Job).filter(
        models.Application.applicant_id == current.id,
    )
    if c.company_id:
        app_query = app_query.filter(models.Application.company_id == c.company_id)
    if c.role_title:
        role_like = f"%{c.role_title.strip()}%"
        app_query = app_query.filter(models.Job.title.ilike(role_like))
    application = app_query.order_by(models.Application.applied_at.desc()).first()
    if application:
        application.status = models.ApplicationStatus.hired
        application.pipeline_stage = models.PipelineStage.hired
        db.add(models.ApplicationTimeline(
            application_id=application.id,
            status="Offer Signed" if is_offer else "Contract Signed",
            description=f"{current.name} signed {'the offer' if is_offer else 'the contract'}: {c.title}.",
        ))
        log.info("[CONTRACT] Application %s moved after document %s was signed", application.id, c.id)
    db.commit()
    _notify_hr_document_signed(db, c, current)
    db.commit()
    return {"message": "Offer signed" if is_offer else "Contract signed", "status": c.status, "signed_at": c.signed_at, "application_id": application.id if application else None}


@applicant_router.post("/{contract_id}/decline")
def decline_contract(contract_id: int, body: DeclineRequest, current: models.Applicant = Depends(get_current_applicant), db: Session = Depends(get_db)):
    c = _owned_contract(db, contract_id, current)
    c.status = "Declined"
    c.decline_reason = body.reason.strip()
    db.commit()
    return {"message": "Contract declined", "status": c.status}


# ─── Helpers ────────────────────────────────────────────────────────────────────

def _owned_contract(db: Session, contract_id: int, applicant: models.Applicant) -> models.Contract:
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c or (c.applicant_id != applicant.id and (c.candidate_email or "").lower() != applicant.email.lower()):
        raise HTTPException(status_code=404, detail="Contract not found")
    return c


def _contract_out(c: models.Contract, include_content: bool = False) -> dict:
    out = {
        "id": c.id,
        "documentType": c.document_type,
        "title": c.title,
        "candidateName": c.candidate_name,
        "candidateEmail": c.candidate_email,
        "roleTitle": c.role_title,
        "salary": c.salary,
        "startDate": c.start_date,
        "status": c.status,
        "signatureName": c.signature_name,
        "sentAt": c.sent_at.strftime("%Y-%m-%d %H:%M") if c.sent_at else "",
        "signedAt": c.signed_at.strftime("%Y-%m-%d %H:%M") if c.signed_at else "",
        "createdAt": c.created_at.strftime("%Y-%m-%d") if c.created_at else "",
    }
    if include_content:
        out["content"] = c.content
        out["terms"] = c.content
    return out
