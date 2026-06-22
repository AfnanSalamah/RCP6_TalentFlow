from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from auth import get_current_applicant, get_current_hr_user, tenant_filter
import models

router = APIRouter(tags=["Dashboard"])


@router.get("/applicant/dashboard")
def applicant_dashboard(
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    apps = db.query(models.Application).filter(models.Application.applicant_id == current.id).all()
    interviews = db.query(models.Interview).filter(
        models.Interview.applicant_id == current.id,
        models.Interview.status == "Scheduled",
    ).order_by(models.Interview.date.asc()).limit(3).all()
    unread_notifs = db.query(models.Notification).filter(
        models.Notification.applicant_id == current.id,
        models.Notification.read == False,
    ).count()
    primary_resume = db.query(models.Resume).filter(
        models.Resume.applicant_id == current.id,
        models.Resume.is_primary == True,
    ).first()

    status_counts = {}
    for app in apps:
        s = app.status.value if hasattr(app.status, 'value') else str(app.status)
        status_counts[s] = status_counts.get(s, 0) + 1

    return {
        "profileCompletion": current.profile_completion,
        "totalApplications": len(apps),
        "activeApplications": status_counts.get("Applied", 0) + status_counts.get("Under Review", 0) + status_counts.get("Shortlisted", 0),
        "interviewsScheduled": status_counts.get("Interview Scheduled", 0),
        "offersReceived": status_counts.get("Offer Sent", 0),
        "unreadNotifications": unread_notifs,
        "hasResume": primary_resume is not None,
        "resumeScore": primary_resume.ai_score if primary_resume else None,
        "applicationsByStatus": status_counts,
        "upcomingInterviews": [
            {
                "id": i.id,
                "jobTitle": db.query(models.Job).filter(models.Job.id == i.job_id).first().title if i.job_id else "",
                "date": i.date,
                "time": i.time,
                "type": i.interview_type,
                "location": i.location,
            }
            for i in interviews
        ],
    }


PIPELINE_STAGES = [
    "New", "Resume Reviewed", "Shortlisted", "Interview Scheduled", "Interviewed",
    "Recommended", "Offer Drafted", "Contract Sent", "Hired", "Rejected", "Talent Pool",
]
STATUS_COLORS = {
    "New": "#7BBDE8", "Resume Reviewed": "#6EA2B3", "Shortlisted": "#4E8EA2",
    "Interview Scheduled": "#49769F", "Interviewed": "#3d6b8a", "Recommended": "#2d5a7d",
    "Offer Drafted": "#1d4a6e", "Contract Sent": "#0f3b5f", "Hired": "#0A4174",
    "Rejected": "#ef4444", "Talent Pool": "#6EA2B3",
}


def _stage_value(v):
    return v.value if hasattr(v, "value") else str(v)


def _pipeline_counts(db, hr_user):
    """Live count of applications per pipeline stage for this tenant."""
    counts = {s: 0 for s in PIPELINE_STAGES}
    apps = tenant_filter(db.query(models.Application), models.Application, hr_user).all()
    for a in apps:
        stage = _stage_value(a.pipeline_stage)
        if stage in counts:
            counts[stage] += 1
    return counts, apps


def _monthly_series(db, hr_user):
    """Last 6 months of new candidates / interviews / hires, from real timestamps."""
    now = datetime.utcnow()
    apps = tenant_filter(db.query(models.Application), models.Application, hr_user).all()
    interviews = tenant_filter(db.query(models.Interview), models.Interview, hr_user).all()
    series = []
    for i in range(5, -1, -1):
        # month window
        m = (now.replace(day=1) - timedelta(days=30 * i))
        label = m.strftime("%b")
        y, mo = m.year, m.month
        cand = sum(1 for a in apps if a.applied_at and a.applied_at.year == y and a.applied_at.month == mo)
        hired = sum(1 for a in apps if _stage_value(a.status) == "Hired"
                    and a.updated_at and a.updated_at.year == y and a.updated_at.month == mo)
        ivs = sum(1 for iv in interviews if iv.created_at and iv.created_at.year == y and iv.created_at.month == mo)
        series.append({"month": label, "candidates": cand, "hired": hired, "interviews": ivs})
    return series


@router.get("/hr/dashboard")
def hr_dashboard(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    active_jobs = tenant_filter(db.query(models.Job), models.Job, hr_user).filter(
        models.Job.status == "active"
    ).count()
    total_applications = tenant_filter(db.query(models.Application), models.Application, hr_user).count()
    total_candidates = tenant_filter(
        db.query(models.Application.applicant_id), models.Application, hr_user
    ).distinct().count()
    interviews_scheduled = tenant_filter(db.query(models.Interview), models.Interview, hr_user).filter(
        models.Interview.status == "Scheduled"
    ).count()

    active_projects = tenant_filter(db.query(models.Project), models.Project, hr_user).filter(
        models.Project.status.in_(["Active", "Open"])
    ).count()
    open_roles = tenant_filter(db.query(models.HiringRole), models.HiringRole, hr_user).filter(
        models.HiringRole.status == "Open"
    ).count()

    counts, apps = _pipeline_counts(db, hr_user)
    hired = counts["Hired"]
    shortlisted = counts["Shortlisted"]
    talent_pool = counts["Talent Pool"]

    # Recent candidates (latest 6 applications) + upcoming interviews
    recent_apps = sorted(apps, key=lambda a: a.applied_at or datetime.min, reverse=True)[:6]
    recent_candidates = []
    for a in recent_apps:
        ap = a.applicant
        recent_candidates.append({
            "id": a.id,
            "name": ap.name if ap else "",
            "email": ap.email if ap else "",
            "stage": _stage_value(a.pipeline_stage),
            "status": _stage_value(a.status),
            "appliedDate": a.applied_at.strftime("%Y-%m-%d") if a.applied_at else "",
        })
    upcoming = tenant_filter(db.query(models.Interview), models.Interview, hr_user).filter(
        models.Interview.status == "Scheduled"
    ).order_by(models.Interview.date.asc()).limit(5).all()
    upcoming_interviews = []
    for iv in upcoming:
        job = db.query(models.Job).filter(models.Job.id == iv.job_id).first()
        ap = db.query(models.Applicant).filter(models.Applicant.id == iv.applicant_id).first()
        upcoming_interviews.append({
            "id": iv.id, "candidateName": ap.name if ap else "",
            "roleTitle": job.title if job else "", "date": iv.date, "time": iv.time,
            "type": iv.interview_type,
        })

    return {
        # flat KPIs (back-compat)
        "activeJobs": active_jobs,
        "totalApplications": total_applications,
        "totalCandidates": total_candidates,
        "interviewsScheduled": interviews_scheduled,
        "totalHired": hired,
        # rich payload for the HR Dashboard page
        "kpis": {
            "activeProjects": active_projects,
            "openRoles": open_roles,
            "totalCandidates": total_candidates,
            "shortlisted": shortlisted,
            "hired": hired,
            "talentPool": talent_pool,
            "activeJobs": active_jobs,
            "totalApplications": total_applications,
            "interviewsScheduled": interviews_scheduled,
        },
        "pipeline": [{"stage": s, "count": counts[s]} for s in PIPELINE_STAGES],
        "monthlyHiring": _monthly_series(db, hr_user),
        "recentCandidates": recent_candidates,
        "upcomingInterviews": upcoming_interviews,
    }


@router.get("/hr/analytics")
def hr_analytics(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    counts, apps = _pipeline_counts(db, hr_user)

    # Status breakdown (non-zero stages) with colours
    status_breakdown = [
        {"name": s, "value": counts[s], "color": STATUS_COLORS.get(s, "#7BBDE8")}
        for s in PIPELINE_STAGES if counts[s] > 0
    ]

    # Skill distribution across this tenant's candidates
    skill_counts = {}
    seen_applicants = set()
    for a in apps:
        ap = a.applicant
        if not ap or ap.id in seen_applicants:
            continue
        seen_applicants.add(ap.id)
        for sk in (ap.skills or []):
            skill_counts[sk] = skill_counts.get(sk, 0) + 1
    skills = sorted(
        [{"skill": k, "count": v} for k, v in skill_counts.items()],
        key=lambda x: x["count"], reverse=True,
    )[:8]

    total = len(apps)
    hired = counts["Hired"]
    return {
        "kpis": {
            "totalCandidates": len(seen_applicants),
            "totalApplications": total,
            "hired": hired,
            "talentPool": counts["Talent Pool"],
            "conversionRate": round((hired / total * 100), 1) if total else 0,
        },
        "pipeline": [{"stage": s, "count": counts[s]} for s in PIPELINE_STAGES],
        "monthlyHiring": _monthly_series(db, hr_user),
        "statusBreakdown": status_breakdown,
        "skills": skills,
    }
