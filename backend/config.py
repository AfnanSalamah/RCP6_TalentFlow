from pydantic_settings import BaseSettings
import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./talentflow.db"
    SECRET_KEY: str = "talentflow-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    OPENAI_API_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_EMAIL: str = ""
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = ""
    ALLOW_DEV_EMAIL_FALLBACK: bool = False
    ENVIRONMENT: str = "production"
    APP_NAME: str = "TalentFlow"
    # PORT: change this (or set PORT= in .env) to avoid WinError 10013 on Windows.
    # Windows reserves ports 49152-65535 for dynamic use; 8001 is reliably free.
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "ignore"


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
