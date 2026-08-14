from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """Login account. Role decides what the account can do:
    - admin: full access
    - receptionist: manage patients, doctors, appointments, billing
    - doctor: linked to a Doctor profile; manages own appointments/records
    - patient: linked to a Patient profile; books appointments, views own data
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="receptionist")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor_profile = relationship(
        "Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    patient_profile = relationship(
        "Patient", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
