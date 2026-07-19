import uuid
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from app.db.enums import CampaignMessageStatus, CampaignStatus
from app.schemas.campaign import CampaignCreateRequest
from app.services.campaign_service import (
    CampaignCustomerNotFoundError,
    CampaignCustomersRequiredError,
    CampaignNotFoundError,
    CampaignService,
    CampaignTemplateNotFoundError,
)


class FakeCampaignRepository:
    def __init__(self) -> None:
        self.campaigns: dict[uuid.UUID, SimpleNamespace] = {}

    def create(self, **values: object) -> SimpleNamespace:
        now = datetime.now(UTC)
        campaign_id = uuid.uuid4()
        campaign = SimpleNamespace(
            id=campaign_id,
            created_at=now,
            updated_at=now,
            **values,
        )
        self.campaigns[campaign_id] = campaign
        return campaign

    def list_by_user(self, user_id: uuid.UUID) -> list[SimpleNamespace]:
        return [campaign for campaign in self.campaigns.values() if campaign.user_id == user_id]

    def get_by_user_and_id(
        self,
        user_id: uuid.UUID,
        campaign_id: uuid.UUID,
    ) -> SimpleNamespace | None:
        campaign = self.campaigns.get(campaign_id)
        if campaign is None or campaign.user_id != user_id:
            return None
        return campaign

    def delete_by_user_and_id(self, user_id: uuid.UUID, campaign_id: uuid.UUID) -> bool:
        campaign = self.get_by_user_and_id(user_id, campaign_id)
        if campaign is None:
            return False
        del self.campaigns[campaign_id]
        return True


class FakeCampaignMessageRepository:
    def __init__(self) -> None:
        self.messages: list[SimpleNamespace] = []

    def create_many(self, values: list[dict[str, object]]) -> list[SimpleNamespace]:
        created = [SimpleNamespace(id=uuid.uuid4(), **item) for item in values]
        self.messages.extend(created)
        return created

    def count_by_campaign_id(self, user_id: uuid.UUID, campaign_id: uuid.UUID) -> int:
        return len(
            [
                message
                for message in self.messages
                if message.user_id == user_id and message.campaign_id == campaign_id
            ]
        )

    def count_by_campaign_ids(
        self,
        user_id: uuid.UUID,
        campaign_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, int]:
        counts: dict[uuid.UUID, int] = {campaign_id: 0 for campaign_id in campaign_ids}
        for message in self.messages:
            if message.user_id != user_id or message.campaign_id not in counts:
                continue
            counts[message.campaign_id] += 1
        return counts

    def list_customer_ids_by_campaign(
        self,
        user_id: uuid.UUID,
        campaign_id: uuid.UUID,
    ) -> list[uuid.UUID]:
        return [
            message.customer_id
            for message in self.messages
            if message.user_id == user_id and message.campaign_id == campaign_id
        ]


class FakeTemplateRepository:
    def __init__(self) -> None:
        self.templates: dict[uuid.UUID, SimpleNamespace] = {}

    def get_by_user_and_id(
        self,
        user_id: uuid.UUID,
        template_id: uuid.UUID,
    ) -> SimpleNamespace | None:
        template = self.templates.get(template_id)
        if template is None or template.user_id != user_id:
            return None
        return template

    def list_by_user_and_ids(
        self,
        user_id: uuid.UUID,
        template_ids: list[uuid.UUID],
    ) -> list[SimpleNamespace]:
        return [
            template
            for template_id, template in self.templates.items()
            if template_id in template_ids and template.user_id == user_id
        ]


class FakeCustomerRepository:
    def __init__(self) -> None:
        self.customers: dict[uuid.UUID, SimpleNamespace] = {}

    def list_by_user_and_ids(
        self,
        user_id: uuid.UUID,
        customer_ids: list[uuid.UUID],
    ) -> list[SimpleNamespace]:
        return [
            customer
            for customer_id, customer in self.customers.items()
            if customer_id in customer_ids and customer.user_id == user_id
        ]


def build_service() -> tuple[
    CampaignService,
    FakeCampaignRepository,
    FakeCampaignMessageRepository,
    FakeTemplateRepository,
    FakeCustomerRepository,
]:
    campaign_repository = FakeCampaignRepository()
    campaign_message_repository = FakeCampaignMessageRepository()
    template_repository = FakeTemplateRepository()
    customer_repository = FakeCustomerRepository()
    service = CampaignService(  # type: ignore[arg-type]
        campaign_repository=campaign_repository,
        campaign_message_repository=campaign_message_repository,
        template_repository=template_repository,
        customer_repository=customer_repository,
    )
    return (
        service,
        campaign_repository,
        campaign_message_repository,
        template_repository,
        customer_repository,
    )


def test_create_campaign_creates_draft_campaign_and_pending_messages() -> None:
    (
        service,
        campaign_repository,
        campaign_message_repository,
        template_repository,
        customer_repository,
    ) = build_service()
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()
    customer_one = uuid.uuid4()
    customer_two = uuid.uuid4()
    template_repository.templates[template_id] = SimpleNamespace(
        id=template_id,
        user_id=user_id,
        name="Welcome Template",
    )
    customer_repository.customers[customer_one] = SimpleNamespace(
        id=customer_one,
        user_id=user_id,
        email="one@example.com",
    )
    customer_repository.customers[customer_two] = SimpleNamespace(
        id=customer_two,
        user_id=user_id,
        email="two@example.com",
    )

    campaign = service.create_campaign(
        user_id=user_id,
        payload=CampaignCreateRequest(
            name="July Campaign",
            template_id=template_id,
            customer_ids=[customer_one, customer_two],
        ),
    )

    assert campaign.name == "July Campaign"
    assert campaign.status == CampaignStatus.draft
    assert campaign.recipients_count == 2
    assert set(campaign.customer_ids) == {customer_one, customer_two}
    assert len(campaign_repository.campaigns) == 1
    assert len(campaign_message_repository.messages) == 2
    assert all(
        message.status == CampaignMessageStatus.pending
        for message in campaign_message_repository.messages
    )


def test_create_campaign_validates_template_ownership() -> None:
    service, _, _, template_repository, customer_repository = build_service()
    owner_id = uuid.uuid4()
    another_user_id = uuid.uuid4()
    template_id = uuid.uuid4()
    customer_id = uuid.uuid4()
    template_repository.templates[template_id] = SimpleNamespace(
        id=template_id,
        user_id=owner_id,
        name="Owner Template",
    )
    customer_repository.customers[customer_id] = SimpleNamespace(
        id=customer_id,
        user_id=another_user_id,
        email="user@example.com",
    )

    with pytest.raises(CampaignTemplateNotFoundError):
        service.create_campaign(
            user_id=another_user_id,
            payload=CampaignCreateRequest(
                name="Campaign",
                template_id=template_id,
                customer_ids=[customer_id],
            ),
        )


def test_create_campaign_validates_customer_ownership() -> None:
    service, _, _, template_repository, customer_repository = build_service()
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()
    foreign_customer_id = uuid.uuid4()
    template_repository.templates[template_id] = SimpleNamespace(
        id=template_id,
        user_id=user_id,
        name="Template",
    )
    customer_repository.customers[foreign_customer_id] = SimpleNamespace(
        id=foreign_customer_id,
        user_id=uuid.uuid4(),
        email="foreign@example.com",
    )

    with pytest.raises(CampaignCustomerNotFoundError):
        service.create_campaign(
            user_id=user_id,
            payload=CampaignCreateRequest(
                name="Campaign",
                template_id=template_id,
                customer_ids=[foreign_customer_id],
            ),
        )


def test_create_campaign_requires_customer_ids() -> None:
    service, _, _, template_repository, _ = build_service()
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()
    template_repository.templates[template_id] = SimpleNamespace(
        id=template_id,
        user_id=user_id,
        name="Template",
    )

    with pytest.raises(CampaignCustomersRequiredError):
        service.create_campaign(
            user_id=user_id,
            payload=CampaignCreateRequest(
                name="Campaign",
                template_id=template_id,
                customer_ids=[],
            ),
        )


def test_list_campaigns_returns_recipient_counts() -> None:
    (
        service,
        campaign_repository,
        campaign_message_repository,
        template_repository,
        _,
    ) = build_service()
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()
    template_repository.templates[template_id] = SimpleNamespace(
        id=template_id,
        user_id=user_id,
        name="Template A",
    )
    campaign = campaign_repository.create(
        user_id=user_id,
        template_id=template_id,
        name="Campaign",
        status=CampaignStatus.draft,
        started_at=None,
        finished_at=None,
    )
    campaign_message_repository.create_many(
        [
            {
                "user_id": user_id,
                "campaign_id": campaign.id,
                "customer_id": uuid.uuid4(),
                "email": "a@example.com",
                "subject": None,
                "body_markdown": None,
                "rendered_variables": {},
                "status": CampaignMessageStatus.pending,
                "error_message": None,
                "sent_at": None,
            }
        ]
    )

    campaigns = service.list_campaigns(user_id=user_id)

    assert len(campaigns) == 1
    assert campaigns[0].template_name == "Template A"
    assert campaigns[0].recipients_count == 1
    assert campaigns[0].status == CampaignStatus.draft


def test_get_campaign_by_id_enforces_ownership() -> None:
    service, campaign_repository, _, _, _ = build_service()
    owner_id = uuid.uuid4()
    another_user_id = uuid.uuid4()
    campaign = campaign_repository.create(
        user_id=owner_id,
        template_id=uuid.uuid4(),
        name="Owner Campaign",
        status=CampaignStatus.draft,
        started_at=None,
        finished_at=None,
    )

    with pytest.raises(CampaignNotFoundError):
        service.get_campaign_by_id(user_id=another_user_id, campaign_id=campaign.id)
