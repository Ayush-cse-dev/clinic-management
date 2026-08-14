import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# Use an isolated in-memory SQLite DB for tests.
TEST_DB_URL = "sqlite:///./test_clinic.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_clinic.db"):
        os.remove("./test_clinic.db")


client = TestClient(app)


def _register_admin():
    res = client.post(
        "/auth/register",
        json={
            "full_name": "Admin User",
            "email": "admin@test.com",
            "password": "password123",
            "role": "admin",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_register_and_login():
    token = _register_admin()
    assert token

    res = client.post(
        "/auth/login", json={"email": "admin@test.com", "password": "password123"}
    )
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "admin"


def test_register_duplicate_email_fails():
    _register_admin()
    res = client.post(
        "/auth/register",
        json={
            "full_name": "Someone Else",
            "email": "admin@test.com",
            "password": "password123",
            "role": "admin",
        },
    )
    assert res.status_code == 400


def test_full_clinic_flow():
    token = _register_admin()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a doctor
    res = client.post(
        "/doctors",
        headers=headers,
        json={
            "full_name": "Dr. Jane Smith",
            "email": "jane.smith@test.com",
            "specialization": "Cardiology",
            "experience_years": 8,
            "consultation_fee": 50.0,
        },
    )
    assert res.status_code == 201, res.text
    doctor_id = res.json()["id"]

    # Create a patient
    res = client.post(
        "/patients",
        headers=headers,
        json={"full_name": "John Doe", "phone": "1234567890"},
    )
    assert res.status_code == 201, res.text
    patient_id = res.json()["id"]

    # Book an appointment
    res = client.post(
        "/appointments",
        headers=headers,
        json={
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_date": "2026-09-01",
            "appointment_time": "10:00",
            "reason": "Checkup",
        },
    )
    assert res.status_code == 201, res.text
    appointment_id = res.json()["id"]
    assert res.json()["patient"]["full_name"] == "John Doe"
    assert res.json()["doctor"]["specialization"] == "Cardiology"

    # Add a prescription
    res = client.post(
        "/prescriptions",
        headers=headers,
        json={
            "appointment_id": appointment_id,
            "medicines": "Paracetamol 500mg",
            "instructions": "Twice daily after food",
        },
    )
    assert res.status_code == 201, res.text

    # Add a bill and mark it paid
    res = client.post(
        "/billing",
        headers=headers,
        json={
            "appointment_id": appointment_id,
            "amount": 50.0,
            "billing_date": "2026-09-01",
            "payment_method": "cash",
        },
    )
    assert res.status_code == 201, res.text
    bill_id = res.json()["id"]

    res = client.put(f"/billing/{bill_id}", headers=headers, json={"status": "paid"})
    assert res.status_code == 200
    assert res.json()["status"] == "paid"

    # Dashboard reflects the created data
    res = client.get("/dashboard/admin", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_patients"] >= 1
    assert data["total_doctors"] >= 1
    assert data["total_revenue"] >= 50.0


def test_unauthenticated_access_is_rejected():
    res = client.get("/patients")
    assert res.status_code == 401
