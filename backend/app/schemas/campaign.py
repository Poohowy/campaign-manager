import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.db.enums import CampaignStatus


class CampaignCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    template_id: uuid.UUID
    customer_ids: list[uuid.UUID]

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Campaign name is required.")
        return cleaned


class CampaignRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    template_id: uuid.UUID | None
    template_name: str | None = None
    name: str
    status: CampaignStatus
    recipients_count: int = 0
    customer_ids: list[uuid.UUID] = Field(default_factory=list)
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    updated_at: datetime


class CampaignDeleteResult(BaseModel):
    deleted: bool
