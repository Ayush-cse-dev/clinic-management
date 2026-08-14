import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Central application settings, read from environment variables.

    Every value has a safe local-development default so the API runs
    out of the box with `uvicorn app.main:app --reload` and no extra
    setup. Override any of these via a `.env` file or real environment
    variables when deploying.
    """

    PROJECT_NAME: str = "Clinic Management System"

    # Defaults to a local SQLite file so the project runs with zero setup.
    # Point this at Postgres/MySQL/etc. in production, e.g.:
    #   postgresql://user:password@host:5432/dbname
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./clinic.db")

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "dev-secret-key-change-this-in-production-please"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # Comma-separated list of allowed frontend origins.
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))


settings = Settings()
