import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.enums import CampaignStatus


class CampaignCreate(BaseModel):
    user_id: uuid.UUID
    template_id: uuid.UUID | None = None
    name: str | None = None
    status: CampaignStatus | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None


class CampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    template_id: uuid.UUID | None
    name: str | None
    status: CampaignStatus | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    updated_at: datetime


class CampaignUpdate(BaseModel):
    template_id: uuid.UUID | None = None
    name: str | None = None
    status: CampaignStatus | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
