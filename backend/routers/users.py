"""Unified live SQL user-management API.

This router exposes the required /api/users CRUD endpoints and maps them to the
same SQLite-backed HRUser table used by the HR portal. It deliberately returns
only database records; no placeholder or hardcoded users are produced here.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from auth import get_current_hr_user, hash_password, tenant_filter
from welcome_service import welcome_employee
import models

router = APIRouter(prefix="/api/users", tags=["Users"])

SUPPORTED_ROLES = {"super_admin", "admin", "hr_manager", "interviewer", "candidate", "hiring_manager"}

# Map any human-readable / spaced label the UI might send to the canonical enum value.
_ROLE_ALIASES = {
    "super admin": "super_admin", "superadmin": "super_admin",
    "admin": "admin", "administrator": "admin",
    "hr manager": "hr_manager", "hr-manager": "hr_manager", "manager": "hr_manager",
    "hiring manager": "hiring_manager",
    "interviewer": "interviewer",
    "candidate": "candidate",
}


def _normalize_role(raw: str) -> str:
    """Accept either a canonical enum value or a display label (e.g. 'HR Manager')."""
    key = (raw or "").strip().lower()
    return _ROLE_ALIASES.get(key, key.replace(" ", "_").replace("-", "_"))

class UserCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    password: str
    role: str = "interviewer"
    company_id: Optional[int] = None
    title: str = ""
    department: str = ""
    status: str = "active"

class UserUpdate(BaseModel):
    employee_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    company_id: Optional[int] = None
    title: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


def _require_admin(user: models.HRUser):
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")


def _out(u: models.HRUser, db: Session) -> dict:
    company = db.query(models.Company).filter(models.Company.id == u.company_id).first() if u.company_id else None
    return {
        "id": u.id,
        "employee_id": u.employee_id,
        "employeeId": u.employee_id,
        "full_name": u.name,
        "name": u.name,
        "email": u.email,
        "role": u.role.value if hasattr(u.role, "value") else str(u.role),
        "company_id": u.company_id,
        "company": company.company_name if company else "Platform",
        "status": u.status,
        "title": u.title,
        "department": u.department,
        "last_login": u.last_login,
        "created_at": u.created_at,
    }

@router.get("")
def list_users(search: str = "", current: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    _require_admin(current)
    q = db.query(models.HRUser)
    if (current.role.value if hasattr(current.role, "value") else str(current.role)) != "super_admin":
        q = tenant_filter(q, models.HRUser, current)
    if search:
        like = f"%{search}%"
        q = q.filter((models.HRUser.name.ilike(like)) | (models.HRUser.email.ilike(like)) | (models.HRUser.employee_id.ilike(like)))
    return [_out(u, db) for u in q.order_by(models.HRUser.created_at.desc()).all()]

@router.post("", status_code=201)
def create_user(body: UserCreate, current: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    _require_admin(current)
    role = _normalize_role(body.role)
    if role not in SUPPORTED_ROLES:
        raise HTTPException(status_code=400, detail="Unsupported role")
    if role == "candidate":
        raise HTTPException(status_code=400, detail="Candidate accounts are managed through applicant registration")
    if db.query(models.HRUser).filter((models.HRUser.employee_id == body.employee_id) | (func.lower(models.HRUser.email) == body.email.lower())).first():
        raise HTTPException(status_code=409, detail="Employee ID or email already exists")
    company_id = body.company_id if (current.role.value if hasattr(current.role, "value") else str(current.role)) == "super_admin" else current.company_id
    user = models.HRUser(
        employee_id=body.employee_id,
        name=body.full_name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=models.HRRole(role),
        company_id=company_id,
        title=body.title,
        department=body.department,
        status=body.status,
        avatar=body.full_name[:2].upper(),
        created_by=current.id,
    )
    db.add(user)
    db.flush()
    welcome_employee(db, user)
    db.commit()
    db.refresh(user)
    return _out(user, db)

@router.put("/{user_id}")
def update_user(user_id: int, body: UserUpdate, current: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    _require_admin(current)
    q = db.query(models.HRUser)
    if (current.role.value if hasattr(current.role, "value") else str(current.role)) != "super_admin":
        q = tenant_filter(q, models.HRUser, current)
    user = q.filter(models.HRUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = body.model_dump(exclude_none=True)
    if "employee_id" in data:
        user.employee_id = data["employee_id"]
    if "full_name" in data:
        user.name = data["full_name"]
    if "email" in data:
        user.email = str(data["email"]).lower()
    if "role" in data:
        role = _normalize_role(data["role"])
        if role not in SUPPORTED_ROLES or role == "candidate":
            raise HTTPException(status_code=400, detail="Unsupported role")
        user.role = models.HRRole(role)
    for field in ["company_id", "title", "department", "status"]:
        if field in data:
            setattr(user, field, data[field])
    if data.get("password"):
        user.password_hash = hash_password(data["password"])
    db.commit(); db.refresh(user)
    return _out(user, db)

@router.delete("/{user_id}")
def delete_user(user_id: int, current: models.HRUser = Depends(get_current_hr_user), db: Session = Depends(get_db)):
    _require_admin(current)
    if user_id == current.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    q = db.query(models.HRUser)
    if (current.role.value if hasattr(current.role, "value") else str(current.role)) != "super_admin":
        q = tenant_filter(q, models.HRUser, current)
    user = q.filter(models.HRUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "inactive"
    db.commit()
    return {"message": "User deactivated", "id": user_id}
