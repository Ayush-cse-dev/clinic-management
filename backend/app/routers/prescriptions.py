from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import appointment as appointment_crud
from app.crud import doctor as doctor_crud
from app.crud import patient as patient_crud
from app.crud import prescription as prescription_crud
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
def add_prescription(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor")),
):
    appointment = appointment_crud.get_appointment(db, payload.appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        if not own_doctor or appointment.doctor_id != own_doctor.id:
            raise HTTPException(
                status_code=403, detail="You can only prescribe for your own appointments"
            )

    return prescription_crud.create_prescription(db, appointment, payload)


@router.get("", response_model=list[PrescriptionOut])
def list_prescriptions(
    patient_id: int | None = None,
    doctor_id: int | None = None,
    appointment_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        doctor_id = own_doctor.id if own_doctor else -1
    elif current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        patient_id = own_patient.id if own_patient else -1

    return prescription_crud.list_prescriptions(
        db, patient_id, doctor_id, appointment_id
    )


@router.get("/{prescription_id}", response_model=PrescriptionOut)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prescription = prescription_crud.get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        if not own_doctor or prescription.doctor_id != own_doctor.id:
            raise HTTPException(status_code=403, detail="Not your prescription")
    elif current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        if not own_patient or prescription.patient_id != own_patient.id:
            raise HTTPException(status_code=403, detail="Not your prescription")

    return prescription
