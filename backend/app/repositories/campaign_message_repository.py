import uuid

from sqlalchemy import Select, func, select

from app.db.models import CampaignMessage
from app.repositories.base import BaseRepository


class CampaignMessageRepository(BaseRepository[CampaignMessage]):
    model = CampaignMessage

    def create_many(self, values: list[dict[str, object]]) -> list[CampaignMessage]:
        entities = [CampaignMessage(**item) for item in values]
        self.session.add_all(entities)
        self.session.flush()
        for entity in entities:
            self.session.refresh(entity)
        return entities

    def count_by_campaign_id(self, user_id: uuid.UUID, campaign_id: uuid.UUID) -> int:
        stmt = select(func.count(CampaignMessage.id)).where(
            CampaignMessage.user_id == user_id,
            CampaignMessage.campaign_id == campaign_id,
        )
        return int(self.session.scalar(stmt) or 0)

    def count_by_campaign_ids(
        self,
        user_id: uuid.UUID,
        campaign_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, int]:
        if not campaign_ids:
            return {}

        stmt: Select[tuple[uuid.UUID, int]] = (
            select(
                CampaignMessage.campaign_id,
                func.count(CampaignMessage.id),
            )
            .where(
                CampaignMessage.user_id == user_id,
                CampaignMessage.campaign_id.in_(campaign_ids),
            )
            .group_by(CampaignMessage.campaign_id)
        )
        rows = self.session.execute(stmt).all()
        return {
            campaign_id: int(count)
            for campaign_id, count in rows
            if campaign_id is not None
        }

    def list_customer_ids_by_campaign(
        self,
        user_id: uuid.UUID,
        campaign_id: uuid.UUID,
    ) -> list[uuid.UUID]:
        stmt: Select[tuple[uuid.UUID | None]] = select(CampaignMessage.customer_id).where(
            CampaignMessage.user_id == user_id,
            CampaignMessage.campaign_id == campaign_id,
        )
        rows = self.session.execute(stmt).all()
        return [customer_id for (customer_id,) in rows if customer_id is not None]

    def list_by_campaign_id(
        self,
        user_id: uuid.UUID,
        campaign_id: uuid.UUID,
    ) -> list[CampaignMessage]:
        stmt: Select[tuple[CampaignMessage]] = select(CampaignMessage).where(
            CampaignMessage.user_id == user_id,
            CampaignMessage.campaign_id == campaign_id,
        )
        return list(self.session.scalars(stmt))
