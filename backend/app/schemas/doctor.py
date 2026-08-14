from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class DoctorBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = None
    specialization: str = Field(min_length=2, max_length=100)
    experience_years: int = Field(default=0, ge=0)
    consultation_fee: float = Field(default=0.0, ge=0)
    availability: str | None = None


class DoctorCreate(DoctorBase):
    # Optional: create a linked login account for this doctor at the same time.
    create_login: bool = False
    password: str | None = Field(default=None, min_length=6, max_length=128)


class DoctorUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    specialization: str | None = None
    experience_years: int | None = Field(default=None, ge=0)
    consultation_fee: float | None = Field(default=None, ge=0)
    availability: str | None = None


class DoctorOut(DoctorBase):
    id: int
    user_id: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
