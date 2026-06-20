from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text, JSON, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base
import enum


class HRRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    hr_manager = "hr_manager"
    hiring_manager = "hiring_manager"
    interviewer = "interviewer"


class ApplicationStatus(str, enum.Enum):
    applied = "Applied"
    under_review = "Under Review"
    shortlisted = "Shortlisted"
    interview_scheduled = "Interview Scheduled"
    interviewed = "Interviewed"
    offer_sent = "Offer Sent"
    rejected = "Rejected"
    hired = "Hired"


class PipelineStage(str, enum.Enum):
    new = "New"
    resume_reviewed = "Resume Reviewed"
    shortlisted = "Shortlisted"
    interview_scheduled = "Interview Scheduled"
    interviewed = "Interviewed"
    recommended = "Recommended"
    offer_drafted = "Offer Drafted"
    contract_sent = "Contract Sent"
    hired = "Hired"
    rejected = "Rejected"
    talent_pool = "Talent Pool"


# ─── HR Users ────────────────────────────────────────────────────────────────

class HRUser(Base):
    __tablename__ = "hr_users"

    id          = Column(Integer, primary_key=True, index=True)
    company_id  = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name        = Column(String, nullable=False)
    email       = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role        = Column(SAEnum(HRRole), default=HRRole.interviewer)
    title       = Column(String, default="")
    department  = Column(String, default="")
    avatar      = Column(String, default="")
    status      = Column(String, default="active")
    two_factor_enabled = Column(Boolean, default=True)
    totp_secret = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    otp_code    = Column(String, nullable=True)
    otp_expires = Column(DateTime(timezone=True), nullable=True)
    last_login  = Column(DateTime(timezone=True), nullable=True)
    profile_picture = Column(String, default="")
    created_by  = Column(Integer, nullable=True)
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    interviews_conducted = relationship("Interview", back_populates="interviewer")


# ─── Applicants ───────────────────────────────────────────────────────────────

class Applicant(Base):
    __tablename__ = "applicants"

    id                  = Column(Integer, primary_key=True, index=True)
    name                = Column(String, nullable=False)
    email               = Column(String, unique=True, index=True, nullable=False)
    password_hash       = Column(String, nullable=False)
    phone               = Column(String, default="")
    nationality         = Column(String, default="")
    location            = Column(String, default="")
    linkedin            = Column(String, default="")
    portfolio           = Column(String, default="")
    years_of_experience = Column(String, default="0")
    degree              = Column(String, default="")
    university          = Column(String, default="")
    graduation_year     = Column(String, default="")
    skills              = Column(JSON, default=list)
    languages           = Column(JSON, default=list)
    availability        = Column(String, default="")
    travel_willingness  = Column(Boolean, default=False)
    headline            = Column(String, default="")
    bio                 = Column(Text, default="")
    national_id         = Column(String, default="")
    profile_completion       = Column(Integer, default=0)
    reset_token              = Column(String, nullable=True)
    reset_token_expires      = Column(DateTime(timezone=True), nullable=True)
    is_active                = Column(Boolean, default=True)
    is_verified              = Column(Boolean, default=False)
    verification_otp         = Column(String, nullable=True)
    verification_otp_expires = Column(DateTime(timezone=True), nullable=True)
    two_factor_enabled       = Column(Boolean, default=False)
    otp_code                 = Column(String, nullable=True)
    otp_expires              = Column(DateTime(timezone=True), nullable=True)
    last_login               = Column(DateTime(timezone=True), nullable=True)
    created_at               = Column(DateTime(timezone=True), server_default=func.now())
    updated_at               = Column(DateTime(timezone=True), onupdate=func.now())

    experiences    = relationship("Experience",    back_populates="applicant", cascade="all, delete-orphan")
    education      = relationship("Education",     back_populates="applicant", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="applicant", cascade="all, delete-orphan")
    profile_projects = relationship("ApplicantProject", back_populates="applicant", cascade="all, delete-orphan")
    resumes        = relationship("Resume",        back_populates="applicant", cascade="all, delete-orphan")
    applications   = relationship("Application",   back_populates="applicant", cascade="all, delete-orphan")
    notifications  = relationship("Notification",  back_populates="applicant", cascade="all, delete-orphan")
    settings       = relationship("ApplicantSettings", back_populates="applicant", uselist=False, cascade="all, delete-orphan")

    @property
    def projects(self):
        return self.profile_projects


class Experience(Base):
    __tablename__ = "experiences"

    id           = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    title        = Column(String, nullable=False)
    company      = Column(String, nullable=False)
    start_year   = Column(String, default="")
    end_year     = Column(String, default="")
    description  = Column(Text, default="")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant", back_populates="experiences")


class Education(Base):
    __tablename__ = "education"

    id              = Column(Integer, primary_key=True, index=True)
    applicant_id    = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    degree          = Column(String, nullable=False)
    university      = Column(String, nullable=False)
    graduation_year = Column(String, default="")
    gpa             = Column(String, default="")
    gpa_scale       = Column(String, default="4.0")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant", back_populates="education")


class Certification(Base):
    __tablename__ = "certifications"

    id           = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    name         = Column(String, nullable=False)
    issuer       = Column(String, default="")
    year         = Column(String, default="")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant", back_populates="certifications")


class ApplicantProject(Base):
    __tablename__ = "applicant_projects"

    id           = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    name         = Column(String, nullable=False)
    description  = Column(Text, default="")
    technologies = Column(JSON, default=list)
    link         = Column(String, default="")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant", back_populates="profile_projects")


class Resume(Base):
    __tablename__ = "resumes"

    id               = Column(Integer, primary_key=True, index=True)
    applicant_id     = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    file_name        = Column(String, nullable=False)
    file_path        = Column(String, nullable=False)
    file_type        = Column(String, default="pdf")
    file_size_kb     = Column(Integer, default=0)
    extracted_text   = Column(Text, default="")
    ai_summary       = Column(Text, default="")
    ai_score         = Column(Float, nullable=True)
    ats_score        = Column(Float, nullable=True)
    skills_extracted = Column(JSON, default=list)
    strengths        = Column(JSON, default=list)
    weaknesses       = Column(JSON, default=list)
    improvements     = Column(JSON, default=list)
    missing_skills   = Column(JSON, default=list)
    is_primary       = Column(Boolean, default=True)
    uploaded_at      = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant", back_populates="resumes")


class ApplicantSettings(Base):
    __tablename__ = "applicant_settings"

    id                   = Column(Integer, primary_key=True)
    applicant_id         = Column(Integer, ForeignKey("applicants.id"), unique=True)
    email_notifications  = Column(Boolean, default=True)
    job_alerts           = Column(Boolean, default=True)
    application_updates  = Column(Boolean, default=True)
    interview_reminders  = Column(Boolean, default=True)
    weekly_digest        = Column(Boolean, default=False)
    profile_visibility   = Column(String, default="Recruiters only")
    open_to_work         = Column(Boolean, default=True)
    language             = Column(String, default="English")

    applicant = relationship("Applicant", back_populates="settings")




# ─── HR Projects and Hiring Roles ─────────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"

    id          = Column(Integer, primary_key=True, index=True)
    company_id  = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    name        = Column(String, nullable=False)
    client      = Column(String, default="")
    department  = Column(String, default="")
    description = Column(Text, default="")
    location    = Column(String, default="")
    timeline    = Column(String, default="")
    priority    = Column(String, default="Medium")
    status      = Column(String, default="Active")
    progress    = Column(Integer, default=0)
    created_by  = Column(Integer, ForeignKey("hr_users.id"), nullable=True)
    published_job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    roles = relationship("HiringRole", back_populates="project", cascade="all, delete-orphan")


class HiringRole(Base):
    __tablename__ = "hiring_roles"

    id                 = Column(Integer, primary_key=True, index=True)
    company_id         = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    project_id         = Column(Integer, ForeignKey("projects.id"), nullable=True)
    title              = Column(String, nullable=False)
    open_positions     = Column(Integer, default=1)
    required_skills    = Column(JSON, default=list)
    preferred_skills   = Column(JSON, default=list)
    languages          = Column(JSON, default=list)
    location           = Column(String, default="Remote")
    travel_requirement = Column(String, default="None")
    availability       = Column(String, default="Immediate")
    contract_type      = Column(String, default="Full-time")
    compensation_range = Column(String, default="Negotiable")
    deadline           = Column(String, default="")
    status             = Column(String, default="Open")
    created_by         = Column(Integer, ForeignKey("hr_users.id"), nullable=True)
    published_job_id   = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="roles")


# ─── Jobs ─────────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id                  = Column(Integer, primary_key=True, index=True)
    company_id          = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    title               = Column(String, nullable=False)
    company             = Column(String, nullable=False)
    company_size        = Column(String, default="")
    industry            = Column(String, default="")
    department          = Column(String, default="")
    description         = Column(Text, default="")
    location            = Column(String, default="")
    remote              = Column(String, default="On-site")
    job_type            = Column(String, default="Full-time")
    experience_required = Column(String, default="")
    skills_required     = Column(JSON, default=list)
    languages_required  = Column(JSON, default=list)
    compensation_range  = Column(String, default="")
    deadline            = Column(String, default="")
    status              = Column(String, default="active")
    responsibilities    = Column(JSON, default=list)
    qualifications      = Column(JSON, default=list)
    benefits            = Column(JSON, default=list)
    posted_by           = Column(Integer, ForeignKey("hr_users.id"), nullable=True)
    is_featured         = Column(Boolean, default=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


# ─── Applications ─────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id             = Column(Integer, primary_key=True, index=True)
    company_id     = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    applicant_id   = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    job_id         = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    job_role_id    = Column(Integer, ForeignKey("hiring_roles.id"), nullable=True, index=True)
    status         = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.applied)
    pipeline_stage = Column(SAEnum(PipelineStage), default=PipelineStage.new)
    cover_letter   = Column(Text, default="")
    notes          = Column(Text, default="")
    applied_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    applicant      = relationship("Applicant", back_populates="applications")
    job            = relationship("Job", back_populates="applications")
    interviews     = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    timeline       = relationship("ApplicationTimeline", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationTimeline.created_at")


class TalentPool(Base):
    __tablename__ = "talent_pool"
    __table_args__ = (UniqueConstraint("company_id", "candidate_id", name="uq_talent_pool_company_candidate"),)

    id           = Column(Integer, primary_key=True, index=True)
    company_id   = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("applicants.id"), nullable=False, index=True)
    job_id       = Column(Integer, ForeignKey("jobs.id"), nullable=True, index=True)
    status       = Column(String, default="Available", index=True)
    notes        = Column(Text, default="")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    company   = relationship("Company")
    candidate = relationship("Applicant")
    job       = relationship("Job")


class ApplicationTimeline(Base):
    __tablename__ = "application_timeline"

    id             = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    status         = Column(String, nullable=False)
    description    = Column(Text, default="")
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="timeline")


# ─── Interviews ───────────────────────────────────────────────────────────────

class Interview(Base):
    __tablename__ = "interviews"

    id             = Column(Integer, primary_key=True, index=True)
    company_id     = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    applicant_id   = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    job_id         = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    job_role_id    = Column(Integer, ForeignKey("hiring_roles.id"), nullable=True, index=True)
    interviewer_id = Column(Integer, ForeignKey("hr_users.id"), nullable=True)
    date           = Column(String, default="")
    time           = Column(String, default="")
    interview_type = Column(String, default="Video Call")
    location       = Column(String, default="")
    meeting_provider = Column(String, default="")
    meeting_url      = Column(String, default="")
    onsite_address   = Column(String, default="")
    status         = Column(String, default="Scheduled")
    rating         = Column(Float, nullable=True)
    recommendation = Column(String, default="")
    questions      = Column(JSON, default=list)
    notes          = Column(Text, default="")
    feedback       = Column(Text, default="")
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="interviews")
    interviewer = relationship("HRUser", back_populates="interviews_conducted")
    evaluations = relationship("InterviewFeedback", back_populates="interview", cascade="all, delete-orphan")
    note = relationship("InterviewNote", back_populates="interview", uselist=False, cascade="all, delete-orphan")


class InterviewNote(Base):
    __tablename__ = "interview_notes"

    id                     = Column(Integer, primary_key=True, index=True)
    interview_id           = Column(Integer, ForeignKey("interviews.id"), nullable=False, unique=True, index=True)
    interviewer_id         = Column(Integer, ForeignKey("hr_users.id"), nullable=True)
    technical_rating       = Column(Integer, default=0)
    communication_rating   = Column(Integer, default=0)
    problem_solving_rating = Column(Integer, default=0)
    domain_rating          = Column(Integer, default=0)
    strengths              = Column(Text, default="")
    concerns               = Column(Text, default="")
    notes                  = Column(Text, default="")
    recommendation         = Column(String, default="")
    created_at             = Column(DateTime(timezone=True), server_default=func.now())
    updated_at             = Column(DateTime(timezone=True), onupdate=func.now())

    interview = relationship("Interview", back_populates="note")


# ─── Interview Feedback (interviewer evaluations) ─────────────────────────────

class InterviewFeedback(Base):
    """Structured evaluation submitted by an interviewer for one interview.

    Separate from Interview.feedback (a single free-text field) so multiple
    interviewers can each score the same candidate independently.
    """
    __tablename__ = "interview_feedback"

    id              = Column(Integer, primary_key=True, index=True)
    company_id      = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    interview_id    = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    interviewer_id  = Column(Integer, ForeignKey("hr_users.id"), nullable=True)
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    culture_score   = Column(Float, nullable=True)
    overall_score   = Column(Float, nullable=True)
    recommendation  = Column(String, default="")   # Strong Hire / Hire / No Hire / Strong No Hire
    strengths       = Column(Text, default="")
    weaknesses      = Column(Text, default="")
    comments        = Column(Text, default="")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    interview = relationship("Interview", back_populates="evaluations")


# ─── Notifications ────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id           = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=True)
    company_id   = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    created_by   = Column(Integer, nullable=True)
    recipient_scope = Column(String, default="applicant")
    recipient_user_id = Column(Integer, nullable=True, index=True)
    recipient_role = Column(String, default="", index=True)
    notification_category = Column(String, default="info", index=True)
    type         = Column(String, default="info")
    title        = Column(String, nullable=False)
    message      = Column(Text, nullable=False)
    read         = Column(Boolean, default=False)
    is_read      = Column(Boolean, default=False)
    email_sent   = Column(Boolean, default=False)
    link         = Column(String, default="")
    created_at   = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now())

    applicant = relationship("Applicant", back_populates="notifications")


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id           = Column(Integer, primary_key=True, index=True)
    key          = Column(String, unique=True, index=True, nullable=False)
    audience     = Column(String, default="candidate", index=True)
    title        = Column(String, nullable=False)
    subject      = Column(String, default="")
    cta_label    = Column(String, default="")
    illustration = Column(String, default="announcement")
    tone         = Column(String, default="")
    fields       = Column(JSON, default=list)
    enabled      = Column(Boolean, default=True)
    body         = Column(Text, default="")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())


class EmailLog(Base):
    __tablename__ = "email_logs"

    id                = Column(Integer, primary_key=True, index=True)
    template_key      = Column(String, index=True, nullable=False)
    recipient         = Column(String, index=True, nullable=False)
    subject           = Column(String, default="")
    status            = Column(String, default="queued")
    provider_response = Column(Text, default="")
    created_at        = Column(DateTime(timezone=True), server_default=func.now())


class EmailSetting(Base):
    __tablename__ = "email_settings"

    id         = Column(Integer, primary_key=True, index=True)
    key        = Column(String, unique=True, index=True, nullable=False)
    value      = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class EmailVariable(Base):
    __tablename__ = "email_variables"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, unique=True, index=True, nullable=False)
    audience    = Column(String, default="global", index=True)
    description = Column(String, default="")
    sample       = Column(String, default="")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


# ─── Super Admin ──────────────────────────────────────────────────────────────

class SuperAdmin(Base):
    __tablename__ = "super_admins"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active     = Column(Boolean, default=True)
    otp_code      = Column(String, nullable=True)
    otp_expires   = Column(DateTime, nullable=True)
    phone         = Column(String, default="")
    profile_picture = Column(String, default="")
    role          = Column(String, default="SuperAdmin")
    last_login    = Column(DateTime(timezone=True), nullable=True)
    two_factor_enabled = Column(Boolean, default=True)
    two_factor_secret = Column(String, nullable=True)
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


class SuperAdminSetting(Base):
    __tablename__ = "super_admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(JSON, default=dict)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_type = Column(String, default="super_admin")
    ip_address = Column(String, default="")
    device = Column(String, default="")
    browser = Column(String, default="")
    status = Column(String, default="success")
    login_time = Column(DateTime(timezone=True), server_default=func.now())


class AccountActivity(Base):
    __tablename__ = "account_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_type = Column(String, default="super_admin")
    action = Column(String, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True, nullable=False)
    permission = Column(String, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Companies ────────────────────────────────────────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id                      = Column(Integer, primary_key=True, index=True)
    company_name            = Column(String, nullable=False)
    industry                = Column(String, default="")
    contact_person          = Column(String, default="")
    contact_email           = Column(String, default="")
    contact_phone           = Column(String, default="")
    logo_url                = Column(String, default="")
    subscription_plan       = Column(String, default="free_trial")
    subscription_status     = Column(String, default="active")   # active / expired / suspended / cancelled
    subscription_start_date = Column(DateTime(timezone=True), nullable=True)
    subscription_end_date   = Column(DateTime(timezone=True), nullable=True)
    max_users               = Column(Integer, default=5)
    max_jobs                = Column(Integer, default=10)
    max_ai_requests         = Column(Integer, default=100)
    is_active               = Column(Boolean, default=True)
    is_deleted              = Column(Boolean, default=False)
    deleted_at              = Column(DateTime(timezone=True), nullable=True)
    deleted_by              = Column(Integer, nullable=True)
    notes                   = Column(Text, default="")
    created_at              = Column(DateTime(timezone=True), server_default=func.now())
    updated_at              = Column(DateTime(timezone=True), onupdate=func.now())

    tickets       = relationship("SupportTicket", back_populates="company", cascade="all, delete-orphan")
    ai_usage_logs = relationship("AIUsageLog",    back_populates="company", cascade="all, delete-orphan")
    audit_logs    = relationship("AuditLog",      back_populates="company", cascade="all, delete-orphan")


# ─── Support Tickets ──────────────────────────────────────────────────────────

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    subject    = Column(String, nullable=False)
    message    = Column(Text, nullable=False)
    priority   = Column(String, default="Medium")   # Low / Medium / High / Urgent
    status     = Column(String, default="Open")     # Open / In Progress / Resolved / Closed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Support Center fields (candidate / employee → Super Admin) ──────────────
    requester_type   = Column(String, default="")     # "candidate" | "hr"
    requester_id     = Column(Integer, nullable=True)  # Applicant.id or HRUser.id
    requester_name   = Column(String, default="")
    requester_email  = Column(String, default="", index=True)
    category         = Column(String, default="General Support")
    unread_for_user  = Column(Boolean, default=False)  # admin replied, user hasn't seen
    unread_for_admin = Column(Boolean, default=True)   # user wrote, admin hasn't seen
    last_message_at  = Column(DateTime(timezone=True), server_default=func.now())

    company  = relationship("Company", back_populates="tickets")
    replies  = relationship("TicketReply", back_populates="ticket", cascade="all, delete-orphan")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan",
                            order_by="TicketMessage.created_at")


class TicketReply(Base):
    __tablename__ = "ticket_replies"

    id        = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    author    = Column(String, default="Super Admin")
    message   = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("SupportTicket", back_populates="replies")


class TicketMessage(Base):
    """A single message in a Support Center conversation thread."""
    __tablename__ = "ticket_messages"

    id          = Column(Integer, primary_key=True, index=True)
    ticket_id   = Column(Integer, ForeignKey("support_tickets.id"), nullable=False, index=True)
    sender_type = Column(String, default="user")   # "user" | "super_admin"
    sender_name = Column(String, default="")
    message     = Column(Text, nullable=False)
    is_read     = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    ticket      = relationship("SupportTicket", back_populates="messages")
    attachments = relationship("SupportAttachment", back_populates="message", cascade="all, delete-orphan")


class SupportAttachment(Base):
    __tablename__ = "support_attachments"

    id           = Column(Integer, primary_key=True, index=True)
    ticket_id    = Column(Integer, ForeignKey("support_tickets.id"), nullable=False, index=True)
    message_id   = Column(Integer, ForeignKey("ticket_messages.id"), nullable=True)
    file_name    = Column(String, nullable=False)
    file_path    = Column(String, nullable=False)
    file_size_kb = Column(Integer, default=0)
    uploaded_at  = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("TicketMessage", back_populates="attachments")


# ─── Announcements ────────────────────────────────────────────────────────────

class Announcement(Base):
    __tablename__ = "announcements"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    message     = Column(Text, nullable=False)
    type        = Column(String, default="info")    # info / warning / maintenance / feature
    target      = Column(String, default="all")     # all / company_id as string
    company_id  = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


# ─── AI Usage Logs ────────────────────────────────────────────────────────────

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id           = Column(Integer, primary_key=True, index=True)
    company_id   = Column(Integer, ForeignKey("companies.id"), nullable=True)
    action       = Column(String, nullable=False)   # resume_analysis / jd_generation / candidate_match / interview_summary
    tokens_used  = Column(Integer, default=0)
    model        = Column(String, default="gpt-4o-mini")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="ai_usage_logs")


# ─── Audit Logs ───────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    user       = Column(String, default="")
    action     = Column(String, nullable=False)
    module     = Column(String, default="")
    detail     = Column(Text, default="")
    ip_address = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="audit_logs")


# ─── Contracts / Offers ─────────────────────────────────────────────────────────

class Contract(Base):
    """An offer letter or employment contract sent to a candidate.

    Linked to the candidate's Applicant account (by id) when one exists so it can
    surface in the candidate portal's "My Contracts" section; candidate_email is
    always stored so the document can be emailed even before the candidate signs
    up. status drives the candidate-facing review/sign flow.
    """
    __tablename__ = "contracts"

    id              = Column(Integer, primary_key=True, index=True)
    applicant_id    = Column(Integer, ForeignKey("applicants.id"), nullable=True, index=True)
    company_id      = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    created_by      = Column(Integer, nullable=True)            # HRUser.id who sent it

    document_type   = Column(String, default="contract")        # "offer" | "contract"
    title           = Column(String, nullable=False)
    candidate_name  = Column(String, default="")
    candidate_email = Column(String, index=True, default="")
    role_title      = Column(String, default="")
    salary          = Column(String, default="")
    start_date      = Column(String, default="")
    content         = Column(Text, nullable=False)              # full document text

    # Draft / Sent / Pending Signature / Signed / Declined
    status          = Column(String, default="Pending Signature")
    sent_at         = Column(DateTime(timezone=True), nullable=True)
    signed_at       = Column(DateTime(timezone=True), nullable=True)
    signature_name  = Column(String, default="")
    decline_reason  = Column(String, default="")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    applicant = relationship("Applicant")
