from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    file_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")
