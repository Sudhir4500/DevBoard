from pathlib import Path
from typing import Annotated
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings loaded from environment / .env.

    Attributes:
        PROJECT_NAME: Human-readable project name.
        API_V1_STR: API version prefix (e.g. '/api/v1').
        SECRET_KEY: Secret used for signing tokens.
        ACCESS_TOKEN_EXPIRE_MINUTES: Token expiry in minutes.
        DATABASE_URL: Database connection string.
        Debug: Enable debug mode (default: False).
    """
    PROJECT_NAME: Annotated[str, Field(..., description="Human-readable project name")]
    API_V1_STR: Annotated[str, Field(..., description="API prefix, e.g. '/api/v1'")]
    SECRET_KEY: Annotated[str, Field(..., description="Secret for cryptographic signing")]
    ACCESS_TOKEN_EXPIRE_MINUTES: Annotated[int, Field(..., description="Access token expiry (minutes)")]
    DATABASE_URL: Annotated[str, Field(..., description="Database connection URL")]
    DEBUG: Annotated[bool, Field(default=False, description="Enable debug mode")]
    # auto read from the backend/.env file regardless of the current working directory
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        case_sensitive=True,
    )

# Instantiate once: imported everywhere as a singleton
settings = Settings()