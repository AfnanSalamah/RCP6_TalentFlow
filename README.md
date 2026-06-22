# TalentFlow

TalentFlow is a full-stack hiring platform for three portals:

- Candidate portal for profiles, applications, contracts, notifications, and support.
- HR portal for company hiring workflows, candidates, interviews, contracts, and analytics.
- Super Admin portal for managing companies, users, announcements, support, and platform settings.

The project is organized as a monorepo with a React/Vite frontend and a FastAPI backend.

## Project Structure

```text
talentflow/
  backend/              FastAPI API, database models, routers, seed script
  frontend/             React application for Candidate, HR, and Super Admin portals
  docs/                 Optional technical documentation
  package.json          Root helper commands
  package-lock.json     Root lock file
  README.md             Project guide
```

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- Python 3.10 or newer

## First-Time Setup

Run these commands from PowerShell.

```powershell
cd C:\Users\afnan\Downloads\Rcp6_t1\rcp6\talentflow
```

Install the frontend dependencies:

```powershell
cd frontend
npm install
```

Install the backend dependencies:

```powershell
cd ..\backend
pip install -r requirements.txt
```

Create environment files if they do not already exist:

```powershell
copy .env.example .env
cd ..\frontend
copy .env.example .env
```

## Run The Project

### Option 1: Run Everything From The Root

From the project root:

```powershell
cd C:\Users\afnan\Downloads\Rcp6_t1\rcp6\talentflow
npm run dev
```

This starts the backend and then runs the frontend.

### Option 2: Run Backend And Frontend Separately

Terminal 1, backend:

```powershell
cd C:\Users\afnan\Downloads\Rcp6_t1\rcp6\talentflow\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Terminal 2, frontend:

```powershell
cd C:\Users\afnan\Downloads\Rcp6_t1\rcp6\talentflow\frontend
npm run dev
```

Open the app:

```text
http://127.0.0.1:5173
```

Backend API documentation:

```text
http://127.0.0.1:8001/docs
```

## Useful Commands

Run from the project root:

```powershell
npm run frontend
npm run backend
npm run build
npm run lint
```

Run the database seed from the backend folder:

```powershell
cd C:\Users\afnan\Downloads\Rcp6_t1\rcp6\talentflow\backend
python seed.py
```

## Environment

Backend environment file:

```text
02_src/backend/.env
```

Important backend values:

```text
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
FRONTEND_URL=https://talentflow-platform.vercel.app
PORT=8001
HOST=0.0.0.0
```

Frontend environment file:

```text
02_src/frontend/.env
```

Important frontend value:

```text
VITE_API_URL=https://talentflow-backend-asoo.onrender.com
```

Production URLs:

```text
Frontend: https://talentflow-platform.vercel.app
Backend docs: https://talentflow-backend-asoo.onrender.com/docs
```

## Deployment Settings

Neon database:

```text
Use the pooled or direct connection string from Neon.
Set it on Render as DATABASE_URL.
The URL should include sslmode=require.
```

Resend email:

```text
Create an API key in Resend.
Verify a sender domain or use the verified sandbox sender.
Set these on Render:
RESEND_API_KEY=<your Resend API key>
EMAIL_FROM=TalentFlow <onboarding@your-domain.com>
ALLOW_DEV_EMAIL_FALLBACK=false
```

Vercel frontend:

```text
Root Directory: 02_src/frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
Environment Variable:
VITE_API_URL=https://talentflow-backend-asoo.onrender.com
```

Render backend:

```text
Root Directory: 02_src/backend
Build Command: pip install -r requirements.txt
Start Command: python -m uvicorn main:app --host 0.0.0.0 --port $PORT
Environment Variables:
DATABASE_URL=<Neon PostgreSQL URL>
FRONTEND_URL=https://talentflow-platform.vercel.app
RESEND_API_KEY=<Resend API key>
EMAIL_FROM=TalentFlow <onboarding@your-domain.com>
ENVIRONMENT=production
ALLOW_DEV_EMAIL_FALLBACK=false
```

## Notes

- Local development can use SQLite at `02_src/backend/talentflow.db`; production should use Neon PostgreSQL.
- Generated folders such as `frontend/dist`, `frontend/node_modules`, Python cache folders, logs, and local database backups should not be committed.
- Keep real secrets only in `.env` files and use `.env.example` for templates.
