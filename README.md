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
backend/.env
```

Important backend values:

```text
DATABASE_URL=sqlite:///./talentflow.db
FRONTEND_URL=http://localhost:5173
PORT=8001
HOST=0.0.0.0
```

Frontend environment file:

```text
frontend/.env
```

Important frontend value:

```text
VITE_API_URL=http://localhost:8001
```

## Notes

- The active SQLite database is stored inside `backend/talentflow.db`.
- Generated folders such as `frontend/dist`, `frontend/node_modules`, Python cache folders, logs, and local database backups should not be committed.
- Keep real secrets only in `.env` files and use `.env.example` for templates.

