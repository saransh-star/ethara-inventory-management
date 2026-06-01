import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@db:5432/inventory"
    )
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    class Config:
        env_file = ".env"

settings = Settings()
