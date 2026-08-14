from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Billing(Base):
    __tablename__ = "billing"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(
        Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(20), default="pending")  # pending, paid
    payment_method = Column(String(30), nullable=True)  # cash, card, upi, insurance
    billing_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="bill")
    patient = relationship("Patient", back_populates="bills")
