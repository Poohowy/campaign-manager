import uuid
from types import SimpleNamespace

import pytest

from app.schemas.template import (
    TemplateCreateRequest,
    TemplateRenderRequest,
    TemplateUpdateRequest,
)
from app.services.template_service import (
    CustomerNotFoundError,
    TemplateNotFoundError,
    TemplateService,
)


class FakeTemplateRepository:
    def __init__(self) -> None:
        self.templates: dict[uuid.UUID, SimpleNamespace] = {}

    def list_by_user(self, user_id: uuid.UUID) -> list[SimpleNamespace]:
        return [template for template in self.templates.values() if template.user_id == user_id]

    def get_by_user_and_id(
        self,
        user_id: uuid.UUID,
        template_id: uuid.UUID,
    ) -> SimpleNamespace | None:
        template = self.templates.get(template_id)
        if template is None or template.user_id != user_id:
            return None
        return template

    def create(self, **values: object) -> SimpleNamespace:
        template_id = uuid.uuid4()
        template = SimpleNamespace(id=template_id, **values)
        self.templates[template_id] = template
        return template

    def update(self, entity: SimpleNamespace, **values: object) -> SimpleNamespace:
        for field, value in values.items():
            setattr(entity, field, value)
        return entity

    def delete_by_user_and_id(self, user_id: uuid.UUID, template_id: uuid.UUID) -> bool:
        template = self.templates.get(template_id)
        if template is None or template.user_id != user_id:
            return False
        del self.templates[template_id]
        return True


class FakeCustomerRepository:
    def __init__(self) -> None:
        self.customers: dict[uuid.UUID, SimpleNamespace] = {}

    def get_by_user_and_id(
        self,
        user_id: uuid.UUID,
        customer_id: uuid.UUID,
    ) -> SimpleNamespace | None:
        customer = self.customers.get(customer_id)
        if customer is None or customer.user_id != user_id:
            return None
        return customer


def build_service() -> tuple[TemplateService, FakeTemplateRepository, FakeCustomerRepository]:
    template_repository = FakeTemplateRepository()
    customer_repository = FakeCustomerRepository()
    service = TemplateService(  # type: ignore[arg-type]
        template_repository=template_repository,
        customer_repository=customer_repository,
    )
    return service, template_repository, customer_repository


def test_list_templates_returns_only_user_templates() -> None:
    service, repository, _ = build_service()
    user_id = uuid.uuid4()
    another_user_id = uuid.uuid4()
    repository.create(
        user_id=user_id,
        name="Welcome",
        description=None,
        subject="Hi",
        body_markdown="Body",
    )
    repository.create(
        user_id=another_user_id,
        name="Other",
        description=None,
        subject="Other",
        body_markdown="Body",
    )

    templates = service.list_templates(user_id=user_id)

    assert len(templates) == 1
    assert templates[0].name == "Welcome"


def test_create_template_persists_template_for_user() -> None:
    service, _, _ = build_service()
    user_id = uuid.uuid4()

    created = service.create_template(
        user_id=user_id,
        payload=TemplateCreateRequest(
            name="Welcome",
            subject="Hello {{company_name}}",
            body_markdown="# Welcome",
        ),
    )

    assert created.user_id == user_id
    assert created.name == "Welcome"
    assert created.subject == "Hello {{company_name}}"
    assert created.body_markdown == "# Welcome"


def test_update_template_updates_only_owner_template() -> None:
    service, repository, _ = build_service()
    owner_id = uuid.uuid4()
    other_id = uuid.uuid4()
    owner_template = repository.create(
        user_id=owner_id,
        name="Old",
        description=None,
        subject="Old subject",
        body_markdown="Old body",
    )

    result = service.update_template(
        user_id=other_id,
        template_id=owner_template.id,
        payload=TemplateUpdateRequest(
            name="New",
            subject="New subject",
            body_markdown="New body",
        ),
    )

    assert result is None
    assert owner_template.name == "Old"


def test_delete_template_respects_ownership() -> None:
    service, repository, _ = build_service()
    owner_id = uuid.uuid4()
    other_id = uuid.uuid4()
    owner_template = repository.create(
        user_id=owner_id,
        name="Template",
        description=None,
        subject="Subject",
        body_markdown="Body",
    )

    deleted_by_other = service.delete_template(user_id=other_id, template_id=owner_template.id)
    deleted_by_owner = service.delete_template(user_id=owner_id, template_id=owner_template.id)

    assert deleted_by_other is False
    assert deleted_by_owner is True


def test_render_template_replaces_supported_variables() -> None:
    service, template_repository, customer_repository = build_service()
    user_id = uuid.uuid4()
    template = template_repository.create(
        user_id=user_id,
        name="Welcome",
        description=None,
        subject="Hello {{company_name}} from {{city}}",
        body_markdown=(
            "Contact: {{contact_name}} / {{email}} / {{phone}} / "
            "{{website}} / {{country}}"
        ),
    )
    customer_id = uuid.uuid4()
    customer_repository.customers[customer_id] = SimpleNamespace(
        id=customer_id,
        user_id=user_id,
        company_name="ACME",
        contact_name="Alice",
        email="alice@acme.com",
        phone="+48 123456789",
        custom_fields={
            "website": "https://acme.com",
            "city": "Warsaw",
            "country": "Poland",
        },
    )

    result = service.render_template(
        user_id=user_id,
        payload=TemplateRenderRequest(
            template_id=template.id,
            customer_id=customer_id,
        ),
    )

    assert result.subject == "Hello ACME from Warsaw"
    assert result.body == (
        "Contact: Alice / alice@acme.com / +48 123456789 / https://acme.com / Poland"
    )


def test_render_template_leaves_unknown_variables_unchanged() -> None:
    service, template_repository, customer_repository = build_service()
    user_id = uuid.uuid4()
    template = template_repository.create(
        user_id=user_id,
        name="Welcome",
        description=None,
        subject="Hello {{unknown_key}}",
        body_markdown="Body {{company_name}} {{another_unknown}}",
    )
    customer_id = uuid.uuid4()
    customer_repository.customers[customer_id] = SimpleNamespace(
        id=customer_id,
        user_id=user_id,
        company_name="ACME",
        contact_name=None,
        email="hello@acme.com",
        phone=None,
        custom_fields={},
    )

    result = service.render_template(
        user_id=user_id,
        payload=TemplateRenderRequest(
            template_id=template.id,
            customer_id=customer_id,
        ),
    )

    assert result.subject == "Hello {{unknown_key}}"
    assert result.body == "Body ACME {{another_unknown}}"


def test_render_template_enforces_template_ownership() -> None:
    service, template_repository, customer_repository = build_service()
    owner_id = uuid.uuid4()
    another_user_id = uuid.uuid4()
    template = template_repository.create(
        user_id=owner_id,
        name="Private",
        description=None,
        subject="Hello {{company_name}}",
        body_markdown="Body",
    )
    customer_id = uuid.uuid4()
    customer_repository.customers[customer_id] = SimpleNamespace(
        id=customer_id,
        user_id=another_user_id,
        company_name="ACME",
        contact_name=None,
        email="hello@acme.com",
        phone=None,
        custom_fields={},
    )

    with pytest.raises(TemplateNotFoundError):
        service.render_template(
            user_id=another_user_id,
            payload=TemplateRenderRequest(
                template_id=template.id,
                customer_id=customer_id,
            ),
        )


def test_render_template_enforces_customer_ownership() -> None:
    service, template_repository, customer_repository = build_service()
    user_id = uuid.uuid4()
    another_user_id = uuid.uuid4()
    template = template_repository.create(
        user_id=user_id,
        name="Welcome",
        description=None,
        subject="Hello {{company_name}}",
        body_markdown="Body",
    )
    foreign_customer_id = uuid.uuid4()
    customer_repository.customers[foreign_customer_id] = SimpleNamespace(
        id=foreign_customer_id,
        user_id=another_user_id,
        company_name="Foreign",
        contact_name=None,
        email="foreign@example.com",
        phone=None,
        custom_fields={},
    )

    with pytest.raises(CustomerNotFoundError):
        service.render_template(
            user_id=user_id,
            payload=TemplateRenderRequest(
                template_id=template.id,
                customer_id=foreign_customer_id,
            ),
        )
