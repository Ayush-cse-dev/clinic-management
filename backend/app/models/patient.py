from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True
    )

    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=True)
    phone = Column(String(30), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="patient_profile")
    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
    prescriptions = relationship(
        "Prescription", back_populates="patient", cascade="all, delete-orphan"
    )
    medical_records = relationship(
        "MedicalRecord", back_populates="patient", cascade="all, delete-orphan"
    )
    bills = relationship(
        "Billing", back_populates="patient", cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document", back_populates="patient", cascade="all, delete-orphan"
    )
