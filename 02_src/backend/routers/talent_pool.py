from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
from auth import get_current_hr_user
from database import get_db

router = APIRouter(prefix="/company/talent-pool", tags=["Company Talent Pool"])

VALID_STATUSES = {"Available", "Contacted", "Hired", "Rejected"}


class TalentPoolAdd(BaseModel):
    candidate_id: int | None = None
    application_id: int | None = None
    job_id: int | None = None
    status: str = "Available"
    notes: str = ""


class TalentPoolUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


def _company_id(hr_user: models.HRUser) -> int:
    if not hr_user.company_id:
        raise HTTPException(status_code=403, detail="Account is not associated with a company")
    return hr_user.company_id


def _status(value: str) -> str:
    if value not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid talent pool status")
    return value


def _latest_resume(db: Session, candidate_id: int):
    return db.query(models.Resume).filter(
        models.Resume.applicant_id == candidate_id,
        models.Resume.is_primary == True,  # noqa: E712
    ).order_by(models.Resume.uploaded_at.desc()).first()


def _out(row: models.TalentPool, db: Session) -> dict:
    candidate = row.candidate
    job = row.job
    resume = _latest_resume(db, row.candidate_id)
    skills = candidate.skills if candidate and isinstance(candidate.skills, list) else []
    years = candidate.years_of_experience if candidate else ""
    return {
        "id": row.id,
        "companyId": row.company_id,
        "candidateId": row.candidate_id,
        "jobId": row.job_id,
        "name": candidate.name if candidate else "",
        "email": candidate.email if candidate else "",
        "phone": candidate.phone if candidate else "",
        "roleTitle": (job.title if job else "") or (candidate.headline if candidate else ""),
        "skills": skills,
        "yearsOfExperience": years,
        "experience": f"{years} years" if years not in (None, "") else "",
        "city": candidate.location if candidate else "",
        "location": candidate.location if candidate else "",
        "resume": {
            "id": resume.id,
            "fileName": resume.file_name,
            "url": f"/uploads/{resume.file_path.replace(chr(92), '/')}",
        } if resume else None,
        "status": row.status,
        "notes": row.notes or "",
        "createdAt": row.created_at.strftime("%Y-%m-%d") if row.created_at else "",
        "updatedAt": row.updated_at.strftime("%Y-%m-%d") if row.updated_at else "",
    }


@router.post("/add", status_code=201)
def add_to_talent_pool(
    body: TalentPoolAdd,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    company_id = _company_id(hr_user)
    candidate_id = body.candidate_id
    job_id = body.job_id

    if body.application_id:
        app = db.query(models.Application).filter(
            models.Application.id == body.application_id,
            models.Application.company_id == company_id,
        ).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        candidate_id = app.applicant_id
        job_id = body.job_id or app.job_id
        app.pipeline_stage = models.PipelineStage.talent_pool
        db.add(models.ApplicationTimeline(
            application_id=app.id,
            status="Talent Pool",
            description="Added to the talent pool by HR team.",
        ))

    if not candidate_id:
        raise HTTPException(status_code=400, detail="candidate_id or application_id is required")

    candidate = db.query(models.Applicant).filter(models.Applicant.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    existing = db.query(models.TalentPool).filter(
        models.TalentPool.company_id == company_id,
        models.TalentPool.candidate_id == candidate_id,
    ).first()
    if existing:
        return _out(existing, db)

    row = models.TalentPool(
        company_id=company_id,
        candidate_id=candidate_id,
        job_id=job_id,
        status=_status(body.status),
        notes=body.notes.strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _out(row, db)


@router.get("")
def list_talent_pool(
    search: str = "",
    status: str = "All",
    experience: str = Query("All"),
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    company_id = _company_id(hr_user)
    q = db.query(models.TalentPool).join(models.Applicant).outerjoin(models.Job).filter(
        models.TalentPool.company_id == company_id
    )
    if status and status != "All":
        q = q.filter(models.TalentPool.status == status)
    if search:
        term = f"%{search.lower()}%"
        q = q.filter(or_(
            models.Applicant.name.ilike(term),
            models.Applicant.email.ilike(term),
            models.Applicant.headline.ilike(term),
            models.Job.title.ilike(term),
        ))
    rows = q.order_by(models.TalentPool.created_at.desc()).all()
    out = [_out(row, db) for row in rows]
    if search:
        needle = search.lower()
        out = [row for row in out if needle in " ".join([
            row.get("name", ""), row.get("email", ""), row.get("roleTitle", ""),
            " ".join(row.get("skills", [])),
        ]).lower()]
    if experience and experience != "All":
        def years(row):
            try:
                return float(str(row.get("yearsOfExperience", "0")).split()[0])
            except (TypeError, ValueError, IndexError):
                return 0
        if experience == "0-2":
            out = [row for row in out if years(row) <= 2]
        elif experience == "3-5":
            out = [row for row in out if 3 <= years(row) <= 5]
        elif experience == "6+":
            out = [row for row in out if years(row) >= 6]
    return out


@router.get("/{pool_id}")
def talent_pool_detail(
    pool_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    company_id = _company_id(hr_user)
    row = db.query(models.TalentPool).filter(
        models.TalentPool.id == pool_id,
        models.TalentPool.company_id == company_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Talent pool candidate not found")
    return _out(row, db)


@router.patch("/{pool_id}")
def update_talent_pool(
    pool_id: int,
    body: TalentPoolUpdate,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    company_id = _company_id(hr_user)
    row = db.query(models.TalentPool).filter(
        models.TalentPool.id == pool_id,
        models.TalentPool.company_id == company_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Talent pool candidate not found")
    if body.status is not None:
        row.status = _status(body.status)
    if body.notes is not None:
        row.notes = body.notes
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _out(row, db)


@router.delete("/{pool_id}")
def delete_talent_pool(
    pool_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    company_id = _company_id(hr_user)
    row = db.query(models.TalentPool).filter(
        models.TalentPool.id == pool_id,
        models.TalentPool.company_id == company_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Talent pool candidate not found")
    db.delete(row)
    db.commit()
    return {"message": "Removed from talent pool"}
