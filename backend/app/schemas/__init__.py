from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate
from app.schemas.campaign_message import (
    CampaignMessageCreate,
    CampaignMessageRead,
    CampaignMessageUpdate,
)
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.schemas.health import HealthStatusResponse
from app.schemas.smtp_settings import SMTPSettingsCreate, SMTPSettingsRead, SMTPSettingsUpdate
from app.schemas.template import (
    TemplateCreateRequest,
    TemplateDeleteResult,
    TemplateRead,
    TemplateUpdate,
    TemplateUpdateRequest,
)

__all__ = [
    "CampaignCreate",
    "CampaignMessageCreate",
    "CampaignMessageRead",
    "CampaignMessageUpdate",
    "CampaignRead",
    "CampaignUpdate",
    "CustomerCreate",
    "CustomerRead",
    "CustomerUpdate",
    "HealthStatusResponse",
    "SMTPSettingsCreate",
    "SMTPSettingsRead",
    "SMTPSettingsUpdate",
    "TemplateCreateRequest",
    "TemplateDeleteResult",
    "TemplateRead",
    "TemplateUpdate",
    "TemplateUpdateRequest",
]
