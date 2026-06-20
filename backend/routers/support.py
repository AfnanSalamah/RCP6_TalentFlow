"""Support Center — candidates & employees raise tickets to platform (Super Admin).

Users (candidates via applicant token, employees via HR token) create tickets and
chat in a thread; every ticket lands in the Super Admin's Support Management page.
Unread flags on each ticket drive the notification badges (polled by the client,
so updates appear without a manual page refresh). All data lives in SQLite.
"""
import os
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, not_

from database import get_db
from auth import decode_token, get_current_super_admin
from config import settings
import models

log = logging.getLogger("talentflow.support")
_bearer = HTTPBearer(auto_error=False)

user_router = APIRouter(prefix="/support", tags=["Support Center"])
admin_router = APIRouter(prefix="/super-admin/support", tags=["Support Center (Admin)"])

VALID_CATEGORIES = {
    "Technical Issue", "Login Issue", "Resume Issue", "Contract Issue",
    "Interview Issue", "Account Issue", "General Support",
}
VALID_PRIORITIES = {"Low", "Medium", "High", "Urgent"}


# ─── Combined requester auth (HR user OR candidate) ─────────────────────────────

def get_support_requester(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> dict:
    """Authenticate either an HR (employee) token or an applicant (candidate)
    token, returning a normalised requester descriptor."""
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if not credentials:
        raise exc
    payload = decode_token(credentials.credentials)
    if not payload:
        raise exc
    ttype, sub = payload.get("type"), payload.get("sub")
    if ttype == "hr":
        u = db.query(models.HRUser).filter(models.HRUser.id == int(sub or 0)).first()
        if not u:
            raise exc
        return {"type": "hr", "id": u.id, "name": u.name, "email": u.email, "company_id": u.company_id}
    if ttype == "applicant":
        a = db.query(models.Applicant).filter(models.Applicant.id == int(sub or 0)).first()
        if not a:
            raise exc
        return {"type": "candidate", "id": a.id, "name": a.name, "email": a.email, "company_id": None}
    raise exc


# ─── Schemas ────────────────────────────────────────────────────────────────────

class CreateTicket(BaseModel):
    subject: str
    message: str
    category: str = "General Support"
    priority: str = "Medium"


class AddMessage(BaseModel):
    message: str


class StatusUpdate(BaseModel):
    status: str


# ─── Serializers ────────────────────────────────────────────────────────────────

def _attachment_out(a: models.SupportAttachment) -> dict:
    rel = a.file_path.replace("\\", "/")
    idx = rel.find("/uploads/")
    url = rel[idx:] if idx != -1 else f"/uploads/{os.path.basename(rel)}"
    return {"id": a.id, "fileName": a.file_name, "fileSizeKb": a.file_size_kb, "url": url}


def _message_out(m: models.TicketMessage) -> dict:
    return {
        "id": m.id,
        "senderType": m.sender_type,
        "senderName": m.sender_name,
        "message": m.message,
        "isRead": bool(m.is_read),
        "createdAt": m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else "",
        "attachments": [_attachment_out(a) for a in m.attachments],
    }


def _ticket_out(t: models.SupportTicket, with_messages: bool = False) -> dict:
    out = {
        "id": t.id,
        "subject": t.subject,
        "category": t.category,
        "priority": t.priority,
        "status": t.status,
        "requesterType": t.requester_type,
        "requesterName": t.requester_name,
        "requesterEmail": t.requester_email,
        "unreadForUser": bool(t.unread_for_user),
        "unreadForAdmin": bool(t.unread_for_admin),
        "createdAt": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "",
        "lastMessageAt": t.last_message_at.strftime("%Y-%m-%d %H:%M") if t.last_message_at else "",
        "messageCount": len(t.messages),
    }
    if with_messages:
        out["messages"] = [_message_out(m) for m in t.messages]
    return out


# ═══════════════════════════════ USER SIDE ═══════════════════════════════════════

@user_router.post("/tickets", status_code=201)
def create_ticket(body: CreateTicket, req=Depends(get_support_requester), db: Session = Depends(get_db)):
    category = body.category if body.category in VALID_CATEGORIES else "General Support"
    priority = body.priority if body.priority in VALID_PRIORITIES else "Medium"
    ticket = models.SupportTicket(
        company_id=req.get("company_id"),
        subject=body.subject.strip() or "(no subject)",
        message=body.message.strip(),
        category=category,
        priority=priority,
        status="Open",
        requester_type=req["type"],
        requester_id=req["id"],
        requester_name=req["name"],
        requester_email=req["email"],
        unread_for_admin=True,
        unread_for_user=False,
        last_message_at=datetime.utcnow(),
    )
    db.add(ticket)
    db.flush()
    db.add(models.TicketMessage(
        ticket_id=ticket.id, sender_type="user", sender_name=req["name"],
        message=body.message.strip(), is_read=False,
    ))
    db.commit()
    db.refresh(ticket)
    log.info("[SUPPORT] New ticket #%s from %s (%s)", ticket.id, req["name"], req["type"])
    return _ticket_out(ticket, with_messages=True)


@user_router.get("/tickets")
def my_tickets(req=Depends(get_support_requester), db: Session = Depends(get_db)):
    q = db.query(models.SupportTicket).filter(
        models.SupportTicket.requester_type == req["type"],
        models.SupportTicket.requester_id == req["id"],
    )
    if req["type"] == "candidate":
        q = q.filter(models.SupportTicket.company_id == None)  # noqa: E711
    rows = q.order_by(models.SupportTicket.last_message_at.desc()).all()
    return [_ticket_out(t) for t in rows]


@user_router.get("/unread-count")
def my_unread(req=Depends(get_support_requester), db: Session = Depends(get_db)):
    q = db.query(models.SupportTicket).filter(
        models.SupportTicket.requester_type == req["type"],
        models.SupportTicket.requester_id == req["id"],
        models.SupportTicket.unread_for_user == True,  # noqa: E712
    )
    if req["type"] == "candidate":
        q = q.filter(models.SupportTicket.company_id == None)  # noqa: E711
    n = q.count()
    return {"unread": n}


@user_router.get("/tickets/{ticket_id}")
def get_my_ticket(ticket_id: int, req=Depends(get_support_requester), db: Session = Depends(get_db)):
    t = _owned_ticket(db, ticket_id, req)
    # Viewing clears the user's unread flag and marks admin messages read.
    t.unread_for_user = False
    for m in t.messages:
        if m.sender_type == "super_admin" and not m.is_read:
            m.is_read = True
    db.commit()
    return _ticket_out(t, with_messages=True)


@user_router.post("/tickets/{ticket_id}/messages", status_code=201)
def user_reply(ticket_id: int, body: AddMessage, req=Depends(get_support_requester), db: Session = Depends(get_db)):
    t = _owned_ticket(db, ticket_id, req)
    db.add(models.TicketMessage(
        ticket_id=t.id, sender_type="user", sender_name=req["name"],
        message=body.message.strip(), is_read=False,
    ))
    t.unread_for_admin = True
    t.last_message_at = datetime.utcnow()
    if t.status in ("Resolved", "Closed"):
        t.status = "Open"      # a new user message reopens a resolved/closed ticket
    db.commit()
    db.refresh(t)
    return _ticket_out(t, with_messages=True)


@user_router.post("/tickets/{ticket_id}/attachments", status_code=201)
async def upload_attachment(ticket_id: int, file: UploadFile = File(...),
                            req=Depends(get_support_requester), db: Session = Depends(get_db)):
    t = _owned_ticket(db, ticket_id, req)
    content = await file.read()
    size_kb = len(content) // 1024
    if size_kb > settings.MAX_UPLOAD_SIZE_MB * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")
    folder = os.path.join(settings.UPLOAD_DIR, "support", f"ticket_{t.id}")
    os.makedirs(folder, exist_ok=True)
    safe = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
    path = os.path.join(folder, safe)
    with open(path, "wb") as f:
        f.write(content)
    # Attach to the requester's most recent message (or a standalone note).
    last_msg = db.query(models.TicketMessage).filter(
        models.TicketMessage.ticket_id == t.id, models.TicketMessage.sender_type == "user"
    ).order_by(models.TicketMessage.created_at.desc()).first()
    att = models.SupportAttachment(
        ticket_id=t.id, message_id=last_msg.id if last_msg else None,
        file_name=file.filename, file_path=path, file_size_kb=size_kb,
    )
    db.add(att)
    t.unread_for_admin = True
    t.last_message_at = datetime.utcnow()
    db.commit()
    db.refresh(att)
    return _attachment_out(att)


# ═══════════════════════════════ SUPER ADMIN SIDE ════════════════════════════════

@admin_router.get("/tickets")
def all_tickets(status_filter: str = "", db: Session = Depends(get_db),
                sa: models.SuperAdmin = Depends(get_current_super_admin)):
    # Only Support Center tickets (requester set) — company tickets stay on their page.
    q = db.query(models.SupportTicket).filter(
        models.SupportTicket.requester_type.in_(["candidate", "hr"]),
        not_(and_(
            models.SupportTicket.requester_type == "candidate",
            models.SupportTicket.company_id != None,  # noqa: E711
        )),
    )
    if status_filter:
        q = q.filter(models.SupportTicket.status == status_filter)
    rows = q.order_by(models.SupportTicket.last_message_at.desc()).all()
    return [_ticket_out(t) for t in rows]


@admin_router.get("/unread-count")
def admin_unread(db: Session = Depends(get_db), sa: models.SuperAdmin = Depends(get_current_super_admin)):
    n = db.query(models.SupportTicket).filter(
        models.SupportTicket.requester_type.in_(["candidate", "hr"]),
        not_(and_(
            models.SupportTicket.requester_type == "candidate",
            models.SupportTicket.company_id != None,  # noqa: E711
        )),
        models.SupportTicket.unread_for_admin == True,  # noqa: E712
    ).count()
    return {"unread": n}


@admin_router.get("/tickets/{ticket_id}")
def admin_get_ticket(ticket_id: int, db: Session = Depends(get_db),
                     sa: models.SuperAdmin = Depends(get_current_super_admin)):
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    t.unread_for_admin = False
    for m in t.messages:
        if m.sender_type == "user" and not m.is_read:
            m.is_read = True
    db.commit()
    return _ticket_out(t, with_messages=True)


@admin_router.post("/tickets/{ticket_id}/messages", status_code=201)
def admin_reply(ticket_id: int, body: AddMessage, db: Session = Depends(get_db),
                sa: models.SuperAdmin = Depends(get_current_super_admin)):
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    sa_name = getattr(sa, "name", None) or "Support Team"
    db.add(models.TicketMessage(
        ticket_id=t.id, sender_type="super_admin", sender_name=sa_name,
        message=body.message.strip(), is_read=False,
    ))
    t.unread_for_user = True       # user gets a notification badge
    t.last_message_at = datetime.utcnow()
    if t.status == "Open":
        t.status = "In Progress"
    db.commit()
    db.refresh(t)
    return _ticket_out(t, with_messages=True)


@admin_router.put("/tickets/{ticket_id}/status")
def admin_set_status(ticket_id: int, body: StatusUpdate, db: Session = Depends(get_db),
                     sa: models.SuperAdmin = Depends(get_current_super_admin)):
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    allowed = {"Open", "In Progress", "Resolved", "Closed"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    t.status = body.status
    t.unread_for_user = True   # status changes notify the user
    db.commit()
    return {"message": "Status updated", "status": t.status}


# ─── Helpers ────────────────────────────────────────────────────────────────────

def _owned_ticket(db: Session, ticket_id: int, req: dict) -> models.SupportTicket:
    t = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id,
        models.SupportTicket.requester_type == req["type"],
        models.SupportTicket.requester_id == req["id"],
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return t
