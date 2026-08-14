from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)

    diagnosis = Column(String(255), nullable=False)
    treatment = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    record_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor", back_populates="medical_records")
