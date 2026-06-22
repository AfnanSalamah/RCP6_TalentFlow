import os
import re
import json
import shutil
import logging
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_applicant
from config import settings
import models

log = logging.getLogger("talentflow.resume")

router = APIRouter(prefix="/applicant/resume", tags=["Resume"])

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}

COMMON_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular",
    "Node.js", "FastAPI", "Django", "Flask", "SQL", "PostgreSQL", "MySQL",
    "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Git", "Linux", "REST API", "GraphQL", "Machine Learning", "TensorFlow",
    "PyTorch", "Pandas", "NumPy", "Java", "C++", "C#", "Go", "Rust",
    "Swift", "Kotlin", "PHP", "Ruby", "Scala", "R", "MATLAB",
    "HTML", "CSS", "Tailwind", "Bootstrap", "Next.js", "Express", "Spring Boot",
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "SEO", "Google Analytics",
    "Excel", "PowerPoint", "Tableau", "Power BI", "Agile", "Scrum", "Jira",
    "Leadership", "Communication", "Problem Solving", "Project Management",
    "Data Analysis", "Cybersecurity", "Networking", "UI/UX", "Testing",
    "Quality Assurance", "Mobile Development", "API Design", "Cloud Computing",
]


# ─── Text Extraction ──────────────────────────────────────────────────────────

def _extract_text_pdf(path: str) -> str:
    # Try pdfplumber first (better layout handling)
    try:
        import pdfplumber
        text = ""
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
        if text.strip():
            return text
    except Exception as exc:
        log.warning("[RESUME] pdfplumber extraction failed for %s: %s", path, exc)

    # Fallback: PyMuPDF
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(path)
        text = "".join(page.get_text() for page in doc)
        doc.close()
        if text.strip():
            return text
    except Exception as exc:
        log.warning("[RESUME] PyMuPDF extraction failed for %s: %s", path, exc)

    # Last resort: PyPDF2
    try:
        import PyPDF2
        text = ""
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except Exception as exc:
        log.error("[RESUME] All PDF extractors failed for %s: %s", path, exc)
        return ""


def _extract_text_docx(path: str) -> str:
    try:
        from docx import Document
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as exc:
        log.error("[RESUME] DOCX extraction failed for %s: %s", path, exc)
        return ""


# ─── Heuristic (no-AI) extraction fallback ──────────────────────────────────────

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
_LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/[^\s,)]+", re.I)
_GITHUB_RE = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[^\s,)]+", re.I)
_URL_RE = re.compile(r"(?:https?://)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:/[^\s,)]*)?", re.I)
_COMMON_LANGS = ["Arabic", "English", "French", "Spanish", "German", "Urdu", "Hindi", "Chinese", "Turkish"]
_EDU_LINE_RE = re.compile(
    r"(bachelor|master|phd|doctorate|diploma|degree|university|college|gpa|graduat|"
    r"بكالوريوس|ماجستير|دكتوراه|دبلوم|جامعة|كلية|تخرج)",
    re.I,
)


def _section_lines(lines: list[str], headers: list[str], stop_headers: list[str], limit: int = 8) -> list[str]:
    collected: list[str] = []
    active = False
    header_re = re.compile("|".join(re.escape(h) for h in headers), re.I)
    stop_re = re.compile("|".join(re.escape(h) for h in stop_headers), re.I)
    for line in lines:
        if header_re.search(line):
            active = True
            continue
        if active and stop_re.search(line):
            break
        if active:
            collected.append(line)
            if len(collected) >= limit:
                break
    return collected


def _heuristic_extract(text: str) -> dict:
    """Regex/keyword extraction used when OpenAI is unavailable, so CV upload
    always returns *something* the candidate can review (Issue 2 fallback)."""
    data: dict = {}
    if not text:
        return data
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    email = _EMAIL_RE.search(text)
    if email:
        data["email"] = email.group(0)

    phone = _PHONE_RE.search(text)
    if phone:
        cand = phone.group(1).strip()
        if sum(c.isdigit() for c in cand) >= 9:
            data["phone"] = cand

    linkedin = _LINKEDIN_RE.search(text)
    if linkedin:
        data["linkedin"] = linkedin.group(0)
    github = _GITHUB_RE.search(text)
    if github:
        data["github"] = github.group(0)

    portfolio = next((u.group(0) for u in _URL_RE.finditer(text)
                      if "linkedin.com" not in u.group(0).lower() and "github.com" not in u.group(0).lower()), None)
    if portfolio:
        data["portfolio"] = portfolio

    # First non-empty line that looks like a name (<=4 words, no digits/@)
    for l in lines[:5]:
        if "@" not in l and not any(ch.isdigit() for ch in l) and 1 <= len(l.split()) <= 4 and len(l) <= 50:
            data["name"] = l
            break

    data["skills"] = _extract_skills_basic(text)
    langs = [lng for lng in _COMMON_LANGS if re.search(rf"\b{lng}\b", text, re.I)]
    if langs:
        data["languages"] = langs

    stop_headers = [
        "education", "experience", "employment", "work", "skills", "projects",
        "certifications", "certificates", "languages", "summary", "profile",
        "التعليم", "المؤهلات", "الخبرات", "الخبرة", "المهارات", "المشاريع", "الشهادات", "اللغات",
    ]
    edu_lines = _section_lines(lines, ["education", "academic", "qualification", "التعليم", "المؤهلات"], stop_headers)
    exp_lines = _section_lines(lines, ["experience", "employment", "work history", "الخبرات", "الخبرة"], stop_headers)
    project_lines = _section_lines(lines, ["projects", "portfolio"], stop_headers)
    cert_lines = _section_lines(lines, ["certifications", "certificates"], stop_headers)
    if not edu_lines:
        edu_lines = [l for l in lines if _EDU_LINE_RE.search(l)][:4]
    exp_lines_clean = []
    for l in exp_lines:
        if _EDU_LINE_RE.search(l):
            edu_lines.append(l)
        else:
            exp_lines_clean.append(l)
    exp_lines = exp_lines_clean
    if edu_lines:
        data["education"] = [{"degree": l, "university": "", "graduation_year": "", "gpa": ""} for l in edu_lines[:4]]
    if exp_lines:
        data["experience"] = [{"title": l, "company": "", "start_year": "", "end_year": "", "description": ""} for l in exp_lines[:5]]
    if project_lines:
        data["projects"] = [{"name": l, "description": "", "technologies": []} for l in project_lines[:5]]
    if cert_lines:
        data["certifications"] = [{"name": l, "issuer": "", "year": ""} for l in cert_lines[:5]]

    return data


def _extract_skills_basic(text: str) -> list:
    text_lower = text.lower()
    return [s for s in COMMON_SKILLS if s.lower() in text_lower]


# ─── OpenAI Extraction ────────────────────────────────────────────────────────

def _ai_extract_profile(text: str) -> Optional[dict]:
    """Use OpenAI to extract structured profile data from resume text."""
    if not settings.OPENAI_API_KEY:
        return None
    try:
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        prompt = f"""Extract the following information from this resume text and return it as JSON only (no markdown, no explanation):

{{
  "name": "full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "location": "city/country or null",
  "headline": "professional headline or job title or null",
  "bio": "short professional summary (2-3 sentences) or null",
  "linkedin": "linkedin URL or null",
  "portfolio": "portfolio/website URL or null",
  "github": "GitHub URL or null",
  "years_of_experience": "total years as string or null",
  "skills": ["skill1", "skill2"],
  "languages": ["English", "Arabic"],
  "education": [
    {{"degree": "...", "university": "...", "graduation_year": "...", "gpa": ""}}
  ],
  "experience": [
    {{"title": "...", "company": "...", "start_year": "...", "end_year": "...", "description": "..."}}
  ],
  "certifications": [
    {{"name": "...", "issuer": "...", "year": ""}}
  ],
  "projects": [
    {{"name": "...", "description": "...", "technologies": ["..."]}}
  ],
  "insights": {{
    "strengths": ["..."],
    "weaknesses": ["..."],
    "missing_skills": ["..."],
    "recommendation": "short hiring/profile recommendation",
    "job_match_score": 0
  }}
}}

Resume text:
{text[:6000]}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code block if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as exc:
        log.error("[RESUME] OpenAI profile extraction failed: %s", exc)
        return None


def _ai_extract_profile_from_image(path: str, content_type: str) -> Optional[dict]:
    """Use OpenAI vision for image resumes/screenshots when configured."""
    if not settings.OPENAI_API_KEY:
        return None
    try:
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        with open(path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("ascii")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": """Read this resume/profile image and return JSON only:
{
  "name": null,
  "email": null,
  "phone": null,
  "location": null,
  "headline": null,
  "bio": null,
  "linkedin": null,
  "portfolio": null,
  "github": null,
  "years_of_experience": null,
  "skills": [],
  "languages": [],
  "education": [{"degree": "", "university": "", "graduation_year": "", "gpa": ""}],
  "experience": [{"title": "", "company": "", "start_year": "", "end_year": "", "description": ""}],
  "certifications": [{"name": "", "issuer": "", "year": ""}],
  "projects": [{"name": "", "description": "", "technologies": []}],
  "insights": {"strengths": [], "weaknesses": [], "missing_skills": [], "recommendation": "", "job_match_score": 0}
}"""},
                    {"type": "image_url", "image_url": {"url": f"data:{content_type};base64,{encoded}"}},
                ],
            }],
            temperature=0,
            max_tokens=1800,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as exc:
        log.error("[RESUME] OpenAI image profile extraction failed: %s", exc)
        return None


def _ai_analyze_resume(text: str) -> dict:
    """Generate AI analysis scores and feedback."""
    if not settings.OPENAI_API_KEY:
        return {}
    try:
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = f"""Analyze this resume and return JSON only:
{{
  "ai_score": 0-100 float,
  "ats_score": 0-100 float,
  "ai_summary": "2-sentence professional summary",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "missing_skills": ["skill1", "skill2"],
  "improvements": ["suggestion1", "suggestion2", "suggestion3"],
  "recommendation": "short recommendation",
  "job_match_score": 0-100 float
}}

Resume:
{text[:4000]}"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=800,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as exc:
        log.error("[RESUME] OpenAI resume analysis failed: %s", exc)
        return {}


# ─── Upload ───────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and resume images are supported")

    content = await file.read()
    size_kb = len(content) // 1024

    if size_kb > settings.MAX_UPLOAD_SIZE_MB * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    applicant_dir = os.path.join(settings.UPLOAD_DIR, f"applicant_{current.id}")
    os.makedirs(applicant_dir, exist_ok=True)

    safe_filename = f"resume_{current.id}_{file.filename}"
    file_path = os.path.join(applicant_dir, safe_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    file_type = ALLOWED_TYPES[file.content_type]
    if file_type == "pdf":
        extracted_text = _extract_text_pdf(file_path)
    elif file_type in ("doc", "docx"):
        extracted_text = _extract_text_docx(file_path)
    else:
        extracted_text = ""

    if not extracted_text.strip():
        log.error("[RESUME] No text could be extracted from %s (applicant %s)", file.filename, current.id)

    skills = _extract_skills_basic(extracted_text)

    # AI extraction for profile fields, with a regex heuristic fallback so the
    # candidate always gets an extraction preview even when OpenAI is unavailable.
    extracted_data = _ai_extract_profile_from_image(file_path, file.content_type) if file_type in ("png", "jpg", "webp") else _ai_extract_profile(extracted_text)
    used_fallback = False
    if not extracted_data:
        heuristic = _heuristic_extract(extracted_text)
        if heuristic:
            extracted_data = heuristic
            used_fallback = True
            log.warning("[RESUME] Used heuristic fallback extraction for applicant %s", current.id)

    # AI analysis
    analysis = _ai_analyze_resume(extracted_text)
    if extracted_data is not None:
        extracted_data.setdefault("insights", {})
        extracted_data["insights"].update({
            "strengths": analysis.get("strengths", extracted_data["insights"].get("strengths", [])),
            "weaknesses": analysis.get("weaknesses", extracted_data["insights"].get("weaknesses", [])),
            "missing_skills": analysis.get("missing_skills", extracted_data["insights"].get("missing_skills", [])),
            "recommendation": analysis.get("recommendation", extracted_data["insights"].get("recommendation", "")),
            "job_match_score": analysis.get("job_match_score", extracted_data["insights"].get("job_match_score", 0)),
        })

    # Mark old primaries non-primary
    db.query(models.Resume).filter(
        models.Resume.applicant_id == current.id,
        models.Resume.is_primary == True,
    ).update({"is_primary": False})

    # Merge AI skills with basic skills
    if extracted_data and extracted_data.get("skills"):
        all_skills = list(set(skills) | set(extracted_data["skills"]))
    else:
        all_skills = skills

    resume = models.Resume(
        applicant_id=current.id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size_kb=size_kb,
        extracted_text=extracted_text[:10000],
        skills_extracted=all_skills,
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
    db.commit()
    db.refresh(resume)

    response = {
        "id": resume.id,
        "file_name": resume.file_name,
        "file_type": resume.file_type,
        "file_size_kb": resume.file_size_kb,
        "skills_extracted": resume.skills_extracted,
        "ai_score": resume.ai_score,
        "ats_score": resume.ats_score,
        "message": "Resume uploaded successfully",
    }

    # Return extracted profile preview if extraction (AI or heuristic) produced data
    if extracted_data:
        response["extracted_profile"] = extracted_data
        response["has_extraction"] = True
        response["extraction_method"] = "heuristic" if used_fallback else "ai"
    else:
        response["has_extraction"] = False
        response["extraction_method"] = "none"
        response["extraction_error"] = (
            "Could not read any text from the file." if not extracted_text.strip()
            else "Automatic field extraction was unavailable; please fill your profile manually."
        )

    return response


# ─── Apply Extraction ─────────────────────────────────────────────────────────

class ApplyExtractionRequest(BaseModel):
    resume_id: int
    extracted_profile: dict


@router.post("/apply-extraction")
def apply_extraction(
    body: ApplyExtractionRequest,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    """Apply AI-extracted profile data to the applicant's profile (empty fields only, no duplicates)."""
    log.info("[RESUME] Apply extraction request sent: applicant=%s resume=%s", current.id, body.resume_id)
    resume = db.query(models.Resume).filter(
        models.Resume.id == body.resume_id,
        models.Resume.applicant_id == current.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    from routers.profile import apply_cv_profile_data

    try:
        inserted = apply_cv_profile_data(db, current, body.extracted_profile or {})
        db.commit()
        db.refresh(current)
    except Exception as exc:
        db.rollback()
        log.exception("[RESUME] Apply extraction failed: applicant=%s resume=%s error=%s", current.id, body.resume_id, exc)
        raise HTTPException(status_code=500, detail="Could not save extracted resume data")

    log.info("[RESUME] Apply extraction success: applicant=%s resume=%s inserted=%s", current.id, body.resume_id, inserted)
    return {
        "message": "Resume information successfully added to your profile.",
        "inserted": inserted,
        "profile_completion": current.profile_completion,
    }


# ─── List / Get / Delete ──────────────────────────────────────────────────────

@router.get("/list")
def list_resumes(
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    resumes = (
        db.query(models.Resume)
        .filter(models.Resume.applicant_id == current.id)
        .order_by(models.Resume.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "file_name": r.file_name,
            "file_type": r.file_type,
            "file_size_kb": r.file_size_kb,
            "ai_score": r.ai_score,
            "ats_score": r.ats_score,
            "is_primary": r.is_primary,
            "uploaded_at": r.uploaded_at,
        }
        for r in resumes
    ]


@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.applicant_id == current.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.applicant_id == current.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted"}
