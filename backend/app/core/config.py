import json
from functools import lru_cache
from typing import Annotated, Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Campaign Manager API"
    environment: str = "development"
    database_url: str = (
        "postgresql+psycopg://postgres:your-db-password@db.your-project-ref.supabase.co:5432/postgres"
        "?sslmode=require"
    )
    cors_allowed_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    smtp_encryption_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def parse_cors_allowed_origins(cls, value: Any) -> Any:
        if isinstance(value, str):
            stripped_value = value.strip()
            if not stripped_value:
                return []

            if stripped_value.startswith("["):
                parsed_value = json.loads(stripped_value)
                if isinstance(parsed_value, list):
                    return [str(origin).strip() for origin in parsed_value if str(origin).strip()]

            return [origin.strip() for origin in stripped_value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
