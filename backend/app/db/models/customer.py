from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Index, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.campaign_message import CampaignMessage


class Customer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("user_id", "external_id", name="uq_customers_user_external_id"),
        Index("ix_customers_user_id", "user_id"),
        Index("ix_customers_user_email", "user_id", "email"),
        Index("ix_customers_user_company_name", "user_id", "company_name"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    external_id: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    company_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[dict[str, object]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    campaign_messages: Mapped[list[CampaignMessage]] = relationship(
        back_populates="customer",
        cascade="all, delete-orphan",
    )
