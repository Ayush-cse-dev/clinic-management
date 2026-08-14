from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["pending", "confirmed", "completed", "cancelled"]


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: str = Field(description="YYYY-MM-DD")
    appointment_time: str = Field(description="HH:MM")
    reason: str | None = None


class AppointmentUpdate(BaseModel):
    appointment_date: str | None = None
    appointment_time: str | None = None
    reason: str | None = None
    status: Status | None = None
    notes: str | None = None


class DoctorMini(BaseModel):
    id: int
    full_name: str
    specialization: str

    model_config = ConfigDict(from_attributes=True)


class PatientMini(BaseModel):
    id: int
    full_name: str
    phone: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: str
    appointment_time: str
    reason: str | None = None
    status: str
    notes: str | None = None
    created_at: datetime
    patient: PatientMini | None = None
    doctor: DoctorMini | None = None

    model_config = ConfigDict(from_attributes=True)
