from sqlalchemy.orm import Session

from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import MedicalRecordCreate


def create_medical_record(db: Session, payload: MedicalRecordCreate) -> MedicalRecord:
    record = MedicalRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_medical_record(db: Session, record_id: int) -> MedicalRecord | None:
    return db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()


def list_medical_records(
    db: Session,
    patient_id: int | None = None,
    doctor_id: int | None = None,
    skip: int = 0,
    limit: int = 200,
) -> list[MedicalRecord]:
    query = db.query(MedicalRecord)
    if patient_id is not None:
        query = query.filter(MedicalRecord.patient_id == patient_id)
    if doctor_id is not None:
        query = query.filter(MedicalRecord.doctor_id == doctor_id)
    return query.order_by(MedicalRecord.id.desc()).offset(skip).limit(limit).all()
