from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_hr_user, hash_password, tenant_filter
from schemas import HRUserCreate, HRUserOut
from routers.users import _normalize_role
from welcome_service import welcome_employee
import models

router = APIRouter(prefix="/hr/users", tags=["HR Users"])


def _require_admin(hr_user: models.HRUser):
    if hr_user.role not in (models.HRRole.admin, models.HRRole.super_admin):
        raise HTTPException(status_code=403, detail="Admin access required")


def _enforce_user_limit(hr_user: models.HRUser, db: Session):
    """Block new HR seats once the company hits its plan's user cap."""
    if hr_user.company_id is None:
        return
    company = db.query(models.Company).filter(models.Company.id == hr_user.company_id).first()
    if not company:
        return
    seats = db.query(models.HRUser).filter(
        models.HRUser.company_id == hr_user.company_id,
        models.HRUser.status == "active",
    ).count()
    if company.max_users and seats >= company.max_users:
        raise HTTPException(
            status_code=403,
            detail=f"User limit reached for your {company.subscription_plan} plan "
                   f"({company.max_users} seats). Upgrade to add more team members.",
        )


@router.get("")
def list_hr_users(
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    users = tenant_filter(db.query(models.HRUser), models.HRUser, hr_user).all()
    return [_user_out(u) for u in users]


@router.post("", status_code=201)
def create_hr_user(
    body: HRUserCreate,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    _require_admin(hr_user)
    _enforce_user_limit(hr_user, db)
    existing = db.query(models.HRUser).filter(
        (models.HRUser.employee_id == body.employee_id) |
        (models.HRUser.email == body.email.lower())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID or email already exists")

    role = _normalize_role(body.role)
    if role not in {r.value for r in models.HRRole}:
        raise HTTPException(status_code=400, detail=f"Unsupported role: {body.role}")
    user = models.HRUser(
        employee_id=body.employee_id,
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=models.HRRole(role),
        company_id=hr_user.company_id,   # new seats belong to the creator's company
        title=body.title,
        department=body.department,
        avatar=body.name[:2].upper(),
    )
    db.add(user)
    db.flush()
    welcome_employee(db, user)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.put("/{user_id}")
def update_hr_user(
    user_id: int,
    body: dict,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    _require_admin(hr_user)
    user = tenant_filter(db.query(models.HRUser), models.HRUser, hr_user).filter(
        models.HRUser.id == user_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field in ["name", "title", "department", "status"]:
        if field in body:
            setattr(user, field, body[field])
    if "role" in body:
        user.role = models.HRRole(_normalize_role(body["role"]))
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.delete("/{user_id}")
def delete_hr_user(
    user_id: int,
    hr_user: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    _require_admin(hr_user)
    if hr_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = tenant_filter(db.query(models.HRUser), models.HRUser, hr_user).filter(
        models.HRUser.id == user_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "inactive"
    db.commit()
    return {"message": "User deactivated"}


def _user_out(u: models.HRUser) -> dict:
    return {
        "id": u.id,
        "employeeId": u.employee_id,
        "name": u.name,
        "email": u.email,
        "role": u.role.value,
        "title": u.title,
        "department": u.department,
        "avatar": u.avatar,
        "status": u.status,
        "createdAt": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
    }
