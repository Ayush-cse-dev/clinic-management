from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import doctor as doctor_crud
from app.crud import patient as patient_crud
from app.dependencies.auth import get_current_user
from app.models.appointment import Appointment
from app.models.billing import Billing
from app.models.doctor import Doctor
from app.models.notification import Notification
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.dashboard import AdminDashboard, DoctorDashboard, PatientDashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/admin", response_model=AdminDashboard)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin", "receptionist"):
        raise HTTPException(status_code=403, detail="Not authorized")

    today = date.today().isoformat()

    paid_total = (
        db.query(func.coalesce(func.sum(Billing.amount), 0.0))
        .filter(Billing.status == "paid")
        .scalar()
    )
    pending_total = (
        db.query(func.coalesce(func.sum(Billing.amount), 0.0))
        .filter(Billing.status == "pending")
        .scalar()
    )

    return AdminDashboard(
        total_patients=db.query(Patient).count(),
        total_doctors=db.query(Doctor).count(),
        total_appointments=db.query(Appointment).count(),
        pending_appointments=db.query(Appointment)
        .filter(Appointment.status == "pending")
        .count(),
        completed_appointments=db.query(Appointment)
        .filter(Appointment.status == "completed")
        .count(),
        total_revenue=float(paid_total),
        pending_revenue=float(pending_total),
        todays_appointments=db.query(Appointment)
        .filter(Appointment.appointment_date == today)
        .count(),
    )


@router.get("/doctor", response_model=DoctorDashboard)
def doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    doctor = doctor_crud.get_doctor_by_user_id(db, current_user.id)
    if not doctor:
        raise HTTPException(status_code=404, detail="No doctor profile linked to this account")

    today = date.today().isoformat()

    return DoctorDashboard(
        todays_appointments=db.query(Appointment)
        .filter(Appointment.doctor_id == doctor.id, Appointment.appointment_date == today)
        .count(),
        upcoming_appointments=db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date >= today,
            Appointment.status.in_(["pending", "confirmed"]),
        )
        .count(),
        total_patients_seen=db.query(Appointment.patient_id)
        .filter(Appointment.doctor_id == doctor.id, Appointment.status == "completed")
        .distinct()
        .count(),
        pending_appointments=db.query(Appointment)
        .filter(Appointment.doctor_id == doctor.id, Appointment.status == "pending")
        .count(),
    )


@router.get("/patient", response_model=PatientDashboard)
def patient_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Not authorized")

    patient = patient_crud.get_patient_by_user_id(db, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="No patient profile linked to this account")

    today = date.today().isoformat()

    return PatientDashboard(
        upcoming_appointments=db.query(Appointment)
        .filter(
            Appointment.patient_id == patient.id,
            Appointment.appointment_date >= today,
            Appointment.status.in_(["pending", "confirmed"]),
        )
        .count(),
        total_appointments=db.query(Appointment)
        .filter(Appointment.patient_id == patient.id)
        .count(),
        total_prescriptions=db.query(Prescription)
        .filter(Prescription.patient_id == patient.id)
        .count(),
        pending_bills=db.query(Billing)
        .filter(Billing.patient_id == patient.id, Billing.status == "pending")
        .count(),
        unread_notifications=db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
        .count(),
    )
