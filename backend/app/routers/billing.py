from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import appointment as appointment_crud
from app.crud import billing as billing_crud
from app.crud import patient as patient_crud
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles
from app.models.user import User
from app.schemas.billing import BillingCreate, BillingOut, BillingUpdate

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.post("", response_model=BillingOut, status_code=status.HTTP_201_CREATED)
def add_bill(
    payload: BillingCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    appointment = appointment_crud.get_appointment(db, payload.appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return billing_crud.create_bill(db, appointment, payload)


@router.get("", response_model=list[BillingOut])
def list_bills(
    patient_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        patient_id = own_patient.id if own_patient else -1
    elif current_user.role == "doctor":
        raise HTTPException(status_code=403, detail="Doctors cannot view billing records")

    return billing_crud.list_bills(db, patient_id, status)


@router.get("/{bill_id}", response_model=BillingOut)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bill = billing_crud.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if current_user.role == "patient":
        own_patient = patient_crud.get_patient_by_user_id(db, current_user.id)
        if not own_patient or bill.patient_id != own_patient.id:
            raise HTTPException(status_code=403, detail="Not your bill")
    elif current_user.role == "doctor":
        raise HTTPException(status_code=403, detail="Doctors cannot view billing records")

    return bill


@router.put("/{bill_id}", response_model=BillingOut)
def update_bill(
    bill_id: int,
    payload: BillingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "receptionist")),
):
    bill = billing_crud.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return billing_crud.update_bill(db, bill, payload)
