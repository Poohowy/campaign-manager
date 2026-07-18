from app.db.models import CampaignMessage
from app.repositories.base import BaseRepository


class CampaignMessageRepository(BaseRepository[CampaignMessage]):
    model = CampaignMessage
