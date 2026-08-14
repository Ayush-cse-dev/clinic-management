from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import appointment as appointment_crud
from app.crud import doctor as doctor_crud
from app.crud import patient as patient_crud
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not patient_crud.get_patient(db, payload.patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    if not doctor_crud.get_doctor(db, payload.doctor_id):
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Patients may only book appointments for themselves.
    if current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        if not own_patient or own_patient.id != payload.patient_id:
            raise HTTPException(
                status_code=403, detail="You can only book appointments for yourself"
            )

    appointment = appointment_crud.create_appointment(db, payload)
    return appointment_crud.get_appointment(db, appointment.id)


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    patient_id: int | None = None,
    doctor_id: int | None = None,
    status: str | None = None,
    date: str | None = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Scope results for doctor/patient logins to their own data.
    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        doctor_id = own_doctor.id if own_doctor else -1
    elif current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        patient_id = own_patient.id if own_patient else -1

    return appointment_crud.list_appointments(
        db, patient_id, doctor_id, status, date, skip, limit
    )


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = appointment_crud.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        if not own_doctor or appointment.doctor_id != own_doctor.id:
            raise HTTPException(status_code=403, detail="Not your appointment")
    elif current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        if not own_patient or appointment.patient_id != own_patient.id:
            raise HTTPException(status_code=403, detail="Not your appointment")

    return appointment


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist", "doctor")),
):
    appointment = appointment_crud.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "doctor":
        own_doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
        if not own_doctor or appointment.doctor_id != own_doctor.id:
            raise HTTPException(status_code=403, detail="Not your appointment")

    appointment_crud.update_appointment(db, appointment, payload)
    return appointment_crud.get_appointment(db, appointment_id)


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    appointment = appointment_crud.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appointment_crud.delete_appointment(db, appointment)
