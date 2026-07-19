import uuid
from types import SimpleNamespace

from app.schemas.template import TemplateCreateRequest, TemplateUpdateRequest
from app.services.template_service import TemplateService


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


def test_list_templates_returns_only_user_templates() -> None:
    repository = FakeTemplateRepository()
    service = TemplateService(repository)  # type: ignore[arg-type]
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
    repository = FakeTemplateRepository()
    service = TemplateService(repository)  # type: ignore[arg-type]
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
    repository = FakeTemplateRepository()
    service = TemplateService(repository)  # type: ignore[arg-type]
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
    repository = FakeTemplateRepository()
    service = TemplateService(repository)  # type: ignore[arg-type]
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
