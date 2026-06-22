from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import shutil
import uuid
from database import get_db
from config import settings
from auth import get_current_applicant, get_current_hr_user, tenant_filter, hash_password
from schemas import ApplicationCreate
import models
from email_service import notify_applicant
from NotificationEmailService import send_notification_email
from routers.resumes import (
    ALLOWED_TYPES,
    _ai_analyze_resume,
    _ai_extract_profile,
    _ai_extract_profile_from_image,
    _extract_skills_basic,
    _extract_text_docx,
    _extract_text_pdf,
    _heuristic_extract,
)

router = APIRouter(tags=["Applications"])


def _role_value(role) -> str:
    return role.value if hasattr(role, "value") else str(role or "")


def _notify_company_new_application(db: Session, *, application, applicant, job):
    if not getattr(application, "company_id", None):
        return
    hr_users = db.query(models.HRUser).filter(
        models.HRUser.company_id == application.company_id,
        models.HRUser.status == "active",
        models.HRUser.role.in_([
            models.HRRole.admin,
            models.HRRole.hr_manager,
            models.HRRole.hiring_manager,
        ]),
    ).all()
    link = f"/hr/candidates/{application.id}"
    action_url = f"{settings.FRONTEND_URL}{link}"
    for user in hr_users:
        role = _role_value(user.role)
        notification = models.Notification(
            company_id=application.company_id,
            recipient_scope="specific_user",
            recipient_user_id=user.id,
            recipient_role="interviewer" if role == "interviewer" else "hr_manager",
            notification_category="new_candidate",
            type="new_candidate",
            title="New candidate applied",
            message=f"{applicant.name} applied for {job.title}.",
            link=link,
            read=False,
            is_read=False,
        )
        db.add(notification)
        try:
            result = send_notification_email(user.email, "hr_new_application_alert", {
                "subject": f"New candidate applied - {job.title}",
                "user_name": user.name,
                "candidate_name": applicant.name,
                "position": job.title,
                "job_title": job.title,
                "company_name": job.company,
                "match_score": "Pending review",
                "message": f"{applicant.name} has submitted an application for {job.title}.",
                "cta_label": "Review Candidate",
                "action_url": action_url,
            })
            notification.email_sent = bool(result.get("sent") or result.get("dev_mode"))
        except Exception:
            notification.email_sent = False


class CompanyMessageRequest(BaseModel):
    message: str
    subject: str = ""


class HRCandidateCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    role_id: int | None = None
    job_id: int | None = None
    role_title: str = ""
    location: str = ""
    skills: list[str] = []
    years_of_experience: str = "0"
    notes: str = ""


def _conversation_message_out(m: models.TicketMessage) -> dict:
    return {
        "id": m.id,
        "senderType": m.sender_type,
        "senderName": m.sender_name,
        "message": m.message,
        "createdAt": m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else "",
    }


def _company_conversation_out(t: models.SupportTicket, with_messages: bool = False) -> dict:
    out = {
        "id": t.id,
        "subject": t.subject,
        "category": t.category,
        "status": t.status,
        "priority": t.priority,
        "requesterName": t.requester_name,
        "requesterEmail": t.requester_email,
        "unreadForUser": bool(t.unread_for_user),
        "unreadForAdmin": bool(t.unread_for_admin),
        "lastMessageAt": t.last_message_at.strftime("%Y-%m-%d %H:%M") if t.last_message_at else "",
        "messageCount": len(t.messages),
    }
    if with_messages:
        out["messages"] = [_conversation_message_out(m) for m in t.messages]
    return out


def _company_message_subject(app: models.Application) -> str:
    job = app.job
    return f"Re: {job.title if job else 'Application'} application"


# ─── Applicant-facing endpoints ───────────────────────────────────────────────

@router.post("/applicant/apply", status_code=201)
def apply_to_job(
    body: ApplicationCreate,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    job = db.query(models.Job).filter(models.Job.id == body.job_id, models.Job.status == "active").first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or closed")

    existing = db.query(models.Application).filter(
        models.Application.applicant_id == current.id,
        models.Application.job_id == body.job_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    role = db.query(models.HiringRole).filter(models.HiringRole.published_job_id == body.job_id).first()
    application = models.Application(
        applicant_id=current.id,
        job_id=body.job_id,
        job_role_id=role.id if role else None,
        company_id=job.company_id,   # inherit tenant from the job being applied to
        cover_letter=body.cover_letter,
        status=models.ApplicationStatus.applied,
        pipeline_stage=models.PipelineStage.new,
    )
    db.add(application)
    db.flush()

    timeline_entry = models.ApplicationTimeline(
        application_id=application.id,
        status="Applied",
        description="Your application was submitted successfully.",
    )
    db.add(timeline_entry)

    notify_applicant(
        db, models, current.id,
        type="application",
        title=f"Application submitted — {job.title}",
        message=f"Your application for {job.title} at {job.company} has been received.",
        link=f"/user/applications/{application.id}",
    )
    _notify_company_new_application(db, application=application, applicant=current, job=job)
    db.commit()
    db.refresh(application)

    return {"id": application.id, "message": "Application submitted successfully"}


@router.get("/applicant/applications")
def get_my_applications(
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    apps = db.query(models.Application).filter(
        models.Application.applicant_id == current.id
    ).order_by(models.Application.applied_at.desc()).all()
    return [_app_out(a, db) for a in apps]


@router.get("/applicant/applications/{app_id}")
def get_application_detail(
    app_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.applicant_id == current.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return _app_out(app, db, detailed=True)


@router.delete("/applicant/applications/{app_id}")
def withdraw_application(
    app_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.applicant_id == current.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"message": "Application withdrawn"}


@router.post("/applicant/applications/{app_id}/message-company", status_code=201)
def message_company(
    app_id: int,
    body: CompanyMessageRequest,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.applicant_id == current.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    job = app.job
    subject = body.subject.strip() or _company_message_subject(app)
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.company_id == app.company_id,
        models.SupportTicket.requester_type == "company_candidate",
        models.SupportTicket.requester_id == current.id,
        models.SupportTicket.subject == subject,
    ).first()
    if not ticket:
        ticket = models.SupportTicket(
            company_id=app.company_id,
            subject=subject,
            message=body.message.strip(),
            priority="Medium",
            status="Open",
            requester_type="company_candidate",
            requester_id=current.id,
            requester_name=current.name,
            requester_email=current.email,
            category="Candidate Message",
            unread_for_admin=True,
            unread_for_user=False,
            last_message_at=datetime.utcnow(),
        )
        db.add(ticket)
        db.flush()
    db.add(models.TicketMessage(
        ticket_id=ticket.id,
        sender_type="user",
        sender_name=current.name,
        message=body.message.strip(),
        is_read=False,
    ))
    db.add(models.Notification(
        company_id=app.company_id,
        recipient_scope="specific_company",
        recipient_role="hr_manager",
        notification_category="candidate_message",
        type="candidate_message",
        title=f"Candidate message - {current.name}",
        message=f"{current.name} sent a message about {job.title if job else 'an application'}: {body.message.strip()}",
        link=f"/hr/company-messages",
    ))
    ticket.status = "Open"
    ticket.unread_for_admin = True
    ticket.last_message_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return _company_conversation_out(ticket, with_messages=True)


@router.get("/applicant/applications/{app_id}/company-conversation")
def get_company_conversation(
    app_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.applicant_id == current.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    subject = _company_message_subject(app)
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.company_id == app.company_id,
        models.SupportTicket.requester_type == "company_candidate",
        models.SupportTicket.requester_id == current.id,
        models.SupportTicket.subject == subject,
    ).first()
    if not ticket:
        return None
    ticket.unread_for_user = False
    for message in ticket.messages:
        if message.sender_type == "hr":
            message.is_read = True
    db.commit()
    return _company_conversation_out(ticket, with_messages=True)


# ─── HR-facing endpoints ──────────────────────────────────────────────────────

@router.get("/hr/applications")
def hr_list_applications(
    job_id: int = None,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    q = tenant_filter(db.query(models.Application), models.Application, hr_user)
    if job_id:
        q = q.filter(models.Application.job_id == job_id)
    apps = q.order_by(models.Application.applied_at.desc()).all()
    return [_hr_app_out(a, db) for a in apps]


@router.get("/hr/company-messages")
def hr_company_messages(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.SupportTicket).filter(
        models.SupportTicket.requester_type == "company_candidate",
        models.SupportTicket.company_id == hr_user.company_id,
    ).order_by(models.SupportTicket.last_message_at.desc())
    return [_company_conversation_out(t) for t in q.all()]


@router.get("/hr/company-messages/{ticket_id}")
def hr_company_message_detail(
    ticket_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id,
        models.SupportTicket.requester_type == "company_candidate",
        models.SupportTicket.company_id == hr_user.company_id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Conversation not found")
    ticket.unread_for_admin = False
    for message in ticket.messages:
        if message.sender_type == "user":
            message.is_read = True
    db.commit()
    return _company_conversation_out(ticket, with_messages=True)


@router.post("/hr/company-messages/{ticket_id}/messages", status_code=201)
def hr_reply_company_message(
    ticket_id: int,
    body: CompanyMessageRequest,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id,
        models.SupportTicket.requester_type == "company_candidate",
        models.SupportTicket.company_id == hr_user.company_id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    db.add(models.TicketMessage(
        ticket_id=ticket.id,
        sender_type="hr",
        sender_name=hr_user.name,
        message=body.message.strip(),
        is_read=False,
    ))
    ticket.status = "In Progress"
    ticket.unread_for_user = True
    ticket.last_message_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return _company_conversation_out(ticket, with_messages=True)


@router.patch("/hr/applications/{app_id}/stage")
def update_pipeline_stage(
    app_id: int,
    body: dict,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    app = tenant_filter(db.query(models.Application), models.Application, hr_user).filter(
        models.Application.id == app_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    new_stage = body.get("stage")
    new_status = body.get("status")

    if new_stage:
        try:
            app.pipeline_stage = models.PipelineStage(new_stage)
        except ValueError:
            # Also accept enum names such as "shortlisted" from older UI code
            app.pipeline_stage = models.PipelineStage.__members__.get(str(new_stage).lower(), models.PipelineStage.new)
    if new_status:
        try:
            app.status = models.ApplicationStatus(new_status)
        except ValueError:
            app.status = models.ApplicationStatus.__members__.get(str(new_status).lower(), models.ApplicationStatus.applied)

    # Add timeline entry
    timeline_entry = models.ApplicationTimeline(
        application_id=app.id,
        status=new_status or new_stage or "Updated",
        description=body.get("note", f"Application stage updated by HR team."),
    )
    db.add(timeline_entry)

    # Notify applicant inside the portal and by email.
    status_text = new_status or new_stage or "Updated"
    job = app.job
    title = "Application status updated"
    if str(status_text).lower() in ["accepted", "hired", "offer sent"]:
        title = "Congratulations — application update"
    elif str(status_text).lower() == "rejected":
        title = "Application update"
    notify_applicant(
        db, models, app.applicant_id,
        type="status_update",
        title=title,
        message=f"Your application for {job.title if job else 'the role'} has been updated to: {status_text}.",
        link=f"/user/applications/{app.id}",
    )
    db.commit()

    return {"message": "Stage updated"}


@router.get("/hr/candidates")
def hr_list_candidates(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    apps = tenant_filter(db.query(models.Application), models.Application, hr_user).order_by(
        models.Application.applied_at.desc()
    ).all()
    return [_hr_candidate_out(a, db) for a in apps]


@router.post("/hr/candidates", status_code=201)
def hr_create_candidate(
    body: HRCandidateCreate,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    email = body.email.lower().strip()
    applicant = db.query(models.Applicant).filter(models.Applicant.email.ilike(email)).first()
    if not applicant:
        applicant = models.Applicant(
            name=body.name.strip(),
            email=email,
            password_hash=hash_password(f"TalentFlow@{uuid.uuid4().hex[:8]}"),
            phone=body.phone.strip(),
            location=body.location.strip(),
            skills=body.skills or [],
            years_of_experience=body.years_of_experience or "0",
            is_verified=True,
            is_active=True,
            profile_completion=35,
        )
        db.add(applicant)
        db.flush()
        if not db.query(models.ApplicantSettings).filter(models.ApplicantSettings.applicant_id == applicant.id).first():
            db.add(models.ApplicantSettings(applicant_id=applicant.id))
    else:
        applicant.name = body.name.strip() or applicant.name
        applicant.phone = body.phone.strip() or applicant.phone
        applicant.location = body.location.strip() or applicant.location
        if body.skills:
            applicant.skills = body.skills
        if body.years_of_experience:
            applicant.years_of_experience = body.years_of_experience

    job = None
    role = None
    if body.job_id:
        job = tenant_filter(db.query(models.Job), models.Job, hr_user).filter(models.Job.id == body.job_id).first()
    if body.role_id:
        role = tenant_filter(db.query(models.HiringRole), models.HiringRole, hr_user).filter(models.HiringRole.id == body.role_id).first()
        if role and role.published_job_id:
            job = db.query(models.Job).filter(models.Job.id == role.published_job_id).first()
    if not job:
        title = body.role_title.strip() or (role.title if role else "Manual Candidate")
        job = models.Job(
            company_id=hr_user.company_id,
            title=title,
            company="",
            location=body.location or "",
            job_type="Manual",
            description="Manual candidate record created by HR.",
            requirements=[],
            skills_required=body.skills or [],
            compensation_range="",
            status="active",
        )
        db.add(job)
        db.flush()

    existing = db.query(models.Application).filter(
        models.Application.applicant_id == applicant.id,
        models.Application.job_id == job.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Candidate already exists for this role")

    app = models.Application(
        applicant_id=applicant.id,
        job_id=job.id,
        job_role_id=role.id if role else None,
        company_id=hr_user.company_id,
        status=models.ApplicationStatus.applied,
        pipeline_stage=models.PipelineStage.new,
        cover_letter="Added manually by HR.",
        notes=body.notes,
    )
    db.add(app)
    db.flush()
    db.add(models.ApplicationTimeline(
        application_id=app.id,
        status="Candidate Added",
        description="Candidate profile was added manually by HR.",
    ))
    db.commit()
    db.refresh(app)
    return _hr_candidate_out(app, db)


# ─── Talent Pool (applications parked in the "Talent Pool" stage) ─────────────

@router.get("/hr/talent-pool")
def hr_talent_pool(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    apps = tenant_filter(db.query(models.Application), models.Application, hr_user).filter(
        models.Application.pipeline_stage == models.PipelineStage.talent_pool
    ).order_by(models.Application.applied_at.desc()).all()
    return [_hr_candidate_out(a, db) for a in apps]


@router.post("/hr/talent-pool", status_code=201)
def add_to_talent_pool(
    body: dict,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    app_id = body.get("application_id")
    app = tenant_filter(db.query(models.Application), models.Application, hr_user).filter(
        models.Application.id == app_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.pipeline_stage = models.PipelineStage.talent_pool
    db.add(models.ApplicationTimeline(
        application_id=app.id, status="Talent Pool",
        description="Added to the talent pool by HR team.",
    ))
    db.commit()
    return {"message": "Added to talent pool", "id": app.id}


@router.delete("/hr/talent-pool/{app_id}")
def remove_from_talent_pool(
    app_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    app = tenant_filter(db.query(models.Application), models.Application, hr_user).filter(
        models.Application.id == app_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.pipeline_stage = models.PipelineStage.new
    db.commit()
    return {"message": "Removed from talent pool"}


@router.delete("/hr/candidates/{app_id}")
def delete_hr_candidate(
    app_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    app = tenant_filter(db.query(models.Application), models.Application, hr_user).filter(
        models.Application.id == app_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate not found")
    interviews = db.query(models.Interview).filter(models.Interview.application_id == app.id).all()
    for interview in interviews:
        if interview.note:
            db.delete(interview.note)
        for feedback in list(interview.evaluations):
            db.delete(feedback)
        db.delete(interview)
    db.query(models.ApplicationTimeline).filter(
        models.ApplicationTimeline.application_id == app.id
    ).delete(synchronize_session=False)
    db.delete(app)
    db.commit()
    return {"message": "Candidate deleted"}


# ─── HR Resume Center (resumes of this tenant's candidates) ───────────────────

@router.get("/hr/resumes")
def hr_resumes(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    apps = tenant_filter(db.query(models.Application), models.Application, hr_user).order_by(
        models.Application.applied_at.desc()
    ).all()
    out = []
    seen = set()
    for a in apps:
        if not a.applicant or a.applicant_id in seen:
            continue
        seen.add(a.applicant_id)
        resume = db.query(models.Resume).filter(
            models.Resume.applicant_id == a.applicant_id,
            models.Resume.is_primary == True,
        ).first()
        out.append({
            "id": a.id,                       # application id (used for AI analysis)
            "applicantId": a.applicant_id,
            "candidateName": a.applicant.name,
            "fileName": resume.file_name if resume else "No resume uploaded",
            "uploadDate": resume.uploaded_at.strftime("%Y-%m-%d") if (resume and resume.uploaded_at) else "",
            "hasResume": resume is not None,
            "resumeId": resume.id if resume else None,
            "aiScore": resume.ai_score if resume else None,
            "atsScore": resume.ats_score if resume else None,
            "skills": (a.applicant.skills or [])[:8],
        })
    return out


def _apply_extracted_profile_to_applicant(db: Session, applicant: models.Applicant, profile: dict | None):
    if not applicant or not profile:
        return
    for field in ["name", "phone", "location", "headline", "bio", "linkedin", "portfolio"]:
        value = profile.get(field)
        if value and not getattr(applicant, field, None):
            setattr(applicant, field, str(value))
    if profile.get("years_of_experience"):
        applicant.years_of_experience = str(profile["years_of_experience"])
    if profile.get("skills"):
        seen = {s.lower() for s in (applicant.skills or [])}
        applicant.skills = (applicant.skills or []) + [s for s in profile["skills"] if str(s).lower() not in seen]
    if profile.get("languages"):
        seen = {l.lower() for l in (applicant.languages or [])}
        applicant.languages = (applicant.languages or []) + [l for l in profile["languages"] if str(l).lower() not in seen]
    if profile.get("education"):
        seen = {(e.degree.lower(), e.university.lower()) for e in applicant.education}
        for edu in profile["education"]:
            key = (str(edu.get("degree", "")).lower(), str(edu.get("university", "")).lower())
            if key[0] and key[1] and key not in seen:
                db.add(models.Education(
                    applicant_id=applicant.id,
                    degree=edu.get("degree", ""),
                    university=edu.get("university", ""),
                    graduation_year=str(edu.get("graduation_year", "")),
                    gpa=str(edu.get("gpa", "")),
                ))
                seen.add(key)
    if profile.get("experience"):
        seen = {(e.title.lower(), e.company.lower()) for e in applicant.experiences}
        for exp in profile["experience"]:
            key = (str(exp.get("title", "")).lower(), str(exp.get("company", "")).lower())
            if key[0] and key[1] and key not in seen:
                db.add(models.Experience(
                    applicant_id=applicant.id,
                    title=exp.get("title", ""),
                    company=exp.get("company", ""),
                    start_year=str(exp.get("start_year", "")),
                    end_year=str(exp.get("end_year", "")),
                    description=str(exp.get("description", "")),
                ))
                seen.add(key)


@router.post("/hr/candidates/{app_id}/resume", status_code=201)
async def hr_upload_candidate_resume(
    app_id: int,
    file: UploadFile = File(...),
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    app = tenant_filter(db.query(models.Application), models.Application, hr_user).filter(
        models.Application.id == app_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and resume images are supported")

    safe_name = Path(file.filename or "resume").name
    ext = ALLOWED_TYPES[file.content_type]
    upload_root = Path("uploads")
    upload_dir = upload_root / "hr_resumes"
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_path = upload_dir / f"{uuid.uuid4().hex}_{safe_name}"
    content = await file.read()
    with stored_path.open("wb") as out:
        out.write(content)

    if ext == "pdf":
        extracted_text = _extract_text_pdf(str(stored_path))
    elif ext in ("doc", "docx"):
        extracted_text = _extract_text_docx(str(stored_path))
    else:
        extracted_text = ""

    extracted_profile = _ai_extract_profile_from_image(str(stored_path), file.content_type) if ext in ("png", "jpg", "webp") else _ai_extract_profile(extracted_text)
    extraction_method = "ai"
    if not extracted_profile:
        extracted_profile = _heuristic_extract(extracted_text)
        extraction_method = "heuristic" if extracted_profile else "none"
    skills = _extract_skills_basic(extracted_text)
    if extracted_profile and extracted_profile.get("skills"):
        skills = sorted(set(skills) | {str(s) for s in extracted_profile["skills"] if s})
    analysis = _ai_analyze_resume(extracted_text)

    db.query(models.Resume).filter(models.Resume.applicant_id == app.applicant_id).update(
        {"is_primary": False}, synchronize_session=False
    )
    resume = models.Resume(
        applicant_id=app.applicant_id,
        file_name=safe_name,
        file_path=str(stored_path.relative_to(upload_root)),
        file_type=ext,
        file_size_kb=max(1, int(len(content) / 1024)),
        extracted_text=extracted_text[:10000] if extracted_text else f"Uploaded by HR: {safe_name}.",
        skills_extracted=skills,
        is_primary=True,
        ai_summary=analysis.get("ai_summary", ""),
        ai_score=analysis.get("ai_score"),
        ats_score=analysis.get("ats_score"),
        strengths=analysis.get("strengths", []),
        weaknesses=analysis.get("weaknesses", []),
        improvements=analysis.get("improvements", []),
        missing_skills=analysis.get("missing_skills", []),
    )
    db.add(resume)
    _apply_extracted_profile_to_applicant(db, app.applicant, extracted_profile)
    db.commit()
    db.refresh(resume)
    return {
        "id": resume.id,
        "message": "Resume uploaded and analyzed",
        "fileName": resume.file_name,
        "skills_extracted": resume.skills_extracted,
        "ai_score": resume.ai_score,
        "ats_score": resume.ats_score,
        "extracted_profile": extracted_profile,
        "extraction_method": extraction_method,
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _app_out(app: models.Application, db: Session, detailed: bool = False) -> dict:
    job = app.job
    result = {
        "id": app.id,
        "jobId": app.job_id,
        "jobTitle": job.title if job else "",
        "company": job.company if job else "",
        "location": job.location if job else "",
        "type": job.job_type if job else "",
        "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
        "pipelineStage": app.pipeline_stage.value if hasattr(app.pipeline_stage, 'value') else str(app.pipeline_stage),
        "appliedDate": app.applied_at.strftime("%Y-%m-%d") if app.applied_at else "",
        "coverLetter": app.cover_letter,
        "notes": app.notes,
    }
    if detailed:
        result["timeline"] = [
            {
                "status": t.status,
                "date": t.created_at.strftime("%Y-%m-%d") if t.created_at else "",
                "time": t.created_at.strftime("%I:%M %p") if t.created_at else "",
                "description": t.description,
                "done": True,
            }
            for t in app.timeline
        ]
        result["interviews"] = [
            {
                "id": i.id,
                "date": i.date,
                "time": i.time,
                "type": i.interview_type,
                "location": i.location,
                "status": i.status,
            }
            for i in app.interviews
        ]
        result["feedback"] = [
            {
                "interviewId": i.id,
                "rating": i.rating,
                "recommendation": i.recommendation,
                "feedback": i.feedback,
                "notes": i.notes,
                "status": i.status,
            }
            for i in app.interviews
            if i.feedback or i.recommendation or i.rating
        ]
    return result


def _hr_app_out(app: models.Application, db: Session) -> dict:
    applicant = app.applicant
    job = app.job
    return {
        "id": app.id,
        "applicantId": app.applicant_id,
        "applicantName": applicant.name if applicant else "",
        "applicantEmail": applicant.email if applicant else "",
        "jobId": app.job_id,
        "jobTitle": job.title if job else "",
        "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
        "pipelineStage": app.pipeline_stage.value if hasattr(app.pipeline_stage, 'value') else str(app.pipeline_stage),
        "appliedDate": app.applied_at.strftime("%Y-%m-%d") if app.applied_at else "",
        "skills": applicant.skills if applicant else [],
        "location": applicant.location if applicant else "",
    }


def _hr_candidate_out(app: models.Application, db: Session) -> dict:
    a = app.applicant
    j = app.job
    resume = db.query(models.Resume).filter(
        models.Resume.applicant_id == app.applicant_id,
        models.Resume.is_primary == True,  # noqa: E712
    ).first()
    return {
        "id": app.id,
        "applicantId": a.id if a else None,
        "name": a.name if a else "",
        "email": a.email if a else "",
        "phone": a.phone if a else "",
        "location": a.location if a else "",
        "skills": a.skills if a else [],
        "languages": a.languages if a else [],
        "experience": f"{a.years_of_experience} years" if a else "",
        "availability": a.availability if a else "",
        "headline": a.headline if a else "",
        "bio": a.bio if a else "",
        "degree": a.degree if a else "",
        "university": a.university if a else "",
        "linkedin": a.linkedin if a else "",
        "portfolio": a.portfolio if a else "",
        "resume": {
            "id": resume.id,
            "fileName": resume.file_name,
            "url": f"/uploads/{resume.file_path.replace(chr(92), '/')}",
            "aiScore": resume.ai_score,
            "atsScore": resume.ats_score,
        } if resume else None,
        "roleId": j.id if j else None,
        "roleTitle": j.title if j else "",
        "stage": app.pipeline_stage.value if hasattr(app.pipeline_stage, 'value') else str(app.pipeline_stage),
        "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
        "appliedDate": app.applied_at.strftime("%Y-%m-%d") if app.applied_at else "",
    }
