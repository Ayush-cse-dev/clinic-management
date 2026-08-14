"""Run this once after installing dependencies to create the first admin account:

    python seed.py

It's safe to re-run - it skips creating the admin if one already exists.
"""

from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models import *  # noqa: F401,F403 - registers all models on Base.metadata
from app.models.user import User

Base.metadata.create_all(bind=engine)

ADMIN_EMAIL = "admin@clinic.com"
ADMIN_PASSWORD = "Admin@123"

db = SessionLocal()
try:
    existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if existing:
        print(f"Admin account already exists: {ADMIN_EMAIL}")
    else:
        admin = User(
            full_name="System Administrator",
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print("Admin account created:")
        print(f"  email:    {ADMIN_EMAIL}")
        print(f"  password: {ADMIN_PASSWORD}")
        print("Please log in and change this password in a real deployment.")
finally:
    db.close()
