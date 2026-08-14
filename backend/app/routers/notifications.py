from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import notification as notification_crud
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def send_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    return notification_crud.create_notification(db, payload)


@router.get("", response_model=list[NotificationOut])
def list_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_crud.list_notifications_for_user(db, current_user.id)


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = notification_crud.get_notification(db, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your notification")
    return notification_crud.mark_as_read(db, notification)
