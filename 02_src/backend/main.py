from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

from database import engine, Base
from config import settings

# Import models to register them with Base before create_all
import models  # noqa: F401

from routers import (
    auth_hr, auth_applicant, auth_unified, profile, resumes,
    jobs, applications, notifications, interviews,
    ai, hr_users, hr_resources, dashboard, super_admin,
    company_register, users, contracts, support, email_templates,
    talent_pool,
)

# Create all tables
Base.metadata.create_all(bind=engine)

# Lightweight SQLite migration for projects/roles and optional 2FA columns.
# create_all does not add columns to an existing SQLite database, so this keeps
# previously shipped talentflow.db usable without Alembic.
def _ensure_sqlite_columns():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    from sqlalchemy import text
    with engine.begin() as conn:
        common = {
            "two_factor_enabled": "BOOLEAN DEFAULT 0",
            "otp_code": "VARCHAR",
            "otp_expires": "DATETIME",
            "reset_token": "VARCHAR",
            "reset_token_expires": "DATETIME",
        }
        for table in ["applicants", "hr_users"]:
            existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
            for name, ddl in common.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
            if table == "hr_users" and "totp_secret" not in existing:
                conn.execute(text("ALTER TABLE hr_users ADD COLUMN totp_secret VARCHAR"))

        existing_roles = {row[1] for row in conn.execute(text("PRAGMA table_info(hiring_roles)"))}
        if "published_job_id" not in existing_roles:
            conn.execute(text("ALTER TABLE hiring_roles ADD COLUMN published_job_id INTEGER"))

        # Email verification columns
        existing_app = {row[1] for row in conn.execute(text("PRAGMA table_info(applicants)"))}
        for col, ddl in [
            ("is_verified",              "BOOLEAN DEFAULT 0"),
            ("verification_otp",         "VARCHAR"),
            ("verification_otp_expires", "DATETIME"),
        ]:
            if col not in existing_app:
                conn.execute(text(f"ALTER TABLE applicants ADD COLUMN {col} {ddl}"))

        # Multi-tenant: add company_id to every tenant-scoped table.
        for table in ["hr_users", "jobs", "applications", "interviews", "projects", "hiring_roles"]:
            existing_cols = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
            if "company_id" not in existing_cols:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN company_id INTEGER"))
            if table in ["applications", "interviews"] and "job_role_id" not in existing_cols:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN job_role_id INTEGER"))

        # System audit additions: keep legacy SQLite DBs aligned with the live models.
        table_cols = {
            "hr_users": {
                "last_login": "DATETIME",
                "profile_picture": "VARCHAR DEFAULT ''",
                "created_by": "INTEGER",
                "updated_at": "DATETIME",
            },
            "applicants": {
                "last_login": "DATETIME",
                "otp_code": "VARCHAR",
                "otp_expires": "DATETIME",
            },
            "super_admins": {
                "phone": "VARCHAR DEFAULT ''",
                "profile_picture": "VARCHAR DEFAULT ''",
                "role": "VARCHAR DEFAULT 'SuperAdmin'",
                "last_login": "DATETIME",
                "two_factor_enabled": "BOOLEAN DEFAULT 1",
                "two_factor_secret": "VARCHAR",
                "updated_at": "DATETIME",
            },
            "companies": {
                "is_deleted": "BOOLEAN DEFAULT 0",
                "deleted_at": "DATETIME",
                "deleted_by": "INTEGER",
            },
            "notifications": {
                "company_id": "INTEGER",
                "created_by": "INTEGER",
                "recipient_scope": "VARCHAR DEFAULT 'applicant'",
                "recipient_user_id": "INTEGER",
                "recipient_role": "VARCHAR DEFAULT ''",
                "notification_category": "VARCHAR DEFAULT 'info'",
                "is_read": "BOOLEAN DEFAULT 0",
                "email_sent": "BOOLEAN DEFAULT 0",
            },
            "interviews": {
                "meeting_provider": "VARCHAR DEFAULT ''",
                "meeting_url": "VARCHAR DEFAULT ''",
                "onsite_address": "VARCHAR DEFAULT ''",
            },
            "announcements": {
                "company_id": "INTEGER",
            },
        }
        for table, cols in table_cols.items():
            existing_cols = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
            for name, ddl in cols.items():
                if name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))

        # Platform/company notifications have no applicant_id. Older databases
        # created the column NOT NULL, which blocks Super Admin notifications
        # (Issue 8). Rebuild the table to make applicant_id nullable if needed.
        notif_info = list(conn.execute(text("PRAGMA table_info(notifications)")))
        applicant_col = next((r for r in notif_info if r[1] == "applicant_id"), None)
        if applicant_col and applicant_col[3] == 1:  # r[3] == notnull flag
            conn.execute(text("ALTER TABLE notifications RENAME TO notifications_old"))
            conn.execute(text(
                "CREATE TABLE notifications ("
                "id INTEGER PRIMARY KEY, "
                "applicant_id INTEGER REFERENCES applicants(id), "
                "company_id INTEGER REFERENCES companies(id), "
                "created_by INTEGER, "
                "recipient_scope VARCHAR DEFAULT 'applicant', "
                "recipient_user_id INTEGER, "
                "recipient_role VARCHAR DEFAULT '', "
                "notification_category VARCHAR DEFAULT 'info', "
                "type VARCHAR DEFAULT 'info', "
                "title VARCHAR NOT NULL, "
                "message TEXT NOT NULL, "
                "read BOOLEAN DEFAULT 0, "
                "is_read BOOLEAN DEFAULT 0, "
                "email_sent BOOLEAN DEFAULT 0, "
                "link VARCHAR DEFAULT '', "
                "created_at DATETIME)"
            ))
            old_cols = {r[1] for r in notif_info}
            shared = [c for c in [
                "id", "applicant_id", "company_id", "created_by", "recipient_scope",
                "recipient_user_id", "recipient_role", "notification_category", "type",
                "title", "message", "read", "is_read", "email_sent", "link", "created_at",
            ] if c in old_cols]
            collist = ", ".join(shared)
            conn.execute(text(f"INSERT INTO notifications ({collist}) SELECT {collist} FROM notifications_old"))
            conn.execute(text("DROP TABLE notifications_old"))

        conn.execute(text(
            "UPDATE notifications "
            "SET recipient_user_id = applicant_id "
            "WHERE applicant_id IS NOT NULL AND recipient_user_id IS NULL"
        ))
        conn.execute(text(
            "UPDATE notifications "
            "SET recipient_role = 'candidate' "
            "WHERE applicant_id IS NOT NULL AND (recipient_role IS NULL OR recipient_role = '')"
        ))
        conn.execute(text(
            "UPDATE notifications "
            "SET recipient_role = 'super_admin' "
            "WHERE recipient_scope = 'super_admin' AND (recipient_role IS NULL OR recipient_role = '')"
        ))
        conn.execute(text(
            "UPDATE notifications "
            "SET recipient_role = 'hr_manager' "
            "WHERE recipient_scope IN ('all_companies', 'specific_company', 'company_admins') "
            "AND (recipient_role IS NULL OR recipient_role = '')"
        ))
        conn.execute(text(
            "UPDATE notifications "
            "SET notification_category = COALESCE(NULLIF(type, ''), 'info') "
            "WHERE notification_category IS NULL OR notification_category = ''"
        ))

        # Support Center: support_tickets needs company_id NULLABLE (candidates have
        # no company) plus requester/category/unread columns. Rebuild if the legacy
        # company-only schema is detected.
        st_info = list(conn.execute(text("PRAGMA table_info(support_tickets)")))
        if st_info:
            st_cols = {r[1] for r in st_info}
            company_col = next((r for r in st_info if r[1] == "company_id"), None)
            needs_rebuild = "requester_type" not in st_cols or (company_col and company_col[3] == 1)
            if needs_rebuild:
                conn.execute(text("ALTER TABLE support_tickets RENAME TO support_tickets_old"))
                conn.execute(text(
                    "CREATE TABLE support_tickets ("
                    "id INTEGER PRIMARY KEY, "
                    "company_id INTEGER REFERENCES companies(id), "
                    "subject VARCHAR NOT NULL, message TEXT NOT NULL, "
                    "priority VARCHAR DEFAULT 'Medium', status VARCHAR DEFAULT 'Open', "
                    "created_at DATETIME, updated_at DATETIME, "
                    "requester_type VARCHAR DEFAULT '', requester_id INTEGER, "
                    "requester_name VARCHAR DEFAULT '', requester_email VARCHAR DEFAULT '', "
                    "category VARCHAR DEFAULT 'General Support', "
                    "unread_for_user BOOLEAN DEFAULT 0, unread_for_admin BOOLEAN DEFAULT 1, "
                    "last_message_at DATETIME)"
                ))
                shared = [c for c in [
                    "id", "company_id", "subject", "message", "priority", "status",
                    "created_at", "updated_at",
                ] if c in st_cols]
                cl = ", ".join(shared)
                conn.execute(text(f"INSERT INTO support_tickets ({cl}) SELECT {cl} FROM support_tickets_old"))
                conn.execute(text("DROP TABLE support_tickets_old"))

        # Remove orphan applicant settings left by failed legacy registrations.
        # Otherwise SQLite may reuse the missing applicant id and hit the unique
        # applicant_settings.applicant_id constraint on the next registration.
        conn.execute(text(
            "DELETE FROM applicant_settings "
            "WHERE applicant_id NOT IN (SELECT id FROM applicants)"
        ))

        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS talent_pool ("
            "id INTEGER PRIMARY KEY, "
            "company_id INTEGER NOT NULL REFERENCES companies(id), "
            "candidate_id INTEGER NOT NULL REFERENCES applicants(id), "
            "job_id INTEGER REFERENCES jobs(id), "
            "status VARCHAR DEFAULT 'Available', "
            "notes TEXT DEFAULT '', "
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
            "updated_at DATETIME, "
            "UNIQUE(company_id, candidate_id)"
            ")"
        ))

_ensure_sqlite_columns()


def _backfill_tenancy():
    """Assign all pre-existing data to a single Default Organization so the
    upgraded multi-tenant schema stays consistent for legacy SQLite databases.

    Idempotent: only rows with NULL company_id are touched, and the platform
    owner / super-admins are deliberately left tenant-less (they operate at the
    platform level through the Super Admin portal).
    """
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    from sqlalchemy import text
    db = _SessionLocal()
    try:
        # Is there anything to backfill? (any tenant table with a NULL company_id)
        orphan_hr = db.execute(text(
            "SELECT COUNT(*) FROM hr_users WHERE company_id IS NULL AND role != 'super_admin'"
        )).scalar() or 0
        orphan_jobs = db.execute(text("SELECT COUNT(*) FROM jobs WHERE company_id IS NULL")).scalar() or 0
        if orphan_hr == 0 and orphan_jobs == 0:
            return

        company = db.query(models.Company).order_by(models.Company.id.asc()).first()
        if not company:
            from datetime import datetime, timedelta
            company = models.Company(
                company_name="Default Organization",
                industry="General",
                contact_person="Platform Admin",
                subscription_plan="professional",
                subscription_status="active",
                subscription_start_date=datetime.utcnow(),
                subscription_end_date=datetime.utcnow() + timedelta(days=365),
                max_users=50, max_jobs=100, max_ai_requests=2000,
                is_active=True,
                notes="Auto-created during multi-tenant migration to hold pre-existing data.",
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            log.info("[MIGRATE] Created Default Organization (id=%s) for legacy data", company.id)

        cid = company.id
        # HR users (keep super_admins platform-level)
        db.execute(text(
            "UPDATE hr_users SET company_id = :cid WHERE company_id IS NULL AND role != 'super_admin'"
        ), {"cid": cid})
        # Jobs / projects / hiring_roles
        for table in ["jobs", "projects", "hiring_roles"]:
            db.execute(text(f"UPDATE {table} SET company_id = :cid WHERE company_id IS NULL"), {"cid": cid})
        # Applications / interviews inherit from their job's company
        db.execute(text(
            "UPDATE applications SET company_id = (SELECT company_id FROM jobs WHERE jobs.id = applications.job_id) "
            "WHERE company_id IS NULL"
        ))
        db.execute(text(
            "UPDATE interviews SET company_id = (SELECT company_id FROM jobs WHERE jobs.id = interviews.job_id) "
            "WHERE company_id IS NULL"
        ))
        db.commit()
        log.info("[MIGRATE] Backfilled legacy tenant data into company_id=%s", cid)
    finally:
        db.close()

# Seed super admin account on first run
from database import SessionLocal as _SessionLocal
log = logging.getLogger("talentflow.seed")

# Default platform owner - created automatically on first deployment.
PLATFORM_OWNER_EMAIL = "talentflow27@gmail.com"
PLATFORM_OWNER_NAME = "Platform Owner"
PLATFORM_OWNER_EMPLOYEE_ID = "ADM-000"
PLATFORM_OWNER_DEFAULT_PASSWORD = "Super@123"


def seed_platform_owner(db):
    """Ensure exactly one default Super Admin (platform owner) exists.

    The owner is a normal HRUser with role 'super_admin', so it signs in through
    the same unified /login page as everyone else and receives the same OTP email.
    Idempotent: if the account already exists it is only normalised (role/status),
    never duplicated and never password-reset.
    """
    from sqlalchemy import func as _func
    from auth import hash_password as _hash, verify_password as _verify

    owner = db.query(models.HRUser).filter(
        (models.HRUser.employee_id == PLATFORM_OWNER_EMPLOYEE_ID)
        | (_func.lower(models.HRUser.email) == PLATFORM_OWNER_EMAIL.lower())
    ).first()

    if owner:
        changed = False
        if (owner.role.value if hasattr(owner.role, "value") else str(owner.role)) != "super_admin":
            owner.role = models.HRRole.super_admin
            changed = True
        if owner.email.lower() != PLATFORM_OWNER_EMAIL.lower():
            owner.email = PLATFORM_OWNER_EMAIL.lower()
            changed = True
        if not _verify(PLATFORM_OWNER_DEFAULT_PASSWORD, owner.password_hash):
            owner.password_hash = _hash(PLATFORM_OWNER_DEFAULT_PASSWORD)
            owner.last_login = None
            owner.otp_code = None
            owner.otp_expires = None
            changed = True
        if owner.status != "active":
            owner.status = "active"
            changed = True
        if changed:
            db.commit()
            log.info("[SEED] Normalised default platform owner %s", PLATFORM_OWNER_EMAIL)
        else:
            log.info("[SEED] Platform owner already present: %s", PLATFORM_OWNER_EMAIL)
        return

    # Avoid employee_id collision
    emp_id = PLATFORM_OWNER_EMPLOYEE_ID
    if db.query(models.HRUser).filter(models.HRUser.employee_id == emp_id).first():
        emp_id = f"ADM-OWNER-{int(__import__('time').time())}"

    owner = models.HRUser(
        employee_id=emp_id,
        name=PLATFORM_OWNER_NAME,
        email=PLATFORM_OWNER_EMAIL.lower(),
        password_hash=_hash(PLATFORM_OWNER_DEFAULT_PASSWORD),
        role=models.HRRole.super_admin,
        title="Platform Owner",
        department="Platform",
        status="active",
        two_factor_enabled=True,
    )
    db.add(owner)
    db.commit()
    log.info("[SEED] Created default Super Admin: %s / %s (employee_id=%s)",
             PLATFORM_OWNER_EMAIL, PLATFORM_OWNER_DEFAULT_PASSWORD, emp_id)


def _seed_once():
    db = _SessionLocal()
    try:        # Bootstrap-only platform owner as a unified-login HR super_admin
        seed_platform_owner(db)
    finally:
        db.close()
_seed_once()
_backfill_tenancy()

app = FastAPI(
    title="TalentFlow API",
    description="Dual-portal HR & Applicant management platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "https://talentflow-platform.vercel.app",
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
        "http://localhost:5176", "http://localhost:5177", "http://localhost:5178",
        "http://localhost:3000",
        "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175",
        "http://127.0.0.1:5176", "http://127.0.0.1:5177", "http://127.0.0.1:5178",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving uploaded files
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth_unified.router)   # â† unified /auth/login (must be first)
app.include_router(company_register.router)
app.include_router(auth_hr.router)
app.include_router(auth_applicant.router)
app.include_router(profile.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(notifications.router)
app.include_router(notifications.hr_router)
app.include_router(interviews.router)
app.include_router(ai.router)
app.include_router(hr_users.router)
app.include_router(users.router)
app.include_router(hr_resources.router)
app.include_router(dashboard.router)
app.include_router(super_admin.router)
app.include_router(email_templates.router)
app.include_router(contracts.hr_router)
app.include_router(contracts.applicant_router)
app.include_router(support.user_router)
app.include_router(support.admin_router)
app.include_router(talent_pool.router)


@app.get("/")
def root():
    return {"message": "TalentFlow API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
