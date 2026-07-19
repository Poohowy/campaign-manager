import uuid

from sqlalchemy import Select, desc, select

from app.db.models import Campaign
from app.repositories.base import BaseRepository


class CampaignRepository(BaseRepository[Campaign]):
    model = Campaign

    def list_by_user(self, user_id: uuid.UUID) -> list[Campaign]:
        stmt: Select[tuple[Campaign]] = (
            select(Campaign).where(Campaign.user_id == user_id).order_by(desc(Campaign.created_at))
        )
        return list(self.session.scalars(stmt))

    def get_by_user_and_id(self, user_id: uuid.UUID, campaign_id: uuid.UUID) -> Campaign | None:
        stmt: Select[tuple[Campaign]] = select(Campaign).where(
            Campaign.user_id == user_id,
            Campaign.id == campaign_id,
        )
        return self.session.scalars(stmt).first()

    def delete_by_user_and_id(self, user_id: uuid.UUID, campaign_id: uuid.UUID) -> bool:
        campaign = self.get_by_user_and_id(user_id, campaign_id)
        if campaign is None:
            return False

        self.delete(campaign)
        return True
