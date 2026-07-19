import uuid

from app.db.enums import CampaignMessageStatus, CampaignStatus
from app.repositories.campaign_message_repository import CampaignMessageRepository
from app.repositories.campaign_repository import CampaignRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.template_repository import TemplateRepository
from app.schemas.campaign import CampaignCreateRequest, CampaignRead


class CampaignNotFoundError(Exception):
    pass


class CampaignTemplateNotFoundError(Exception):
    pass


class CampaignCustomerNotFoundError(Exception):
    pass


class CampaignCustomersRequiredError(Exception):
    pass


class CampaignService:
    def __init__(
        self,
        campaign_repository: CampaignRepository,
        campaign_message_repository: CampaignMessageRepository,
        template_repository: TemplateRepository,
        customer_repository: CustomerRepository,
    ):
        self.campaign_repository = campaign_repository
        self.campaign_message_repository = campaign_message_repository
        self.template_repository = template_repository
        self.customer_repository = customer_repository

    def list_campaigns(self, *, user_id: uuid.UUID) -> list[CampaignRead]:
        campaigns = self.campaign_repository.list_by_user(user_id)
        if not campaigns:
            return []

        template_ids = [
            campaign.template_id for campaign in campaigns if campaign.template_id is not None
        ]
        templates = self.template_repository.list_by_user_and_ids(user_id, template_ids)
        template_name_by_id = {template.id: template.name for template in templates}

        campaign_ids = [campaign.id for campaign in campaigns]
        recipients_by_campaign = self.campaign_message_repository.count_by_campaign_ids(
            user_id,
            campaign_ids,
        )

        return [
            self._to_campaign_read(
                campaign=campaign,
                template_name=template_name_by_id.get(campaign.template_id),
                recipients_count=recipients_by_campaign.get(campaign.id, 0),
                include_customer_ids=False,
                customer_ids=[],
            )
            for campaign in campaigns
        ]

    def get_campaign_by_id(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID) -> CampaignRead:
        campaign = self.campaign_repository.get_by_user_and_id(user_id, campaign_id)
        if campaign is None:
            raise CampaignNotFoundError

        recipients_count = self.campaign_message_repository.count_by_campaign_id(
            user_id,
            campaign.id,
        )
        customer_ids = self.campaign_message_repository.list_customer_ids_by_campaign(
            user_id,
            campaign.id,
        )
        template_name = None
        if campaign.template_id is not None:
            template = self.template_repository.get_by_user_and_id(user_id, campaign.template_id)
            template_name = template.name if template is not None else None

        return self._to_campaign_read(
            campaign=campaign,
            template_name=template_name,
            recipients_count=recipients_count,
            include_customer_ids=True,
            customer_ids=customer_ids,
        )

    def create_campaign(
        self,
        *,
        user_id: uuid.UUID,
        payload: CampaignCreateRequest,
    ) -> CampaignRead:
        template = self.template_repository.get_by_user_and_id(user_id, payload.template_id)
        if template is None:
            raise CampaignTemplateNotFoundError

        customer_ids = self._normalize_customer_ids(payload.customer_ids)
        if not customer_ids:
            raise CampaignCustomersRequiredError

        customers = self.customer_repository.list_by_user_and_ids(user_id, customer_ids)
        if len(customers) != len(customer_ids):
            raise CampaignCustomerNotFoundError

        campaign = self.campaign_repository.create(
            user_id=user_id,
            template_id=payload.template_id,
            name=payload.name,
            status=CampaignStatus.draft,
            started_at=None,
            finished_at=None,
        )

        self.campaign_message_repository.create_many(
            [
                {
                    "user_id": user_id,
                    "campaign_id": campaign.id,
                    "customer_id": customer.id,
                    "email": customer.email,
                    "subject": None,
                    "body_markdown": None,
                    "rendered_variables": {},
                    "status": CampaignMessageStatus.pending,
                    "error_message": None,
                    "sent_at": None,
                }
                for customer in customers
            ]
        )

        return self._to_campaign_read(
            campaign=campaign,
            template_name=template.name,
            recipients_count=len(customers),
            include_customer_ids=True,
            customer_ids=[customer.id for customer in customers],
        )

    def delete_campaign(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID) -> bool:
        return self.campaign_repository.delete_by_user_and_id(user_id, campaign_id)

    @staticmethod
    def _normalize_customer_ids(customer_ids: list[uuid.UUID]) -> list[uuid.UUID]:
        seen: set[uuid.UUID] = set()
        unique_ids: list[uuid.UUID] = []
        for customer_id in customer_ids:
            if customer_id in seen:
                continue
            seen.add(customer_id)
            unique_ids.append(customer_id)
        return unique_ids

    @staticmethod
    def _to_campaign_read(
        *,
        campaign,
        template_name: str | None,
        recipients_count: int,
        include_customer_ids: bool,
        customer_ids: list[uuid.UUID],
    ) -> CampaignRead:
        return CampaignRead(
            id=campaign.id,
            user_id=campaign.user_id,
            template_id=campaign.template_id,
            template_name=template_name,
            name=campaign.name or "",
            status=campaign.status or CampaignStatus.draft,
            recipients_count=recipients_count,
            customer_ids=customer_ids if include_customer_ids else [],
            created_at=campaign.created_at,
            started_at=campaign.started_at,
            finished_at=campaign.finished_at,
            updated_at=campaign.updated_at,
        )
