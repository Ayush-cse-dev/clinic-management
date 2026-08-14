from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import doctor as doctor_crud
from app.crud.user import get_user_by_email
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.doctor import DoctorCreate, DoctorOut, DoctorUpdate

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("", response_model=DoctorOut, status_code=status.HTTP_201_CREATED)
def add_doctor(
    payload: DoctorCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    if get_user_by_email(db, payload.email) and payload.create_login:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    try:
        return doctor_crud.create_doctor(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[DoctorOut])
def list_doctors(
    search: str | None = None,
    specialization: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist", "doctor", "patient")),
):
    return doctor_crud.list_doctors(db, search, specialization, skip, limit)


@router.get("/me", response_model=DoctorOut)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("doctor")),
):
    doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
    if not doctor:
        raise HTTPException(status_code=404, detail="No doctor profile linked to this account")
    return doctor


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist", "doctor", "patient")),
):
    doctor = doctor_crud.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(
    doctor_id: int,
    payload: DoctorUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    doctor = doctor_crud.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor_crud.update_doctor(db, doctor, payload)


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    doctor = doctor_crud.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor_crud.delete_doctor(db, doctor)
