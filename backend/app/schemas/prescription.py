from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionCreate(BaseModel):
    appointment_id: int
    medicines: str = Field(min_length=1)
    instructions: str | None = None


class PrescriptionOut(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    doctor_id: int
    medicines: str
    instructions: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
