import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TemplateCreate(BaseModel):
    user_id: uuid.UUID
    name: str | None = None
    description: str | None = None
    subject: str | None = None
    body_markdown: str | None = None


class TemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str | None
    description: str | None
    subject: str | None
    body_markdown: str | None
    created_at: datetime
    updated_at: datetime


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    subject: str | None = None
    body_markdown: str | None = None
