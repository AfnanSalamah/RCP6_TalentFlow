# TalentFlow — API Reference

Interactive docs available at: **https://talentflow-backend-asoo.onrender.com/docs** (Swagger UI)

## Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Unified login — returns portal + token |
| POST | `/auth/applicant/register` | Register new applicant |
| POST | `/auth/applicant/forgot-password` | Send reset token |
| POST | `/auth/applicant/reset-password` | Reset password with token |
| GET  | `/auth/applicant/me` | Get current applicant profile |
| POST | `/auth/hr/login` | HR-only login |
| GET  | `/auth/hr/me` | Get current HR user |

## Applicant Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/applicant/profile` | Get / update profile |
| POST | `/applicant/apply` | Apply to a job |
| GET | `/applicant/applications` | List my applications |
| GET | `/applicant/applications/{id}` | Application detail |
| GET | `/applicant/interviews` | My scheduled interviews |
| GET | `/applicant/notifications` | My notifications |
| PATCH | `/applicant/notifications/{id}/read` | Mark notification read |
| GET | `/applicant/dashboard` | Dashboard summary stats |
| POST | `/applicant/resume/upload` | Upload CV (PDF/DOCX) |

## HR Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/jobs` | List / create jobs |
| GET/PUT/DELETE | `/jobs/{id}` | Job detail / update / close |
| GET | `/hr/candidates` | All candidates |
| PATCH | `/hr/applications/{id}/stage` | Update pipeline stage |
| GET/POST | `/hr/interviews` | List / schedule interviews |
| GET | `/hr/dashboard` | HR dashboard stats |
| GET/POST | `/hr/users` | HR user management (admin only) |

## AI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/resume-review` | Score + ATS analysis of resume |
| POST | `/ai/job-matching` | Match jobs to applicant profile |
| POST | `/ai/cover-letter` | Generate cover letter for a job |
| POST | `/ai/career-recommendations` | Career path recommendations |

> All AI endpoints fall back to structured mock responses when `OPENAI_API_KEY` is empty.
