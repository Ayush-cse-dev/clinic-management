from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True
    )

    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    specialization = Column(String(100), nullable=False)
    experience_years = Column(Integer, default=0)
    consultation_fee = Column(Float, default=0.0)
    availability = Column(Text, nullable=True)  # e.g. "Mon-Fri 9AM-5PM"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")
    medical_records = relationship("MedicalRecord", back_populates="doctor")
