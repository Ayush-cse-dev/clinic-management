from pydantic import BaseModel


class AdminDashboard(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments: int
    pending_appointments: int
    completed_appointments: int
    total_revenue: float
    pending_revenue: float
    todays_appointments: int


class DoctorDashboard(BaseModel):
    todays_appointments: int
    upcoming_appointments: int
    total_patients_seen: int
    pending_appointments: int


class PatientDashboard(BaseModel):
    upcoming_appointments: int
    total_appointments: int
    total_prescriptions: int
    pending_bills: int
    unread_notifications: int
