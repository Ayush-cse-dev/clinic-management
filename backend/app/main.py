from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.models import *  # noqa: F401,F403 - ensures all models are registered on Base.metadata
from app.routers import (
    appointments,
    auth,
    billing,
    dashboard,
    doctors,
    documents,
    medical_records,
    notifications,
    patients,
    prescriptions,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A complete clinic appointment and patient management API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(prescriptions.router)
app.include_router(medical_records.router)
app.include_router(billing.router)
app.include_router(documents.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
