"""
Minimal bootstrap script for TalentFlow.

No demo jobs, candidates, contracts, companies, or placeholder business records
are seeded here. Business data must be created through the FastAPI application
and stored in SQLite by real user actions.
"""
from database import SessionLocal, engine, Base
import models
from auth import hash_password

PLATFORM_OWNER_EMAIL = "talentflow27@gmail.com"
PLATFORM_OWNER_PASSWORD = "Super@123"
PLATFORM_OWNER_EMPLOYEE_ID = "ADM-000"

Base.metadata.create_all(bind=engine)


def seed_platform_owner():
    db = SessionLocal()
    try:
        owner = db.query(models.HRUser).filter(
            models.HRUser.employee_id == PLATFORM_OWNER_EMPLOYEE_ID
        ).first()
        if owner:
            owner.role = models.HRRole.super_admin
            owner.status = "active"
            owner.email = PLATFORM_OWNER_EMAIL
            db.commit()
            print(f"[seed] Platform owner already present: {owner.email}")
            return

        owner = models.HRUser(
            employee_id=PLATFORM_OWNER_EMPLOYEE_ID,
            name="Super Admin",
            email=PLATFORM_OWNER_EMAIL,
            password_hash=hash_password(PLATFORM_OWNER_PASSWORD),
            role=models.HRRole.super_admin,
            title="Platform Owner",
            department="Platform",
            avatar="SA",
            status="active",
            two_factor_enabled=True,
        )
        db.add(owner)
        db.commit()
        print(f"[seed] Platform owner created: {PLATFORM_OWNER_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_platform_owner()
    print("[seed] Complete. No demo business data seeded.")
