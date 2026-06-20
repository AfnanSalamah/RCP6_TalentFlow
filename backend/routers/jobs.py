from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from auth import get_current_applicant, get_current_hr_user, tenant_filter
from schemas import JobOut, JobCreate
import models

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _enforce_job_limit(hr_user: models.HRUser, db: Session):
    """Block job creation once the company hits its plan's active-job cap."""
    if hr_user.company_id is None:
        return  # platform-level user, no tenant cap
    company = db.query(models.Company).filter(models.Company.id == hr_user.company_id).first()
    if not company:
        return
    active = db.query(models.Job).filter(
        models.Job.company_id == hr_user.company_id,
        models.Job.status == "active",
    ).count()
    if company.max_jobs and active >= company.max_jobs:
        raise HTTPException(
            status_code=403,
            detail=f"Active job limit reached for your {company.subscription_plan} plan "
                   f"({company.max_jobs}). Upgrade to post more jobs.",
        )


@router.get("")
def list_jobs(
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    remote: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(models.Job).filter(models.Job.status == "active")
    project_job_ids = [
        row[0] for row in db.query(models.Project.published_job_id)
        .filter(models.Project.published_job_id.isnot(None))
        .all()
    ]
    if project_job_ids:
        q = q.filter(~models.Job.id.in_(project_job_ids))

    if search:
        term = f"%{search}%"
        q = q.filter(
            models.Job.title.ilike(term) |
            models.Job.company.ilike(term) |
            models.Job.description.ilike(term)
        )
    if location:
        q = q.filter(models.Job.location.ilike(f"%{location}%"))
    if job_type:
        q = q.filter(models.Job.job_type == job_type)
    if remote:
        q = q.filter(models.Job.remote == remote)
    if industry:
        q = q.filter(models.Job.industry.ilike(f"%{industry}%"))

    total = q.count()
    jobs = q.order_by(models.Job.is_featured.desc(), models.Job.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "jobs": [_job_out(j, db) for j in jobs],
    }


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    is_project_job = db.query(models.Project.id).filter(models.Project.published_job_id == job_id).first()
    if not job or is_project_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_out(job, db)


@router.post("", status_code=201)
def create_job(
    body: JobCreate,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    _enforce_job_limit(hr_user, db)
    job = models.Job(**body.model_dump(), posted_by=hr_user.id, company_id=hr_user.company_id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_out(job, db)


@router.put("/{job_id}")
def update_job(
    job_id: int,
    body: JobCreate,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    job = tenant_filter(db.query(models.Job), models.Job, hr_user).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in body.model_dump().items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return _job_out(job, db)


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    job = tenant_filter(db.query(models.Job), models.Job, hr_user).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "closed"
    db.commit()
    return {"message": "Job closed"}


def _job_out(job: models.Job, db: Session) -> dict:
    count = db.query(models.Application).filter(models.Application.job_id == job.id).count()
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "companySize": job.company_size,
        "industry": job.industry,
        "department": job.department,
        "description": job.description,
        "location": job.location,
        "remote": job.remote,
        "type": job.job_type,
        "experienceRequired": job.experience_required,
        "skills": job.skills_required or [],
        "languages": job.languages_required or [],
        "compensationRange": job.compensation_range,
        "deadline": job.deadline,
        "status": job.status,
        "responsibilities": job.responsibilities or [],
        "qualifications": job.qualifications or [],
        "benefits": job.benefits or [],
        "featured": job.is_featured,
        "applicants": count,
        "postedDate": job.created_at.strftime("%Y-%m-%d") if job.created_at else "",
    }
