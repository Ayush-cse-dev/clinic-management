from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    id: int
    patient_id: int
    uploaded_by: int | None = None
    file_name: str
    file_type: str | None = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
