from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.billing import Billing
from app.schemas.billing import BillingCreate, BillingUpdate


def create_bill(db: Session, appointment: Appointment, payload: BillingCreate) -> Billing:
    bill = Billing(
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        amount=payload.amount,
        billing_date=payload.billing_date,
        payment_method=payload.payment_method,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


def get_bill(db: Session, bill_id: int) -> Billing | None:
    return db.query(Billing).filter(Billing.id == bill_id).first()


def list_bills(
    db: Session,
    patient_id: int | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 200,
) -> list[Billing]:
    query = db.query(Billing)
    if patient_id is not None:
        query = query.filter(Billing.patient_id == patient_id)
    if status is not None:
        query = query.filter(Billing.status == status)
    return query.order_by(Billing.id.desc()).offset(skip).limit(limit).all()


def update_bill(db: Session, bill: Billing, payload: BillingUpdate) -> Billing:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(bill, field, value)
    db.commit()
    db.refresh(bill)
    return bill
