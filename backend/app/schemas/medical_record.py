from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MedicalRecordCreate(BaseModel):
    patient_id: int
    doctor_id: int
    diagnosis: str = Field(min_length=1, max_length=255)
    treatment: str | None = None
    notes: str | None = None
    record_date: str = Field(description="YYYY-MM-DD")


class MedicalRecordOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    diagnosis: str
    treatment: str | None = None
    notes: str | None = None
    record_date: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
