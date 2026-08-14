from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["pending", "paid"]


class BillingCreate(BaseModel):
    appointment_id: int
    amount: float = Field(ge=0)
    billing_date: str = Field(description="YYYY-MM-DD")
    payment_method: str | None = None


class BillingUpdate(BaseModel):
    amount: float | None = Field(default=None, ge=0)
    status: Status | None = None
    payment_method: str | None = None


class BillingOut(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    amount: float
    status: str
    payment_method: str | None = None
    billing_date: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
