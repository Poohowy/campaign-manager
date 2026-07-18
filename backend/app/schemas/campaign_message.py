import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.enums import CampaignMessageStatus


class CampaignMessageCreate(BaseModel):
    user_id: uuid.UUID
    campaign_id: uuid.UUID | None = None
    customer_id: uuid.UUID | None = None
    email: str | None = None
    subject: str | None = None
    body_markdown: str | None = None
    rendered_variables: dict[str, object] = Field(default_factory=dict)
    status: CampaignMessageStatus | None = None
    error_message: str | None = None
    sent_at: datetime | None = None


class CampaignMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    campaign_id: uuid.UUID | None
    customer_id: uuid.UUID | None
    email: str | None
    subject: str | None
    body_markdown: str | None
    rendered_variables: dict[str, object]
    status: CampaignMessageStatus | None
    error_message: str | None
    sent_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CampaignMessageUpdate(BaseModel):
    campaign_id: uuid.UUID | None = None
    customer_id: uuid.UUID | None = None
    email: str | None = None
    subject: str | None = None
    body_markdown: str | None = None
    rendered_variables: dict[str, object] | None = None
    status: CampaignMessageStatus | None = None
    error_message: str | None = None
    sent_at: datetime | None = None
