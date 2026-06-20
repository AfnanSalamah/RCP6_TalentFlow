from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from auth import get_current_super_admin
from database import get_db
from EmailRenderer import TEMPLATES, render_premium_email
from email_service import send_email
import models


router = APIRouter(prefix="/super-admin/email-center", tags=["Email Center"])


SAMPLE_DATA = {
    "candidate_name": "Afnan Aluqmani",
    "employee_name": "Afnan Aluqmani",
    "user_name": "Afnan Aluqmani",
    "company_name": "SDA",
    "organization_name": "SDA",
    "plan": "Professional",
    "plan_name": "Professional",
    "billing_cycle": "Monthly",
    "renewal_date": "2026-07-13",
    "activation_date": "2026-06-13",
    "job_title": "AI Product Designer",
    "position": "AI Product Designer",
    "department": "Product",
    "manager": "Hiring Manager",
    "manager_name": "Hiring Manager",
    "interviewer": "Layla Rashidi",
    "interviewer_name": "Layla Rashidi",
    "interview_date": "2026-06-20",
    "interview_time": "10:30 AM",
    "interview_location": "Google Meet",
    "match_score": "94%",
    "application_date": "2026-06-13",
    "salary": "SAR 18,000",
    "start_date": "2026-07-01",
    "contract_id": "TF-2026-1042",
    "contract_date": "2026-06-13",
    "verification_code": "648219",
    "completion_percent": "72",
    "deadline": "2026-06-30",
    "course_name": "Security Awareness",
    "review_period": "Q2 2026",
    "announcement_title": "New Hiring Workflow",
    "summary": "TalentFlow has launched a faster enterprise review process.",
    "owner_name": "Platform Owner",
    "registered_at": "2026-06-13",
    "amount": "SAR 499",
    "service": "Email Delivery",
    "severity": "High",
    "detected_at": "2026-06-13 20:30",
    "event": "Suspicious login attempt",
    "risk_level": "High",
    "workflow": "Resume Matching",
    "failure_count": "3",
    "last_attempt": "2026-06-13 20:30",
    "reporting_month": "June 2026",
    "companies_count": "128",
    "active_users": "4,820",
    "period": "June 2026",
    "revenue": "SAR 120,000",
    "growth": "18%",
    "ai_requests": "45,000",
    "interviews_count": "1,240",
    "status": "Passed",
    "next_step": "Offer review",
}


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    cta_label: Optional[str] = None
    illustration: Optional[str] = None
    tone: Optional[str] = None
    enabled: Optional[bool] = None
    body: Optional[str] = None


class PreviewRequest(BaseModel):
    variables: dict[str, Any] = {}
    mobile: bool = False


class TestEmailRequest(BaseModel):
    to_email: EmailStr
    variables: dict[str, Any] = {}


def _seed_email_center(db: Session):
    changed = False
    for key, spec in TEMPLATES.items():
        row = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == key).first()
        if row:
            continue
        db.add(models.EmailTemplate(
            key=key,
            audience=spec.get("audience", "candidate"),
            title=spec.get("title", "TalentFlow Notification"),
            subject=spec.get("title", "TalentFlow Notification"),
            cta_label=spec.get("cta", "Open TalentFlow"),
            illustration=spec.get("illustration", "announcement"),
            tone=spec.get("tone", ""),
            fields=spec.get("fields", []),
            enabled=True,
            body="A new update is ready in your TalentFlow workspace.",
        ))
        changed = True
    for name, sample in SAMPLE_DATA.items():
        if not db.query(models.EmailVariable).filter(models.EmailVariable.name == name).first():
            db.add(models.EmailVariable(
                name=name,
                audience="global",
                description=f"Dynamic value for {name.replace('_', ' ')}",
                sample=str(sample),
            ))
            changed = True
    if changed:
        db.commit()


def _row_payload(row: models.EmailTemplate) -> dict:
    return {
        "id": row.id,
        "key": row.key,
        "audience": row.audience,
        "title": row.title,
        "subject": row.subject,
        "cta_label": row.cta_label,
        "illustration": row.illustration,
        "tone": row.tone,
        "fields": row.fields or [],
        "enabled": row.enabled,
        "body": row.body,
    }


def _template_variables(row: models.EmailTemplate, variables: dict[str, Any] | None = None) -> dict:
    payload = {**SAMPLE_DATA, **(variables or {})}
    payload.update({
        "title": row.title,
        "subject": row.subject or row.title,
        "cta_label": row.cta_label,
        "illustration": row.illustration,
        "tone": row.tone,
        "audience": row.audience,
        "message": row.body or SAMPLE_DATA.get("summary"),
    })
    return payload


@router.get("/templates")
def list_templates(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    _seed_email_center(db)
    rows = db.query(models.EmailTemplate).order_by(models.EmailTemplate.audience.asc(), models.EmailTemplate.id.asc()).all()
    return [_row_payload(row) for row in rows]


@router.get("/variables")
def list_variables(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    _seed_email_center(db)
    rows = db.query(models.EmailVariable).order_by(models.EmailVariable.name.asc()).all()
    return [{"name": r.name, "audience": r.audience, "description": r.description, "sample": r.sample} for r in rows]


@router.post("/templates/{key}/preview")
def preview_template(key: str, body: PreviewRequest, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    _seed_email_center(db)
    row = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Template not found")
    subject, html = render_premium_email(template_key=key, variables=_template_variables(row, body.variables))
    return {"subject": subject, "html": html, "mobile": body.mobile}


@router.put("/templates/{key}")
def update_template(key: str, body: TemplateUpdate, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    _seed_email_center(db)
    row = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Template not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return _row_payload(row)


@router.post("/templates/{key}/duplicate")
def duplicate_template(key: str, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    _seed_email_center(db)
    row = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Template not found")
    index = db.query(models.EmailTemplate).filter(models.EmailTemplate.key.like(f"{key}_copy%")).count() + 1
    copy_key = f"{key}_copy_{index}"
    duplicate = models.EmailTemplate(
        key=copy_key,
        audience=row.audience,
        title=f"{row.title} Copy",
        subject=row.subject,
        cta_label=row.cta_label,
        illustration=row.illustration,
        tone=row.tone,
        fields=row.fields,
        enabled=False,
        body=row.body,
    )
    db.add(duplicate)
    db.commit()
    db.refresh(duplicate)
    return _row_payload(duplicate)


@router.post("/templates/{key}/test")
def send_test_email(key: str, body: TestEmailRequest, db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    _seed_email_center(db)
    row = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Template not found")
    if not row.enabled:
        raise HTTPException(status_code=400, detail="Template is disabled")
    subject, html = render_premium_email(template_key=key, variables=_template_variables(row, body.variables))
    result = send_email(str(body.to_email), subject, row.body or subject, html_body=html)
    db.add(models.EmailLog(
        template_key=key,
        recipient=str(body.to_email),
        subject=subject,
        status="sent" if result.get("sent") else ("dev_mode" if result.get("dev_mode") else "failed"),
        provider_response=str(result),
    ))
    db.commit()
    return result


@router.get("/logs")
def list_email_logs(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    rows = db.query(models.EmailLog).order_by(models.EmailLog.created_at.desc()).limit(100).all()
    return [{
        "id": r.id,
        "template_key": r.template_key,
        "recipient": r.recipient,
        "subject": r.subject,
        "status": r.status,
        "created_at": r.created_at,
    } for r in rows]
