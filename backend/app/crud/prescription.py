from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate


def create_prescription(
    db: Session, appointment: Appointment, payload: PrescriptionCreate
) -> Prescription:
    prescription = Prescription(
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        medicines=payload.medicines,
        instructions=payload.instructions,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


def get_prescription(db: Session, prescription_id: int) -> Prescription | None:
    return db.query(Prescription).filter(Prescription.id == prescription_id).first()


def list_prescriptions(
    db: Session,
    patient_id: int | None = None,
    doctor_id: int | None = None,
    appointment_id: int | None = None,
    skip: int = 0,
    limit: int = 200,
) -> list[Prescription]:
    query = db.query(Prescription)
    if patient_id is not None:
        query = query.filter(Prescription.patient_id == patient_id)
    if doctor_id is not None:
        query = query.filter(Prescription.doctor_id == doctor_id)
    if appointment_id is not None:
        query = query.filter(Prescription.appointment_id == appointment_id)
    return query.order_by(Prescription.id.desc()).offset(skip).limit(limit).all()
