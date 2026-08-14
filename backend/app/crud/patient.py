from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.security import hash_password
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate


def create_patient(db: Session, payload: PatientCreate) -> Patient:
    linked_user = None
    if payload.create_login:
        if not payload.password:
            raise ValueError("password is required when create_login is true")
        if not payload.email:
            raise ValueError("email is required when create_login is true")
        linked_user = User(
            full_name=payload.full_name,
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
            role="patient",
        )
        db.add(linked_user)
        db.flush()

    patient = Patient(
        full_name=payload.full_name,
        email=payload.email.lower() if payload.email else None,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        blood_group=payload.blood_group,
        address=payload.address,
        emergency_contact=payload.emergency_contact,
        user_id=linked_user.id if linked_user else None,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def get_patient(db: Session, patient_id: int) -> Patient | None:
    return db.query(Patient).filter(Patient.id == patient_id).first()


def get_patient_by_user_id(db: Session, user_id: int) -> Patient | None:
    return db.query(Patient).filter(Patient.user_id == user_id).first()


def list_patients(
    db: Session, search: str | None = None, skip: int = 0, limit: int = 100
) -> list[Patient]:
    query = db.query(Patient)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(Patient.full_name.ilike(like), Patient.phone.ilike(like), Patient.email.ilike(like))
        )
    return query.order_by(Patient.id.desc()).offset(skip).limit(limit).all()


def update_patient(db: Session, patient: Patient, payload: PatientUpdate) -> Patient:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


def delete_patient(db: Session, patient: Patient) -> None:
    db.delete(patient)
    db.commit()
