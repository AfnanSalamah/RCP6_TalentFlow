from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_hr_user, tenant_filter
from schemas import ProjectCreate, HiringRoleCreate, HRUserCreate
import models

router = APIRouter(prefix="/hr", tags=["HR Resources"])


def _project_job_payload(project: models.Project, hr_user_id: int):
    """Publish every active HR project as an applicant-facing job.
    This makes the HR Projects screen behave like a simple job-posting screen too,
    so a project created by HR immediately appears in Browse Jobs.
    """
    location = project.location or "Riyadh"
    status = "active" if str(project.status).lower() in ["active", "open", "published"] else "closed"
    deadline = ""
    if project.timeline and "to" in project.timeline:
        deadline = project.timeline.split("to")[-1].strip()
    return dict(
        title=project.name,
        company=project.client or "TalentFlow",
        company_size="",
        industry=project.department or "Hiring",
        department=project.department or "Hiring",
        description=project.description or f"Hiring project: {project.name}",
        location=location,
        remote="Remote" if location.lower() == "remote" else ("Hybrid" if "hybrid" in location.lower() else "Onsite"),
        job_type="Full-time",
        experience_required="Open",
        skills_required=[],
        languages_required=[],
        compensation_range="Negotiable",
        deadline=deadline,
        status=status,
        responsibilities=["Work on the assigned project responsibilities", "Collaborate with the HR and project team"],
        qualifications=[],
        benefits=["Professional development", "Competitive package"],
        posted_by=hr_user_id,
        is_featured=False,
    )


def _project_out(p: models.Project, db: Session) -> dict:
    roles = db.query(models.HiringRole).filter(models.HiringRole.project_id == p.id).all()
    job_ids = [r.published_job_id for r in roles]
    apps = _applications_for_jobs(db, job_ids)
    candidates_count = len(apps)
    hired_count = sum(1 for a in apps if _enum_value(a.pipeline_stage) == "Hired" or _enum_value(a.status) == "Hired")
    return {
        "id": p.id,
        "name": p.name,
        "client": p.client,
        "department": p.department,
        "description": p.description,
        "location": p.location,
        "timeline": p.timeline,
        "priority": p.priority,
        "status": p.status,
        "progress": p.progress,
        "roles": len(roles),
        "totalRoles": len(roles),
        "openRoles": sum(1 for r in roles if str(r.status).lower() in ["open", "active", "published"]),
        "candidates": candidates_count,
        "hired": hired_count,
        "publishedJobId": p.published_job_id,
        "createdBy": _creator_name(db, p.created_by),
        "createdAt": p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
    }


@router.get("/companies")
def list_hr_companies(hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    q = db.query(models.Company).filter(models.Company.is_active == True)  # noqa: E712
    if hr_user.company_id:
        q = q.filter(models.Company.id == hr_user.company_id)
    companies = q.order_by(models.Company.company_name.asc()).all()
    return {
        "companies": [
            {
                "id": c.id,
                "company_name": c.company_name,
                "name": c.company_name,
                "contact_email": c.contact_email,
            }
            for c in companies
        ]
    }


@router.get("/projects")
def list_projects(hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    projects = tenant_filter(db.query(models.Project), models.Project, hr_user).order_by(
        models.Project.created_at.desc()
    ).all()
    return {"projects": [_project_out(p, db) for p in projects], "total": len(projects)}


@router.post("/projects", status_code=201)
def create_project(body: ProjectCreate, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    data = body.model_dump()
    role_requirements = data.pop("hiring_requirements", []) or []
    p = models.Project(**data, created_by=hr_user.id, company_id=hr_user.company_id)
    db.add(p)
    db.flush()
    for req in role_requirements:
        title = (req.get("title") or req.get("role_title") or "").strip()
        if not title:
            continue
        role = models.HiringRole(
            company_id=hr_user.company_id,
            project_id=p.id,
            title=title,
            open_positions=int(req.get("openings") or req.get("open_positions") or 1),
            required_skills=req.get("required_skills") or [],
            preferred_skills=req.get("preferred_skills") or [],
            languages=req.get("languages") or [],
            location=p.location or "Remote",
            contract_type=req.get("contract_type") or "Full-time",
            compensation_range=req.get("compensation") or req.get("compensation_range") or "Negotiable",
            created_by=hr_user.id,
        )
        db.add(role)
        db.flush()
        role_job = models.Job(**_role_job_payload(role, db, hr_user.id), company_id=hr_user.company_id)
        db.add(role_job)
        db.flush()
        role.published_job_id = role_job.id
    db.commit()
    db.refresh(p)
    return _project_out(p, db)


@router.put("/projects/{project_id}")
def update_project(project_id: int, body: ProjectCreate, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    p = tenant_filter(db.query(models.Project), models.Project, hr_user).filter(
        models.Project.id == project_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    data = body.model_dump()
    data.pop("hiring_requirements", None)
    for k, v in data.items():
        setattr(p, k, v)
    if p.published_job_id:
        job = db.query(models.Job).filter(models.Job.id == p.published_job_id).first()
        if job:
            job.status = "closed"
        p.published_job_id = None
    db.commit()
    db.refresh(p)
    return _project_out(p, db)


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    p = tenant_filter(db.query(models.Project), models.Project, hr_user).filter(
        models.Project.id == project_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if p.published_job_id:
        job = db.query(models.Job).filter(models.Job.id == p.published_job_id).first()
        if job:
            job.status = "closed"
    db.delete(p)
    db.commit()
    return {"message": "Project deleted and published job closed"}


def _candidates_for_jobs(db: Session, job_ids: list) -> list:
    """Real candidates (applications) attached to a set of published jobs."""
    job_ids = [j for j in job_ids if j]
    if not job_ids:
        return []
    apps = _applications_for_jobs(db, job_ids)
    out = []
    for a in apps:
        ap = a.applicant
        out.append({
            "id": a.id,
            "applicantId": a.applicant_id,
            "name": ap.name if ap else "",
            "email": ap.email if ap else "",
            "location": ap.location if ap else "",
            "skills": ap.skills if ap else [],
            "experience": f"{ap.years_of_experience} years" if ap else "",
            "stage": a.pipeline_stage.value if hasattr(a.pipeline_stage, "value") else str(a.pipeline_stage),
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "rating": None,
            "interviewStatus": _latest_interview_status(db, a),
            "appliedDate": a.applied_at.strftime("%Y-%m-%d") if a.applied_at else "",
        })
    return out


@router.get("/projects/{project_id}")
def get_project(project_id: int, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    p = tenant_filter(db.query(models.Project), models.Project, hr_user).filter(
        models.Project.id == project_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    roles = db.query(models.HiringRole).filter(models.HiringRole.project_id == p.id).all()
    job_ids = [r.published_job_id for r in roles]
    out = _project_out(p, db)
    out["rolesList"] = [_role_out(r, db) for r in roles]
    out["candidatesList"] = _candidates_for_jobs(db, job_ids)
    return out


def _role_out(r: models.HiringRole, db: Session) -> dict:
    apps = _role_applications(db, r)
    candidates = len(apps)
    project = db.query(models.Project).filter(models.Project.id == r.project_id).first() if r.project_id else None
    return {
        "id": r.id,
        "projectId": r.project_id,
        "projectName": project.name if project else "",
        "publishedJobId": r.published_job_id,
        "title": r.title,
        "openPositions": r.open_positions,
        "requiredSkills": r.required_skills or [],
        "preferredSkills": r.preferred_skills or [],
        "languages": r.languages or [],
        "location": r.location,
        "travelRequirement": r.travel_requirement,
        "availability": r.availability,
        "contractType": r.contract_type,
        "compensationRange": r.compensation_range,
        "deadline": r.deadline,
        "status": r.status,
        "candidates": candidates,
        "applicants": candidates,
        "shortlisted": sum(1 for a in apps if _enum_value(a.pipeline_stage) in ["Shortlisted", "Interview Scheduled", "Interviewed", "Recommended", "Offer Drafted", "Contract Sent", "Hired"]),
        "interviewed": sum(1 for a in apps if _enum_value(a.pipeline_stage) in ["Interviewed", "Recommended", "Offer Drafted", "Contract Sent", "Hired"]),
        "recommended": sum(1 for a in apps if _enum_value(a.pipeline_stage) == "Recommended"),
        "hired": sum(1 for a in apps if _enum_value(a.pipeline_stage) == "Hired" or _enum_value(a.status) == "Hired"),
        "createdAt": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
    }


def _role_job_payload(role: models.HiringRole, db: Session, hr_user_id: int):
    project = db.query(models.Project).filter(models.Project.id == role.project_id).first() if role.project_id else None
    company = (project.client or project.name) if project else "TalentFlow"
    location = role.location or (project.location if project else "Remote") or "Remote"
    return dict(
        title=role.title,
        company=company,
        company_size="",
        industry=project.department if project else "Hiring",
        department=project.department if project else "Hiring",
        description=(project.description if project else "") or f"Open role published by HR: {role.title}",
        location=location,
        remote="Remote" if location.lower() == "remote" else ("Hybrid" if "hybrid" in location.lower() else "Onsite"),
        job_type=role.contract_type or "Full-time",
        experience_required=role.availability or "Open",
        skills_required=role.required_skills or [],
        languages_required=role.languages or [],
        compensation_range=role.compensation_range or "Negotiable",
        deadline=role.deadline or "",
        status="active" if role.status.lower() in ["open", "active", "published"] else "closed",
        responsibilities=[f"Perform duties for {role.title}", "Collaborate with the team and stakeholders"],
        qualifications=role.required_skills or [],
        benefits=["Competitive package", "Professional development"],
        posted_by=hr_user_id,
        is_featured=False,
    )


@router.get("/roles")
def list_roles(hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    roles = tenant_filter(db.query(models.HiringRole), models.HiringRole, hr_user).order_by(
        models.HiringRole.created_at.desc()
    ).all()
    return {"roles": [_role_out(r, db) for r in roles], "total": len(roles)}


@router.post("/roles", status_code=201)
def create_role(body: HiringRoleCreate, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    role = models.HiringRole(**body.model_dump(), created_by=hr_user.id, company_id=hr_user.company_id)
    db.add(role)
    db.flush()
    job = models.Job(**_role_job_payload(role, db, hr_user.id), company_id=hr_user.company_id)
    db.add(job)
    db.flush()
    role.published_job_id = job.id
    db.commit()
    db.refresh(role)
    return _role_out(role, db)


@router.put("/roles/{role_id}")
def update_role(role_id: int, body: HiringRoleCreate, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    role = tenant_filter(db.query(models.HiringRole), models.HiringRole, hr_user).filter(
        models.HiringRole.id == role_id
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    for k, v in body.model_dump().items():
        setattr(role, k, v)
    job = db.query(models.Job).filter(models.Job.id == role.published_job_id).first() if role.published_job_id else None
    if not job:
        job = models.Job(**_role_job_payload(role, db, hr_user.id), company_id=hr_user.company_id)
        db.add(job)
        db.flush()
        role.published_job_id = job.id
    else:
        for k, v in _role_job_payload(role, db, hr_user.id).items():
            setattr(job, k, v)
    db.commit()
    db.refresh(role)
    return _role_out(role, db)


@router.delete("/roles/{role_id}")
def delete_role(role_id: int, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    role = tenant_filter(db.query(models.HiringRole), models.HiringRole, hr_user).filter(
        models.HiringRole.id == role_id
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.published_job_id:
        job = db.query(models.Job).filter(models.Job.id == role.published_job_id).first()
        if job:
            job.status = "closed"
    db.delete(role)
    db.commit()
    return {"message": "Role deleted and published job closed"}


@router.get("/roles/{role_id}")
def get_role(role_id: int, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    r = tenant_filter(db.query(models.HiringRole), models.HiringRole, hr_user).filter(
        models.HiringRole.id == role_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Role not found")
    out = _role_out(r, db)
    out["candidatesList"] = _candidates_for_jobs(db, [r.published_job_id])
    return out


def _enum_value(value):
    return value.value if hasattr(value, "value") else str(value or "")


def _applications_for_jobs(db: Session, job_ids: list) -> list:
    job_ids = [j for j in job_ids if j]
    if not job_ids:
        return []
    return db.query(models.Application).filter(models.Application.job_id.in_(job_ids)).all()


def _role_applications(db: Session, role: models.HiringRole) -> list:
    q = db.query(models.Application)
    clauses = []
    if role.published_job_id:
        clauses.append(models.Application.job_id == role.published_job_id)
    clauses.append(models.Application.job_role_id == role.id)
    from sqlalchemy import or_
    return q.filter(or_(*clauses)).all()


def _creator_name(db: Session, user_id):
    if not user_id:
        return ""
    user = db.query(models.HRUser).filter(models.HRUser.id == user_id).first()
    return user.name if user else ""


def _latest_interview_status(db: Session, app: models.Application) -> str:
    iv = db.query(models.Interview).filter(
        models.Interview.application_id == app.id
    ).order_by(models.Interview.created_at.desc()).first()
    return iv.status if iv else ""


@router.get("/employees")
def list_employees(hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    users = tenant_filter(db.query(models.HRUser), models.HRUser, hr_user).order_by(
        models.HRUser.created_at.desc()
    ).all()
    from routers.hr_users import _user_out
    return {"employees": [_user_out(u) for u in users], "total": len(users)}


@router.post("/employees", status_code=201)
def create_employee(body: HRUserCreate, hr_user: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    from routers.hr_users import create_hr_user
    return create_hr_user(body, hr_user, db)
