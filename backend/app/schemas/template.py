import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class TemplateCreateRequest(BaseModel):
    name: str
    subject: str
    body_markdown: str

    @field_validator("name", "subject", "body_markdown")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned


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


class TemplateUpdateRequest(BaseModel):
    name: str
    subject: str
    body_markdown: str

    @field_validator("name", "subject", "body_markdown")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned


class TemplateDeleteResult(BaseModel):
    deleted: bool
