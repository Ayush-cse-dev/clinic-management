from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import patient as patient_crud
from app.crud.user import get_user_by_email
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientOut, PatientUpdate

router = APIRouter(prefix="/patients", tags=["Patients"])


def _ensure_patient_access(current_user: User, patient_id: int, db: Session) -> None:
    """Patients may only access their own record; staff can access any."""
    if current_user.role in ("admin", "receptionist", "doctor"):
        return
    own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
    if not own_patient or own_patient.id != patient_id:
        raise HTTPException(status_code=403, detail="You can only access your own records")


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def add_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    if payload.email and payload.create_login and get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    try:
        return patient_crud.create_patient(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[PatientOut])
def list_patients(
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist", "doctor")),
):
    return patient_crud.list_patients(db, search, skip, limit)


@router.get("/me", response_model=PatientOut)
def get_my_patient_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("patient")),
):
    patient = patient_crud.get_patient_by_user_id(db, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="No patient profile linked to this account")
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_patient_access(current_user, patient_id, db)
    patient = patient_crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    patient = patient_crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient_crud.update_patient(db, patient, payload)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    patient = patient_crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_crud.delete_patient(db, patient)
