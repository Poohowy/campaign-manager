import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CustomerCreate(BaseModel):
    user_id: uuid.UUID
    external_id: str
    email: str
    company_name: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    custom_fields: dict[str, object] = Field(default_factory=dict)


class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    external_id: str
    email: str
    company_name: str | None
    contact_name: str | None
    phone: str | None
    custom_fields: dict[str, object]
    created_at: datetime
    updated_at: datetime


class CustomerUpdate(BaseModel):
    external_id: str | None = None
    email: str | None = None
    company_name: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    custom_fields: dict[str, object] | None = None
