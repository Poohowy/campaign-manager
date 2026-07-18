from app.db.models import SMTPSettings
from app.repositories.base import BaseRepository


class SMTPSettingsRepository(BaseRepository[SMTPSettings]):
    model = SMTPSettings
