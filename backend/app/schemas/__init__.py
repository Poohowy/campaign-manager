from app.schemas.campaign import (
    CampaignCreateRequest,
    CampaignDeleteResult,
    CampaignRead,
    CampaignSendResult,
)
from app.schemas.campaign_message import (
    CampaignMessageCreate,
    CampaignMessageRead,
    CampaignMessageUpdate,
)
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.schemas.health import HealthStatusResponse
from app.schemas.smtp_settings import (
    SMTPSettingsRead,
    SMTPSettingsSaveResult,
    SMTPSettingsUpsertRequest,
    SMTPTestRequest,
    SMTPTestResult,
)
from app.schemas.template import (
    TemplateCreateRequest,
    TemplateDeleteResult,
    TemplateRead,
    TemplateRenderRequest,
    TemplateRenderResult,
    TemplateUpdate,
    TemplateUpdateRequest,
)

__all__ = [
    "CampaignCreateRequest",
    "CampaignDeleteResult",
    "CampaignMessageCreate",
    "CampaignMessageRead",
    "CampaignMessageUpdate",
    "CampaignRead",
    "CampaignSendResult",
    "CustomerCreate",
    "CustomerRead",
    "CustomerUpdate",
    "HealthStatusResponse",
    "SMTPSettingsRead",
    "SMTPSettingsSaveResult",
    "SMTPSettingsUpsertRequest",
    "SMTPTestRequest",
    "SMTPTestResult",
    "TemplateCreateRequest",
    "TemplateDeleteResult",
    "TemplateRead",
    "TemplateRenderRequest",
    "TemplateRenderResult",
    "TemplateUpdate",
    "TemplateUpdateRequest",
]
