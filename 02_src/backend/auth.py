from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from config import settings
import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def is_expired(expires_at: Optional[datetime]) -> bool:
    if not expires_at:
        return True
    now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.utcnow()
    return now > expires_at


# ─── HR auth dependency ───────────────────────────────────────────────────────

def get_current_hr_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.HRUser:
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if not credentials:
        raise exc
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "hr":
        raise exc
    user = db.query(models.HRUser).filter(models.HRUser.id == payload.get("sub")).first()
    if not user:
        raise exc
    return user


# ─── Multi-tenant scoping helpers ─────────────────────────────────────────────

def tenant_filter(query, model, hr_user: "models.HRUser"):
    """Restrict a query to the HR user's company.

    Super admins / platform owners have company_id == None and are intentionally
    *not* scoped — they can see across tenants (and normally use the Super Admin
    portal). Every other HR role is hard-scoped to their own company, which is
    the core of tenant isolation.
    """
    cid = getattr(hr_user, "company_id", None)
    if cid is not None:
        query = query.filter(model.company_id == cid)
    return query


def get_current_company_id(
    hr_user: "models.HRUser" = Depends(get_current_hr_user),
) -> int:
    """Dependency that returns the caller's company_id, rejecting tenant-less
    accounts. Use on endpoints that must always operate inside one tenant."""
    cid = getattr(hr_user, "company_id", None)
    if cid is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not associated with a company",
        )
    return cid


# ─── Applicant auth dependency ────────────────────────────────────────────────

def get_current_applicant(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Applicant:
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if not credentials:
        raise exc
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "applicant":
        raise exc
    applicant = db.query(models.Applicant).filter(models.Applicant.id == payload.get("sub")).first()
    if not applicant or not applicant.is_active:
        raise exc
    return applicant


# ─── Super Admin auth dependency ──────────────────────────────────────────────

def _hr_role_value(user) -> Optional[str]:
    if not user:
        return None
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def get_current_super_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Authorize Super Admin access.

    Accepts EITHER:
      • a legacy SuperAdmin-table token  (type == "super_admin"), or
      • an HR-user token whose role is "super_admin" (type == "hr").

    This lets the platform owner sign in through the same unified login page
    as everyone else, while company admins (role "admin"/"hr_manager"/etc.)
    are rejected — enforcing RBAC on every /super-admin/* route.
    """
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Super Admin access required")
    if not credentials:
        raise exc
    payload = decode_token(credentials.credentials)
    if not payload:
        raise exc

    ttype = payload.get("type")

    # Legacy dedicated SuperAdmin table
    if ttype == "super_admin":
        sa = db.query(models.SuperAdmin).filter(models.SuperAdmin.id == int(payload.get("sub", 0))).first()
        if sa and sa.is_active:
            return sa
        raise exc

    # HR user with super_admin role (unified login path)
    if ttype == "hr":
        user = db.query(models.HRUser).filter(models.HRUser.id == int(payload.get("sub", 0))).first()
        if user and user.status == "active" and _hr_role_value(user) == "super_admin":
            return user

    raise exc
