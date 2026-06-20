from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth ──────────────────────────────────────────────────────────────────────

class HRLoginRequest(BaseModel):
    identifier: str  # employee_id or email
    password: str


class ApplicantRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ApplicantLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Unified login ─────────────────────────────────────────────────────────────
# Single endpoint that accepts any identifier (employee ID, work email,
# or applicant email) and returns the portal the caller belongs to.
# The frontend uses `portal` + `redirect_to` to route — no client-side
# regex guessing needed.

class UnifiedLoginRequest(BaseModel):
    """
    Accepts:
      • HR employee IDs  → "ADM-001", "HRM-002", "INT-003"
      • HR work emails   → "layla.rashidi@talentflow.ai"
      • Applicant emails → "mohammed@gmail.com"
    """
    identifier: str
    password: str

    @field_validator("identifier")
    @classmethod
    def identifier_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("identifier must not be empty")
        return v.strip()


class UnifiedLoginResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    portal:       str          # "hr" | "applicant"
    redirect_to:  str          # "/hr/dashboard" | "/user/dashboard"
    user:         dict


class CompanyRegisterRequest(BaseModel):
    """Public 'Start Free Trial' company self-registration."""
    company_name:  str
    company_email: EmailStr
    admin_name:    str
    password:      str
    plan:          str = "starter"   # starter | professional | enterprise

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ResetPasswordOtpRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ─── Applicant / Profile ───────────────────────────────────────────────────────

class ExperienceBase(BaseModel):
    title: str
    company: str
    start_year: str = ""
    end_year: str = ""
    description: str = ""


class ExperienceOut(ExperienceBase):
    id: int
    model_config = {"from_attributes": True}


class EducationBase(BaseModel):
    degree: str
    university: str
    graduation_year: str = ""
    gpa: str = ""
    gpa_scale: str = "4.0"


class EducationOut(EducationBase):
    id: int
    model_config = {"from_attributes": True}


class CertificationBase(BaseModel):
    name: str
    issuer: str = ""
    year: str = ""


class CertificationOut(CertificationBase):
    id: int
    model_config = {"from_attributes": True}


class ApplicantProjectBase(BaseModel):
    name: str
    description: str = ""
    technologies: List[str] = []
    link: str = ""


class ApplicantProjectOut(ApplicantProjectBase):
    id: int
    model_config = {"from_attributes": True}


class ApplicantProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    nationality: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    years_of_experience: Optional[str] = None
    degree: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[str] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    availability: Optional[str] = None
    travel_willingness: Optional[bool] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    national_id: Optional[str] = None


class ApplicantSettingsUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    job_alerts: Optional[bool] = None
    application_updates: Optional[bool] = None
    interview_reminders: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    profile_visibility: Optional[str] = None
    open_to_work: Optional[bool] = None
    language: Optional[str] = None


class ApplicantOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    nationality: str
    location: str
    linkedin: str
    portfolio: str
    years_of_experience: str
    degree: str
    university: str
    graduation_year: str
    skills: List[str]
    languages: List[str]
    availability: str
    travel_willingness: bool
    headline: str
    bio: str
    national_id: str
    profile_completion: int
    experiences: List[ExperienceOut] = []
    education: List[EducationOut] = []
    certifications: List[CertificationOut] = []
    projects: List[ApplicantProjectOut] = []
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Resume ────────────────────────────────────────────────────────────────────

class ResumeOut(BaseModel):
    id: int
    file_name: str
    file_type: str
    file_size_kb: int
    ai_summary: str
    ai_score: Optional[float]
    ats_score: Optional[float]
    skills_extracted: List[str]
    strengths: List[str]
    weaknesses: List[str]
    improvements: List[str]
    missing_skills: List[str]
    is_primary: bool
    uploaded_at: datetime
    model_config = {"from_attributes": True}


# ─── Jobs ──────────────────────────────────────────────────────────────────────

class JobOut(BaseModel):
    id: int
    title: str
    company: str
    company_size: str
    industry: str
    department: str
    description: str
    location: str
    remote: str
    job_type: str
    experience_required: str
    skills_required: List[str]
    languages_required: List[str]
    compensation_range: str
    deadline: str
    status: str
    responsibilities: List[str]
    qualifications: List[str]
    benefits: List[str]
    is_featured: bool
    created_at: datetime
    applicant_count: int = 0
    model_config = {"from_attributes": True}


class JobCreate(BaseModel):
    title: str
    company: str
    company_size: str = ""
    industry: str = ""
    department: str = ""
    description: str = ""
    location: str = ""
    remote: str = "On-site"
    job_type: str = "Full-time"
    experience_required: str = ""
    skills_required: List[str] = []
    languages_required: List[str] = []
    compensation_range: str = ""
    deadline: str = ""
    responsibilities: List[str] = []
    qualifications: List[str] = []
    benefits: List[str] = []
    is_featured: bool = False


# ─── Applications ──────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: str = ""


class TimelineEntryOut(BaseModel):
    id: int
    status: str
    description: str
    created_at: datetime
    model_config = {"from_attributes": True}


class InterviewOut(BaseModel):
    id: int
    date: str
    time: str
    interview_type: str
    location: str
    status: str
    model_config = {"from_attributes": True}


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str = ""
    company: str = ""
    location: str = ""
    job_type: str = ""
    status: str
    pipeline_stage: str
    cover_letter: str
    notes: str
    applied_at: datetime
    timeline: List[TimelineEntryOut] = []
    interviews: List[InterviewOut] = []
    model_config = {"from_attributes": True}


# ─── Notifications ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    read: bool
    link: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── HR Users ──────────────────────────────────────────────────────────────────

class HRUserOut(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str
    role: str
    title: str
    department: str
    avatar: str
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}


class HRUserCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    password: str
    role: str = "interviewer"
    title: str = ""
    department: str = ""




# ─── HR Projects / Roles ──────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    client: str = ""
    department: str = ""
    description: str = ""
    location: str = ""
    timeline: str = ""
    priority: str = "Medium"
    status: str = "Active"
    progress: int = 0
    hiring_requirements: List[dict] = []


class ProjectOut(ProjectCreate):
    id: int
    roles: int = 0
    candidates: int = 0
    publishedJobId: Optional[int] = None
    createdAt: str = ""


class HiringRoleCreate(BaseModel):
    project_id: Optional[int] = None
    title: str
    open_positions: int = 1
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    languages: List[str] = []
    location: str = "Remote"
    travel_requirement: str = "None"
    availability: str = "Immediate"
    contract_type: str = "Full-time"
    compensation_range: str = "Negotiable"
    deadline: str = ""
    status: str = "Open"


class HiringRoleOut(BaseModel):
    id: int
    projectId: Optional[int] = None
    title: str
    openPositions: int
    requiredSkills: List[str]
    preferredSkills: List[str]
    languages: List[str]
    location: str
    travelRequirement: str
    availability: str
    contractType: str
    compensationRange: str
    deadline: str
    status: str
    candidates: int = 0
    createdAt: str = ""


class TwoFactorVerifyRequest(BaseModel):
    challenge_token: str
    code: str


class TwoFactorSettingsRequest(BaseModel):
    enabled: bool


class HRAuthenticatorVerifyRequest(BaseModel):
    challenge_token: str
    code: str


# ─── AI ────────────────────────────────────────────────────────────────────────

class ResumeReviewResponse(BaseModel):
    resume_score: float
    ats_score: float
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    missing_skills: List[str]
    improvements: List[str]


class JobMatchRequest(BaseModel):
    job_ids: Optional[List[int]] = None  # if None, match against all active jobs


class JobMatchResponse(BaseModel):
    job_id: int
    job_title: str
    company: str
    match_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    recommendation: str


class CoverLetterRequest(BaseModel):
    job_id: int


class CoverLetterResponse(BaseModel):
    cover_letter: str
