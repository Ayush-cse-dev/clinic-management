from sqlalchemy.orm import Session, joinedload

from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate


def create_appointment(db: Session, payload: AppointmentCreate) -> Appointment:
    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def get_appointment(db: Session, appointment_id: int) -> Appointment | None:
    return (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.doctor))
        .filter(Appointment.id == appointment_id)
        .first()
    )


def list_appointments(
    db: Session,
    patient_id: int | None = None,
    doctor_id: int | None = None,
    status: str | None = None,
    date: str | None = None,
    skip: int = 0,
    limit: int = 200,
) -> list[Appointment]:
    query = db.query(Appointment).options(
        joinedload(Appointment.patient), joinedload(Appointment.doctor)
    )
    if patient_id is not None:
        query = query.filter(Appointment.patient_id == patient_id)
    if doctor_id is not None:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status is not None:
        query = query.filter(Appointment.status == status)
    if date is not None:
        query = query.filter(Appointment.appointment_date == date)
    return (
        query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_appointment(
    db: Session, appointment: Appointment, payload: AppointmentUpdate
) -> Appointment:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


def delete_appointment(db: Session, appointment: Appointment) -> None:
    db.delete(appointment)
    db.commit()
