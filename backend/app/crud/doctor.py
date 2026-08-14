from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.security import hash_password
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import DoctorCreate, DoctorUpdate


def create_doctor(db: Session, payload: DoctorCreate) -> Doctor:
    linked_user = None
    if payload.create_login:
        if not payload.password:
            raise ValueError("password is required when create_login is true")
        linked_user = User(
            full_name=payload.full_name,
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
            role="doctor",
        )
        db.add(linked_user)
        db.flush()  # get linked_user.id without committing yet

    doctor = Doctor(
        full_name=payload.full_name,
        email=payload.email.lower(),
        phone=payload.phone,
        specialization=payload.specialization,
        experience_years=payload.experience_years,
        consultation_fee=payload.consultation_fee,
        availability=payload.availability,
        user_id=linked_user.id if linked_user else None,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def get_doctor(db: Session, doctor_id: int) -> Doctor | None:
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()


def get_doctor_by_user_id(db: Session, user_id: int) -> Doctor | None:
    return db.query(Doctor).filter(Doctor.user_id == user_id).first()


def list_doctors(
    db: Session, search: str | None = None, specialization: str | None = None,
    skip: int = 0, limit: int = 100,
) -> list[Doctor]:
    query = db.query(Doctor)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(Doctor.full_name.ilike(like), Doctor.email.ilike(like))
        )
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    return query.order_by(Doctor.id.desc()).offset(skip).limit(limit).all()


def update_doctor(db: Session, doctor: Doctor, payload: DoctorUpdate) -> Doctor:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


def delete_doctor(db: Session, doctor: Doctor) -> None:
    db.delete(doctor)
    db.commit()
