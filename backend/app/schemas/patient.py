from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class PatientBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    address: str | None = None
    emergency_contact: str | None = None


class PatientCreate(PatientBase):
    # Optional: create a linked login account for this patient at the same time.
    create_login: bool = False
    password: str | None = Field(default=None, min_length=6, max_length=128)


class PatientUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    address: str | None = None
    emergency_contact: str | None = None


class PatientOut(PatientBase):
    id: int
    user_id: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
