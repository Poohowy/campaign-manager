import re
import uuid

from app.db.models import Customer, Template
from app.repositories.customer_repository import CustomerRepository
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import (
    TemplateCreateRequest,
    TemplateRenderRequest,
    TemplateRenderResult,
    TemplateUpdateRequest,
)


class TemplateNotFoundError(Exception):
    pass


class CustomerNotFoundError(Exception):
    pass


class TemplateService:
    VARIABLE_PATTERN = re.compile(r"\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}")

    def __init__(
        self,
        template_repository: TemplateRepository,
        customer_repository: CustomerRepository,
    ):
        self.template_repository = template_repository
        self.customer_repository = customer_repository

    def list_templates(self, *, user_id: uuid.UUID) -> list[Template]:
        return self.template_repository.list_by_user(user_id)

    def get_template_by_id(self, *, user_id: uuid.UUID, template_id: uuid.UUID) -> Template | None:
        return self.template_repository.get_by_user_and_id(user_id, template_id)

    def create_template(
        self,
        *,
        user_id: uuid.UUID,
        payload: TemplateCreateRequest,
    ) -> Template:
        return self.template_repository.create(
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
        template = self.template_repository.get_by_user_and_id(user_id, template_id)
        if template is None:
            return None

        return self.template_repository.update(
            template,
            name=payload.name,
            subject=payload.subject,
            body_markdown=payload.body_markdown,
        )

    def delete_template(self, *, user_id: uuid.UUID, template_id: uuid.UUID) -> bool:
        return self.template_repository.delete_by_user_and_id(user_id, template_id)

    def render_template(
        self,
        *,
        user_id: uuid.UUID,
        payload: TemplateRenderRequest,
    ) -> TemplateRenderResult:
        template = self.template_repository.get_by_user_and_id(user_id, payload.template_id)
        if template is None:
            raise TemplateNotFoundError

        customer = self.customer_repository.get_by_user_and_id(user_id, payload.customer_id)
        if customer is None:
            raise CustomerNotFoundError

        values = self._build_render_values(customer)
        rendered_subject = self._render_text(template.subject or "", values)
        rendered_body = self._render_text(template.body_markdown or "", values)
        return TemplateRenderResult(subject=rendered_subject, body=rendered_body)

    def _build_render_values(self, customer: Customer) -> dict[str, str]:
        custom_fields = customer.custom_fields if isinstance(customer.custom_fields, dict) else {}
        return {
            "company_name": customer.company_name or "",
            "contact_name": customer.contact_name or "",
            "email": customer.email or "",
            "phone": customer.phone or "",
            "website": str(custom_fields.get("website") or ""),
            "city": str(custom_fields.get("city") or ""),
            "country": str(custom_fields.get("country") or ""),
        }

    def _render_text(self, content: str, values: dict[str, str]) -> str:
        def replace(match: re.Match[str]) -> str:
            key = match.group(1)
            if key not in values:
                return match.group(0)
            return values[key]

        return self.VARIABLE_PATTERN.sub(replace, content)
