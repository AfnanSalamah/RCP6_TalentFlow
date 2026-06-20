import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_applicant
from schemas import (
    ApplicantOut, ApplicantProfileUpdate, ApplicantSettingsUpdate,
    ExperienceBase, ExperienceOut, EducationBase, EducationOut,
    CertificationBase, CertificationOut
)
import models

router = APIRouter(prefix="/applicant", tags=["Applicant Profile"])
log = logging.getLogger("talentflow.profile")


class CVImportRequest(BaseModel):
    education: list = []
    experience: list = []
    skills: list = []
    languages: list = []
    certifications: list = []
    projects: list = []
    name: str | None = None
    phone: str | None = None
    location: str | None = None
    headline: str | None = None
    bio: str | None = None
    linkedin: str | None = None
    portfolio: str | None = None
    years_of_experience: str | int | None = None


def _calc_completion(applicant: models.Applicant) -> int:
    score = 0
    if applicant.name:          score += 5
    if applicant.headline:      score += 10
    if applicant.bio:           score += 5
    if applicant.phone:         score += 10
    if applicant.location:      score += 5
    if applicant.linkedin:      score += 5
    if applicant.skills:        score += 15
    if applicant.languages:     score += 5
    if applicant.availability:  score += 5
    if applicant.experiences:   score += 15
    if applicant.education:     score += 10
    if applicant.resumes:       score += 10
    if applicant.certifications: score += 5
    if applicant.profile_projects: score += 5
    return min(max(score, 0), 100)


def _clean(value) -> str:
    return str(value or "").strip()


def _list(value) -> list:
    if not value:
        return []
    if isinstance(value, list):
        return [x for x in value if _clean(x)]
    return [x.strip() for x in str(value).split(",") if x.strip()]


_EDU_KEYWORDS = [
    "bachelor", "master", "phd", "doctorate", "diploma", "degree", "university",
    "college", "faculty", "school", "gpa", "graduation", "education",
    "بكالوريوس", "ماجستير", "دكتوراه", "دبلوم", "جامعة", "كلية", "تعليم", "تخرج",
]


def _looks_like_education(*values) -> bool:
    text = " ".join(_clean(v).lower() for v in values if v)
    return any(keyword in text for keyword in _EDU_KEYWORDS)


def apply_cv_profile_data(db: Session, applicant: models.Applicant, profile: dict) -> dict:
    """Persist parsed CV data into the applicant profile with duplicate guards."""
    p = profile or {}
    counts = {"education": 0, "experience": 0, "skills": 0, "languages": 0, "certifications": 0, "projects": 0}
    log.info("[PROFILE_IMPORT] Applicant %s parsed data received: %s", applicant.id, sorted(p.keys()))

    for field in ["name", "phone", "location", "headline", "bio", "linkedin", "portfolio"]:
        value = _clean(p.get(field))
        if value and not _clean(getattr(applicant, field, "")):
            setattr(applicant, field, value)
    if p.get("years_of_experience") and not _clean(applicant.years_of_experience):
        applicant.years_of_experience = _clean(p.get("years_of_experience"))

    existing_skills = {str(s).lower() for s in (applicant.skills or [])}
    new_skills = [_clean(s) for s in _list(p.get("skills")) if _clean(s).lower() not in existing_skills]
    if new_skills:
        applicant.skills = (applicant.skills or []) + new_skills
        counts["skills"] = len(new_skills)

    existing_langs = {str(l).lower() for l in (applicant.languages or [])}
    new_langs = [_clean(l) for l in _list(p.get("languages")) if _clean(l).lower() not in existing_langs]
    if new_langs:
        applicant.languages = (applicant.languages or []) + new_langs
        counts["languages"] = len(new_langs)

    existing_edu = {(_clean(e.degree).lower(), _clean(e.university).lower()) for e in applicant.education}
    for edu in p.get("education") or []:
        degree = _clean(edu.get("degree") or edu.get("qualification") or edu.get("title"))
        university = _clean(edu.get("university") or edu.get("institution") or edu.get("school"))
        if not degree and not university:
            continue
        key = (degree.lower(), university.lower())
        if key not in existing_edu:
            db.add(models.Education(
                applicant_id=applicant.id,
                degree=degree or "Education",
                university=university or "Institution",
                graduation_year=_clean(edu.get("graduation_year") or edu.get("year")),
                gpa=_clean(edu.get("gpa")),
            ))
            existing_edu.add(key)
            counts["education"] += 1

    existing_exp = {(_clean(e.title).lower(), _clean(e.company).lower()) for e in applicant.experiences}
    for exp in p.get("experience") or []:
        title = _clean(exp.get("title") or exp.get("role") or exp.get("position"))
        company = _clean(exp.get("company") or exp.get("employer") or exp.get("organization"))
        if _looks_like_education(title, company, exp.get("description")):
            degree = title or _clean(exp.get("description")) or "Education"
            university = company if company and company.lower() != "company" else "Institution"
            key = (degree.lower(), university.lower())
            if key not in existing_edu:
                db.add(models.Education(
                    applicant_id=applicant.id,
                    degree=degree,
                    university=university,
                    graduation_year=_clean(exp.get("end_year") or exp.get("year")),
                    gpa="",
                ))
                existing_edu.add(key)
                counts["education"] += 1
            continue
        if not title and not company:
            continue
        key = (title.lower(), company.lower())
        if key not in existing_exp:
            db.add(models.Experience(
                applicant_id=applicant.id,
                title=title or "Work Experience",
                company=company or "Company",
                start_year=_clean(exp.get("start_year") or exp.get("start_date")),
                end_year=_clean(exp.get("end_year") or exp.get("end_date")) or "Present",
                description=_clean(exp.get("description") or exp.get("summary")),
            ))
            existing_exp.add(key)
            counts["experience"] += 1

    existing_certs = {_clean(c.name).lower() for c in applicant.certifications}
    for cert in p.get("certifications") or []:
        name = _clean(cert.get("name") if isinstance(cert, dict) else cert)
        if name and name.lower() not in existing_certs:
            db.add(models.Certification(
                applicant_id=applicant.id,
                name=name,
                issuer=_clean(cert.get("issuer")) if isinstance(cert, dict) else "",
                year=_clean(cert.get("year")) if isinstance(cert, dict) else "",
            ))
            existing_certs.add(name.lower())
            counts["certifications"] += 1

    existing_projects = {_clean(pr.name).lower() for pr in applicant.profile_projects}
    for project in p.get("projects") or []:
        name = _clean(project.get("name") if isinstance(project, dict) else project)
        if name and name.lower() not in existing_projects:
            db.add(models.ApplicantProject(
                applicant_id=applicant.id,
                name=name,
                description=_clean(project.get("description")) if isinstance(project, dict) else "",
                technologies=_list(project.get("technologies")) if isinstance(project, dict) else [],
                link=_clean(project.get("link")) if isinstance(project, dict) else "",
            ))
            existing_projects.add(name.lower())
            counts["projects"] += 1

    db.flush()
    applicant.profile_completion = _calc_completion(applicant)
    log.info("[PROFILE_IMPORT] Applicant %s records inserted: %s", applicant.id, counts)
    return counts


def normalize_profile_sections(db: Session, applicant: models.Applicant) -> bool:
    changed = False
    existing_edu = {(_clean(e.degree).lower(), _clean(e.university).lower()) for e in applicant.education}
    for exp in list(applicant.experiences):
        if not _looks_like_education(exp.title, exp.company, exp.description):
            continue
        degree = _clean(exp.title) or _clean(exp.description) or "Education"
        university = _clean(exp.company)
        if university.lower() == "company" or not university:
            university = "Institution"
        key = (degree.lower(), university.lower())
        if key not in existing_edu:
            db.add(models.Education(
                applicant_id=applicant.id,
                degree=degree,
                university=university,
                graduation_year=_clean(exp.end_year),
                gpa="",
            ))
            existing_edu.add(key)
        db.delete(exp)
        changed = True
    return changed


@router.get("/profile", response_model=ApplicantOut)
def get_profile(current: models.Applicant = Depends(get_current_applicant), db: Session = Depends(get_db)):
    normalize_profile_sections(db, current)
    current.profile_completion = _calc_completion(current)
    db.commit()
    db.refresh(current)
    return current


@router.put("/profile", response_model=ApplicantOut)
def update_profile(
    body: ApplicantProfileUpdate,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    data = body.model_dump(exclude_none=True)
    for field, value in data.items():
        setattr(current, field, value)
    current.profile_completion = _calc_completion(current)
    db.commit()
    db.refresh(current)
    return current


@router.post("/profile/import-cv")
def import_cv_to_profile(
    body: CVImportRequest,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    try:
        counts = apply_cv_profile_data(db, current, body.model_dump(exclude_none=True))
        db.commit()
        db.refresh(current)
    except Exception as exc:
        db.rollback()
        log.exception("[PROFILE_IMPORT] Failed for applicant %s: %s", current.id, exc)
        raise HTTPException(status_code=500, detail="Could not save resume information to profile")
    return {
        "message": "Resume information successfully added to your profile.",
        "inserted": counts,
        "profile_completion": current.profile_completion,
    }


@router.get("/settings")
def get_settings(current: models.Applicant = Depends(get_current_applicant), db: Session = Depends(get_db)):
    s = current.settings
    if not s:
        s = models.ApplicantSettings(applicant_id=current.id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return {
        "emailNotifications": s.email_notifications,
        "jobAlerts": s.job_alerts,
        "applicationUpdates": s.application_updates,
        "interviewReminders": s.interview_reminders,
        "weeklyDigest": s.weekly_digest,
        "profileVisibility": s.profile_visibility,
        "openToWork": s.open_to_work,
        "language": s.language,
    }


@router.put("/settings")
def update_settings(
    body: ApplicantSettingsUpdate,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    s = current.settings
    if not s:
        s = models.ApplicantSettings(applicant_id=current.id)
        db.add(s)
        db.flush()

    data = body.model_dump(exclude_none=True)
    mapping = {
        "emailNotifications": "email_notifications",
        "jobAlerts": "job_alerts",
        "applicationUpdates": "application_updates",
        "interviewReminders": "interview_reminders",
        "weeklyDigest": "weekly_digest",
        "profileVisibility": "profile_visibility",
        "openToWork": "open_to_work",
        "language": "language",
    }
    for camel, snake in mapping.items():
        if camel in data:
            setattr(s, snake, data[camel])
        elif snake in data:
            setattr(s, snake, data[snake])
    db.commit()
    return {"message": "Settings updated"}


# ─── Experience CRUD ──────────────────────────────────────────────────────────

@router.post("/experience", response_model=ExperienceOut)
def add_experience(
    body: ExperienceBase,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    exp = models.Experience(applicant_id=current.id, **body.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.put("/experience/{exp_id}", response_model=ExperienceOut)
def update_experience(
    exp_id: int,
    body: ExperienceBase,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    exp = db.query(models.Experience).filter(
        models.Experience.id == exp_id,
        models.Experience.applicant_id == current.id,
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    for field, value in body.model_dump().items():
        setattr(exp, field, value)
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/experience/{exp_id}")
def delete_experience(
    exp_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    exp = db.query(models.Experience).filter(
        models.Experience.id == exp_id,
        models.Experience.applicant_id == current.id,
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    db.delete(exp)
    db.commit()
    return {"message": "Deleted"}


# ─── Education CRUD ───────────────────────────────────────────────────────────

@router.post("/education", response_model=EducationOut)
def add_education(
    body: EducationBase,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    edu = models.Education(applicant_id=current.id, **body.model_dump())
    db.add(edu)
    db.commit()
    db.refresh(edu)
    return edu


@router.put("/education/{edu_id}", response_model=EducationOut)
def update_education(
    edu_id: int,
    body: EducationBase,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    edu = db.query(models.Education).filter(
        models.Education.id == edu_id,
        models.Education.applicant_id == current.id,
    ).first()
    if not edu:
        raise HTTPException(status_code=404, detail="Education not found")
    for field, value in body.model_dump().items():
        setattr(edu, field, value)
    db.commit()
    db.refresh(edu)
    return edu


@router.delete("/education/{edu_id}")
def delete_education(
    edu_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    edu = db.query(models.Education).filter(
        models.Education.id == edu_id,
        models.Education.applicant_id == current.id,
    ).first()
    if not edu:
        raise HTTPException(status_code=404, detail="Education not found")
    db.delete(edu)
    db.commit()
    return {"message": "Deleted"}


# ─── Certification CRUD ───────────────────────────────────────────────────────

@router.post("/certification", response_model=CertificationOut)
def add_certification(
    body: CertificationBase,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    cert = models.Certification(applicant_id=current.id, **body.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete("/certification/{cert_id}")
def delete_certification(
    cert_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    cert = db.query(models.Certification).filter(
        models.Certification.id == cert_id,
        models.Certification.applicant_id == current.id,
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(cert)
    db.commit()
    return {"message": "Deleted"}
