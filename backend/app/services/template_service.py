import uuid

from app.db.models import Template
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import TemplateCreateRequest, TemplateUpdateRequest


class TemplateService:
    def __init__(self, repository: TemplateRepository):
        self.repository = repository

    def list_templates(self, *, user_id: uuid.UUID) -> list[Template]:
        return self.repository.list_by_user(user_id)

    def get_template_by_id(self, *, user_id: uuid.UUID, template_id: uuid.UUID) -> Template | None:
        return self.repository.get_by_user_and_id(user_id, template_id)

    def create_template(
        self,
        *,
        user_id: uuid.UUID,
        payload: TemplateCreateRequest,
    ) -> Template:
        return self.repository.create(
            user_id=user_id,
            name=payload.name,
            description=None,
            subject=payload.subject,
            body_markdown=payload.body_markdown,
        )

    def update_template(
        self,
        *,
        user_id: uuid.UUID,
        template_id: uuid.UUID,
        payload: TemplateUpdateRequest,
    ) -> Template | None:
        template = self.repository.get_by_user_and_id(user_id, template_id)
        if template is None:
            return None

        return self.repository.update(
            template,
            name=payload.name,
            subject=payload.subject,
            body_markdown=payload.body_markdown,
        )

    def delete_template(self, *, user_id: uuid.UUID, template_id: uuid.UUID) -> bool:
        return self.repository.delete_by_user_and_id(user_id, template_id)
