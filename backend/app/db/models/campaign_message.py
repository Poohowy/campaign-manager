from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import CampaignMessageStatus
from app.db.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.campaign import Campaign
    from app.db.models.customer import Customer


class CampaignMessage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "campaign_messages"
    __table_args__ = (
        Index("ix_campaign_messages_campaign_id", "campaign_id"),
        Index("ix_campaign_messages_customer_id", "customer_id"),
        Index("ix_campaign_messages_status", "status"),
        Index("ix_campaign_messages_user_id", "user_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id"),
        nullable=True,
    )
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=True,
    )
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    subject: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    rendered_variables: Mapped[dict[str, object]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    status: Mapped[CampaignMessageStatus | None] = mapped_column(
        Enum(CampaignMessageStatus, name="campaign_message_status", native_enum=True),
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    campaign: Mapped[Campaign | None] = relationship(back_populates="campaign_messages")
    customer: Mapped[Customer | None] = relationship(back_populates="campaign_messages")
