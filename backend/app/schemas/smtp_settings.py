import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SMTPSettingsCreate(BaseModel):
    user_id: uuid.UUID
    host: str | None = None
    port: int | None = None
    username: str | None = None
    password_encrypted: str | None = None
    from_name: str | None = None
    from_email: str | None = None


class SMTPSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    host: str | None
    port: int | None
    username: str | None
    password_encrypted: str | None
    from_name: str | None
    from_email: str | None
    created_at: datetime
    updated_at: datetime


class SMTPSettingsUpdate(BaseModel):
    host: str | None = None
    port: int | None = None
    username: str | None = None
    password_encrypted: str | None = None
    from_name: str | None = None
    from_email: str | None = None
