from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate


def create_notification(db: Session, payload: NotificationCreate) -> Notification:
    notification = Notification(**payload.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_notification(db: Session, notification_id: int) -> Notification | None:
    return db.query(Notification).filter(Notification.id == notification_id).first()


def list_notifications_for_user(db: Session, user_id: int) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.id.desc())
        .all()
    )


def mark_as_read(db: Session, notification: Notification) -> Notification:
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
