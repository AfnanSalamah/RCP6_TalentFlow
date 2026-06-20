from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from auth import get_current_applicant, get_current_hr_user
import models

router = APIRouter(prefix="/applicant/notifications", tags=["Notifications"])

# ─── Company / HR notification feed ────────────────────────────────────────────
# Surfaces the platform notifications a Super Admin sends (Issue 8) to the HR
# users of the targeted company. A notification reaches a company when it is
# broadcast to all companies (company_id IS NULL / recipient_scope all_companies)
# or explicitly targeted at that company_id.
hr_router = APIRouter(prefix="/hr/notifications", tags=["Notifications"])


def _hr_recipient_role(current: models.HRUser) -> str:
    role = getattr(current.role, "value", current.role)
    return "interviewer" if role == "interviewer" else "hr_manager"


def _company_notif_query(db: Session, company_id):
    return db.query(models.Notification).filter(or_(
        models.Notification.company_id == None,  # noqa: E711  broadcast to all companies
        models.Notification.company_id == company_id,
    ))


def _hr_visible_notif_query(db: Session, current: models.HRUser):
    role = _hr_recipient_role(current)
    query = _company_notif_query(db, current.company_id).filter(or_(
        models.Notification.recipient_user_id == current.id,
        models.Notification.recipient_role == role,
        models.Notification.recipient_scope.in_(["all_companies", "specific_company", "company_admins"]),
    )).filter(
        models.Notification.recipient_role != "candidate",
        models.Notification.recipient_role != "super_admin",
    )
    if current.created_at:
        query = query.filter(or_(
            models.Notification.created_at >= current.created_at,
            (
                (models.Notification.recipient_user_id == current.id) &
                (models.Notification.type == "welcome")
            ),
        ))
    return query


def _candidate_visible_notif_query(db: Session, current: models.Applicant):
    query = db.query(models.Notification).filter(or_(
        models.Notification.recipient_user_id == current.id,
        models.Notification.applicant_id == current.id,
    )).filter(or_(
        models.Notification.recipient_role == "candidate",
        models.Notification.recipient_role == "",
        models.Notification.recipient_role == None,  # noqa: E711
    ))
    if current.created_at:
        query = query.filter(or_(
            models.Notification.created_at >= current.created_at,
            (
                (models.Notification.recipient_user_id == current.id) &
                (models.Notification.type == "welcome")
            ),
        ))
    return query


@hr_router.get("")
def hr_list_notifications(
    current: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    rows = _hr_visible_notif_query(db, current).order_by(
        models.Notification.created_at.desc()
    ).limit(100).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "company_id": n.company_id,
            "recipient_scope": n.recipient_scope,
            "recipient_role": n.recipient_role,
            "notification_category": n.notification_category,
            "is_read": bool(n.is_read),
            "link": n.link,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else "",
        }
        for n in rows
    ]


@hr_router.get("/unread-count")
def hr_unread_count(
    current: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    count = _hr_visible_notif_query(db, current).filter(
        models.Notification.is_read == False  # noqa: E712
    ).count()
    return {"unread": count}


@hr_router.patch("/mark-all-read")
def hr_mark_all_read(
    current: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    _hr_visible_notif_query(db, current).filter(
        models.Notification.is_read == False  # noqa: E712
    ).update({"is_read": True, "read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All marked as read"}


@hr_router.patch("/{notif_id}/read")
def hr_mark_read(
    notif_id: int,
    current: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    notif = _hr_visible_notif_query(db, current).filter(
        models.Notification.id == notif_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@hr_router.patch("/mark-all-read")
def hr_mark_all_read_legacy(
    current: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    _hr_visible_notif_query(db, current).filter(
        models.Notification.is_read == False  # noqa: E712
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All marked as read"}


@hr_router.delete("/{notif_id}")
def hr_delete_notification(
    notif_id: int,
    current: models.HRUser = Depends(get_current_hr_user),
    db: Session = Depends(get_db),
):
    notif = _hr_visible_notif_query(db, current).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}


@router.get("")
def get_notifications(
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    _ensure_contract_notifications(current, db)
    notifs = _candidate_visible_notif_query(db, current).order_by(
        models.Notification.created_at.desc()
    ).limit(50).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "read": n.read,
            "is_read": bool(n.is_read or n.read),
            "notification_category": n.notification_category,
            "link": n.link,
            "time": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else "",
        }
        for n in notifs
    ]


def _ensure_contract_notifications(current: models.Applicant, db: Session):
    contracts = db.query(models.Contract).filter(
        (models.Contract.applicant_id == current.id) |
        (models.Contract.candidate_email.ilike(current.email))
    ).all()
    changed = False
    for contract in contracts:
        contract_link = f"/user/contracts?contract={contract.id}"
        if contract.applicant_id is None:
            contract.applicant_id = current.id
            changed = True

        exists = db.query(models.Notification.id).filter(
            models.Notification.applicant_id == current.id,
            models.Notification.link == contract_link,
            models.Notification.type.in_(["contract", "offer"]),
        ).first()
        if exists:
            continue

        is_offer = (contract.document_type or "").lower() == "offer"
        db.add(models.Notification(
            applicant_id=current.id,
            recipient_user_id=current.id,
            recipient_role="candidate",
            notification_category="offer" if is_offer else "contract",
            recipient_scope="applicant",
            type="offer" if is_offer else "contract",
            title="You received an offer" if is_offer else "Contract ready to sign",
            message=f"{contract.title} is ready. Review it under My Contracts.",
            link=contract_link,
        ))
        changed = True

    if changed:
        db.commit()


@router.patch("/mark-all-read")
def mark_all_read(
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    _candidate_visible_notif_query(db, current).filter(
        models.Notification.read == False,
    ).update({"read": True, "is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All marked as read"}


@router.patch("/{notif_id}/read")
def mark_read(
    notif_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    notif = _candidate_visible_notif_query(db, current).filter(models.Notification.id == notif_id).first()
    if notif:
        notif.read = True
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.patch("/mark-all-read")
def mark_all_read_legacy(
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    _candidate_visible_notif_query(db, current).filter(
        models.Notification.read == False,
    ).update({"read": True, "is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All marked as read"}


@router.delete("/{notif_id}")
def delete_notification(
    notif_id: int,
    current: models.Applicant = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    notif = _candidate_visible_notif_query(db, current).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
