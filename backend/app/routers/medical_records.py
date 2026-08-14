from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import doctor as doctor_crud
from app.crud import medical_record as record_crud
from app.crud import patient as patient_crud
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordOut

router = APIRouter(prefix="/medical-records", tags=["Medical Records"])


@router.post("", response_model=MedicalRecordOut, status_code=status.HTTP_201_CREATED)
def add_medical_record(
    payload: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor")),
):
    if not patient_crud.get_patient(db, payload.patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    if not doctor_crud.get_doctor(db, payload.doctor_id):
        raise HTTPException(status_code=404, detail="Doctor not found")

    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        if not own_doctor or payload.doctor_id != own_doctor.id:
            raise HTTPException(
                status_code=403, detail="You can only add records under your own name"
            )

    return record_crud.create_medical_record(db, payload)


@router.get("", response_model=list[MedicalRecordOut])
def list_medical_records(
    patient_id: int | None = None,
    doctor_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        doctor_id = own_doctor.id if own_doctor else -1
    elif current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        patient_id = own_patient.id if own_patient else -1

    return record_crud.list_medical_records(db, patient_id, doctor_id)


@router.get("/{record_id}", response_model=MedicalRecordOut)
def get_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = record_crud.get_medical_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")

    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        if not own_doctor or record.doctor_id != own_doctor.id:
            raise HTTPException(status_code=403, detail="Not your record")
    elif current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        if not own_patient or record.patient_id != own_patient.id:
            raise HTTPException(status_code=403, detail="Not your record")

    return record
