import uuid

from sqlalchemy import Select, select

from app.db.models import SMTPSettings
from app.repositories.base import BaseRepository


class SMTPSettingsRepository(BaseRepository[SMTPSettings]):
    model = SMTPSettings

    def get_by_user(self, user_id: uuid.UUID) -> SMTPSettings | None:
        stmt: Select[tuple[SMTPSettings]] = select(SMTPSettings).where(
            SMTPSettings.user_id == user_id
        )
        return self.session.scalars(stmt).first()
