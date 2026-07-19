import uuid

from sqlalchemy import Select, delete, desc, select

from app.db.models import Template
from app.repositories.base import BaseRepository


class TemplateRepository(BaseRepository[Template]):
    model = Template

    def list_by_user(self, user_id: uuid.UUID) -> list[Template]:
        stmt: Select[tuple[Template]] = (
            select(Template)
            .where(Template.user_id == user_id)
            .order_by(desc(Template.updated_at))
        )
        return list(self.session.scalars(stmt))

    def get_by_user_and_id(
        self,
        user_id: uuid.UUID,
        template_id: uuid.UUID,
    ) -> Template | None:
        stmt: Select[tuple[Template]] = select(Template).where(
            Template.user_id == user_id,
            Template.id == template_id,
        )
        return self.session.scalars(stmt).first()

    def delete_by_user_and_id(self, user_id: uuid.UUID, template_id: uuid.UUID) -> bool:
        stmt = delete(Template).where(
            Template.user_id == user_id,
            Template.id == template_id,
        )
        result = self.session.execute(stmt)
        return bool(result.rowcount)
