from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth import get_current_applicant, get_current_hr_user, tenant_filter
import models
from email_service import notify_applicant

router = APIRouter(tags=["Interviews"])


class ScheduleInterviewRequest(BaseModel):
    application_id: int
    date: str
    time: str
    interview_type: str = "Online"
    meeting_provider: str = ""
    meeting_url: str = ""
    onsite_address: str = ""
    location: str = ""
    interviewer_id: int = None
    notes: str = ""


class InterviewNoteRequest(BaseModel):
    technical_rating: int = 0
    communication_rating: int = 0
    problem_solving_rating: int = 0
    domain_rating: int = 0
    strengths: str = ""
    concerns: str = ""
    notes: str = ""
    recommendation: str = ""


@router.get("/applicant/interviews")
def get_my_interviews(
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    interviews = db.query(models.Interview).filter(
        models.Interview.applicant_id == current.id
    ).order_by(models.Interview.created_at.desc()).all()
    return [_interview_out(i, db) for i in interviews]


@router.post("/hr/interviews", status_code=201)
def schedule_interview(
    body: ScheduleInterviewRequest,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    app = tenant_filter(db.query(models.Application), models.Application, hr_user).filter(
        models.Application.id == body.application_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    interview = models.Interview(
        application_id=app.id,
        applicant_id=app.applicant_id,
        job_id=app.job_id,
        job_role_id=app.job_role_id,
        company_id=app.company_id,
        interviewer_id=body.interviewer_id or hr_user.id,
        date=body.date,
        time=body.time,
        interview_type=body.interview_type,
        location=body.meeting_url or body.onsite_address or body.location,
        meeting_provider=body.meeting_provider,
        meeting_url=body.meeting_url,
        onsite_address=body.onsite_address,
        notes=body.notes,
        status="Scheduled",
    )
    db.add(interview)

    app.status = models.ApplicationStatus.interview_scheduled
    app.pipeline_stage = models.PipelineStage.interview_scheduled

    timeline = models.ApplicationTimeline(
        application_id=app.id,
        status="Interview Scheduled",
        description=f"Interview scheduled for {body.date} at {body.time}",
    )
    db.add(timeline)

    job = app.job
    notify_applicant(
        db, models, app.applicant_id,
        type="interview",
        title="Interview Scheduled",
        message=f"Your interview for {job.title if job else 'the role'} has been scheduled for {body.date} at {body.time}. Type: {body.interview_type}. Location/link: {body.meeting_url or body.onsite_address or body.location or 'TBA'}.",
        link=f"/user/applications/{app.id}",
        email_subject="TalentFlow Interview Scheduled",
    )
    db.commit()
    db.refresh(interview)

    return {"id": interview.id, "message": "Interview scheduled"}


@router.get("/hr/interviews")
def hr_list_interviews(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    interviews = tenant_filter(db.query(models.Interview), models.Interview, hr_user).order_by(
        models.Interview.date.desc()
    ).all()
    return [_hr_interview_out(i, db) for i in interviews]


@router.get("/hr/interviews/{interview_id}")
def get_interview(
    interview_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    iv = tenant_filter(db.query(models.Interview), models.Interview, hr_user).filter(
        models.Interview.id == interview_id
    ).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
    out = _hr_interview_out(iv, db)
    out["applicationId"] = iv.application_id
    out["candidatePhone"] = iv.application.applicant.phone if iv.application and iv.application.applicant else ""
    resume = db.query(models.Resume).filter(
        models.Resume.applicant_id == iv.applicant_id
    ).order_by(models.Resume.is_primary.desc(), models.Resume.uploaded_at.desc()).first()
    resume_url = f"/uploads/{resume.file_path.replace(chr(92), '/')}" if resume else ""
    out["resume"] = {
        "id": resume.id,
        "fileName": resume.file_name,
        "url": resume_url,
    } if resume else None
    out["interviewer"] = iv.interviewer.name if iv.interviewer else ""
    out["notesForm"] = _note_out(iv.note)
    out["evaluations"] = [
        {
            "id": e.id,
            "interviewerId": e.interviewer_id,
            "technicalScore": e.technical_score,
            "communicationScore": e.communication_score,
            "cultureScore": e.culture_score,
            "overallScore": e.overall_score,
            "recommendation": e.recommendation,
            "strengths": e.strengths,
            "weaknesses": e.weaknesses,
            "comments": e.comments,
            "createdAt": e.created_at.strftime("%Y-%m-%d") if e.created_at else "",
        }
        for e in iv.evaluations
    ]
    return out


@router.put("/hr/interviews/{interview_id}/notes")
def save_interview_notes(
    interview_id: int,
    body: InterviewNoteRequest,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    interview = tenant_filter(db.query(models.Interview), models.Interview, hr_user).filter(
        models.Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    note = interview.note or models.InterviewNote(
        interview_id=interview.id,
        interviewer_id=hr_user.id,
    )
    for field, value in body.model_dump().items():
        setattr(note, field, value)
    db.add(note)

    ratings = [
        body.technical_rating,
        body.communication_rating,
        body.problem_solving_rating,
        body.domain_rating,
    ]
    non_zero = [r for r in ratings if r]
    interview.rating = round(sum(non_zero) / len(non_zero), 1) if non_zero else None
    interview.recommendation = body.recommendation
    interview.notes = body.notes
    interview.feedback = "\n\n".join(x for x in [body.strengths, body.concerns] if x)

    if body.recommendation in ["Strong Hire", "Hire"]:
        _move_application(interview.application, models.PipelineStage.recommended, models.ApplicationStatus.interviewed)
    elif body.recommendation == "No Hire":
        _move_application(interview.application, models.PipelineStage.rejected, models.ApplicationStatus.rejected)

    if body.recommendation:
        db.add(models.ApplicationTimeline(
            application_id=interview.application_id,
            status="Interview Feedback",
            description=f"Interview evaluation saved. Recommendation: {body.recommendation}.",
        ))
    db.commit()
    db.refresh(note)
    return {"message": "Interview notes saved", "notes": _note_out(note), "rating": interview.rating}


@router.patch("/hr/interviews/{interview_id}")
def update_interview(
    interview_id: int,
    body: dict,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    interview = tenant_filter(db.query(models.Interview), models.Interview, hr_user).filter(
        models.Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    for field in ["date", "time", "interview_type", "location", "meeting_provider", "meeting_url", "onsite_address", "status", "rating", "recommendation", "notes", "feedback"]:
        if field in body:
            setattr(interview, field, body[field])
    if body.get("status") == "Completed":
        _move_application(interview.application, models.PipelineStage.interviewed, models.ApplicationStatus.interviewed)
        db.add(models.ApplicationTimeline(
            application_id=interview.application_id,
            status="Interviewed",
            description="Interview completed by the hiring team.",
        ))
    # Notify applicant if the schedule/status changed.
    notify_applicant(
        db, models, interview.applicant_id,
        type="interview",
        title="Interview Updated",
        message=f"Your interview has been updated. Date: {interview.date}, time: {interview.time}, status: {interview.status}.",
        link=f"/user/applications/{interview.application_id}",
        email_subject="TalentFlow Interview Updated",
    )
    db.commit()
    return {"message": "Interview updated"}


@router.delete("/hr/interviews/{interview_id}")
def delete_interview(
    interview_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    interview = tenant_filter(db.query(models.Interview), models.Interview, hr_user).filter(
        models.Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.note:
        db.delete(interview.note)
    for feedback in list(interview.evaluations):
        db.delete(feedback)
    db.delete(interview)
    db.commit()
    return {"message": "Interview deleted"}


@router.post("/hr/interviews/{interview_id}/feedback")
def send_interview_feedback(
    interview_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    interview = tenant_filter(db.query(models.Interview), models.Interview, hr_user).filter(
        models.Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    note = interview.note
    parts = []
    if interview.rating:
        parts.append(f"Overall rating: {interview.rating}/5.")
    if interview.recommendation:
        parts.append(f"Recommendation: {interview.recommendation}.")
    if note and note.strengths:
        parts.append(f"Strengths: {note.strengths}")
    if note and note.concerns:
        parts.append(f"Areas to improve: {note.concerns}")
    if note and note.notes:
        parts.append(f"Notes: {note.notes}")
    message = " ".join(parts) or "Your interview feedback has been reviewed by the hiring team."
    db.add(models.ApplicationTimeline(
        application_id=interview.application_id,
        status="Feedback Sent",
        description="The hiring team shared interview feedback.",
    ))
    notify_applicant(
        db, models, interview.applicant_id,
        type="status_update",
        title="Interview feedback submitted",
        message=message,
        link=f"/user/applications/{interview.application_id}",
        email_subject="TalentFlow Interview Feedback",
    )
    db.commit()
    return {"message": "Interview feedback sent"}


def _interview_out(i: models.Interview, db: Session) -> dict:
    job = db.query(models.Job).filter(models.Job.id == i.job_id).first()
    return {
        "id": i.id,
        "jobTitle": job.title if job else "",
        "company": job.company if job else "",
        "date": i.date,
        "time": i.time,
        "type": i.interview_type,
        "location": i.location,
        "meetingProvider": i.meeting_provider or "",
        "meetingUrl": i.meeting_url or "",
        "onsiteAddress": i.onsite_address or "",
        "status": i.status,
        "applicationId": i.application_id,
    }


def _hr_interview_out(i: models.Interview, db: Session) -> dict:
    applicant = db.query(models.Applicant).filter(models.Applicant.id == i.applicant_id).first()
    job = db.query(models.Job).filter(models.Job.id == i.job_id).first()
    resume = None
    if applicant:
        resume = db.query(models.Resume).filter(
            models.Resume.applicant_id == applicant.id,
            models.Resume.is_primary == True,
        ).order_by(models.Resume.uploaded_at.desc()).first()
    return {
        "id": i.id,
        "candidateName": applicant.name if applicant else "",
        "candidateEmail": applicant.email if applicant else "",
        "candidatePhone": applicant.phone if applicant else "",
        "candidateLocation": applicant.location if applicant else "",
        "candidateHeadline": applicant.headline if applicant else "",
        "candidateBio": applicant.bio if applicant else "",
        "candidateSkills": applicant.skills if applicant else [],
        "roleTitle": job.title if job else "",
        "date": i.date,
        "time": i.time,
        "type": i.interview_type,
        "location": i.location,
        "meetingProvider": i.meeting_provider or "",
        "meetingUrl": i.meeting_url or "",
        "onsiteAddress": i.onsite_address or "",
        "status": i.status,
        "rating": i.rating,
        "recommendation": i.recommendation,
        "notes": i.notes,
        "feedback": i.feedback,
        "resume": {
            "id": resume.id,
            "fileName": resume.file_name,
            "url": f"/uploads/{resume.file_path.replace(chr(92), '/')}",
        } if resume else None,
    }


def _note_out(note: models.InterviewNote | None) -> dict:
    if not note:
        return {
            "technical_rating": 0,
            "communication_rating": 0,
            "problem_solving_rating": 0,
            "domain_rating": 0,
            "strengths": "",
            "concerns": "",
            "notes": "",
            "recommendation": "",
        }
    return {
        "id": note.id,
        "technical_rating": note.technical_rating or 0,
        "communication_rating": note.communication_rating or 0,
        "problem_solving_rating": note.problem_solving_rating or 0,
        "domain_rating": note.domain_rating or 0,
        "strengths": note.strengths or "",
        "concerns": note.concerns or "",
        "notes": note.notes or "",
        "recommendation": note.recommendation or "",
        "updatedAt": note.updated_at.strftime("%Y-%m-%d %H:%M") if note.updated_at else "",
    }


def _move_application(app, stage, status):
    if not app:
        return
    app.pipeline_stage = stage
    app.status = status
