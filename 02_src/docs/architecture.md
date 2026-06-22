# TalentFlow — Architecture Overview

## System Design

```
Browser
  │
  ▼
React SPA (Vite — port 5173)
  │  REST / JSON over HTTP
  ▼
FastAPI (Python — port 8001)
  │
  ├── SQLite (talentflow.db)     ← development
  ├── uploads/                   ← CV / resume files
  └── OpenAI API                 ← optional AI features
```

## Dual-Portal Architecture

| Portal | URL prefix | Auth type | Token storage |
|--------|-----------|-----------|---------------|
| HR Portal | `/hr/*` | JWT (`type: "hr"`) | `localStorage["tf_hr_token"]` |
| Applicant Portal | `/user/*` | JWT (`type: "applicant"`) | `localStorage["tf_user_token"]` |

Both portals share **one database** and **one backend**.  
The unified `/auth/login` endpoint decides which portal to send the user to.

## Auth Flow

```
POST /auth/login  { identifier, password }
        │
        ├── Search HR table (by employee_id OR email)
        │     └── found → portal = "hr",        redirect = "/hr/dashboard"
        │
        └── Search Applicant table (by email)
              └── found → portal = "applicant", redirect = "/user/dashboard"
```

## Pipeline Stages

```
New → Resume Reviewed → Shortlisted → Interview Scheduled →
Interviewed → Recommended → Offer Drafted → Contract Sent →
Hired / Rejected / Talent Pool
```

## Key Design Decisions

1. **`func.lower()` on both sides** for case-insensitive lookups (portable across SQLite/PostgreSQL).
2. **`loading = true`** only when token exists but user profile is not cached — avoids spinner on every page visit.
3. **`UserAuthGate`** is the single guard for all `/user/*` routes — no individual page needs its own auth check.
4. **Mock data fallback** on every API call — pages always render even when the backend is unreachable.
5. **Port 8001** to avoid WinError 10013 on Windows (port 8000 is often reserved by IIS).
