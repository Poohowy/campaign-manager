import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user_id
from app.core.config import get_settings
from app.db.session import get_db_session
from app.repositories.campaign_message_repository import CampaignMessageRepository
from app.repositories.campaign_repository import CampaignRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.smtp_settings_repository import SMTPSettingsRepository
from app.repositories.template_repository import TemplateRepository
from app.schemas.api import DataResponse, ErrorBody, ErrorResponse
from app.schemas.campaign import (
    CampaignCreateRequest,
    CampaignDeleteResult,
    CampaignRead,
    CampaignSendResult,
)
from app.schemas.campaign_message import CampaignMessageRead
from app.services.campaign_service import (
    CampaignCustomerNotFoundError,
    CampaignCustomersRequiredError,
    CampaignNotDraftError,
    CampaignNotFoundError,
    CampaignService,
    CampaignTemplateNotFoundError,
)
from app.services.smtp_service import SMTPService, SMTPSettingsNotFoundError
from app.services.template_service import TemplateService

router = APIRouter(prefix="/campaigns", tags=["campaigns"])
CurrentUserDep = Annotated[uuid.UUID | None, Depends(get_current_user_id)]
DBSessionDep = Annotated[Session, Depends(get_db_session)]


def get_campaign_service(session: DBSessionDep) -> CampaignService:
    template_repository = TemplateRepository(session)
    customer_repository = CustomerRepository(session)
    template_service = TemplateService(
        template_repository=template_repository,
        customer_repository=customer_repository,
    )
    settings = get_settings()
    smtp_service = SMTPService(
        repository=SMTPSettingsRepository(session),
        encryption_key=settings.smtp_encryption_key,
    )

    return CampaignService(
        campaign_repository=CampaignRepository(session),
        campaign_message_repository=CampaignMessageRepository(session),
        template_repository=template_repository,
        customer_repository=customer_repository,
        template_service=template_service,
        smtp_service=smtp_service,
    )


CampaignServiceDep = Annotated[CampaignService, Depends(get_campaign_service)]


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    payload = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(status_code=status_code, content=payload.model_dump())


@router.get("", response_model=DataResponse[list[CampaignRead]])
def list_campaigns(
    user_id: CurrentUserDep,
    service: CampaignServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    campaigns = service.list_campaigns(user_id=user_id)
    return DataResponse[list[CampaignRead]](data=campaigns)


@router.get("/{campaign_id}", response_model=DataResponse[CampaignRead])
def get_campaign_by_id(
    campaign_id: uuid.UUID,
    user_id: CurrentUserDep,
    service: CampaignServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    try:
        campaign = service.get_campaign_by_id(user_id=user_id, campaign_id=campaign_id)
    except CampaignNotFoundError:
        return _error_response(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")

    return DataResponse[CampaignRead](data=campaign)


@router.get("/{campaign_id}/messages", response_model=DataResponse[list[CampaignMessageRead]])
def list_campaign_messages(
    campaign_id: uuid.UUID,
    user_id: CurrentUserDep,
    service: CampaignServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    try:
        messages = service.list_campaign_messages(user_id=user_id, campaign_id=campaign_id)
    except CampaignNotFoundError:
        return _error_response(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")

    return DataResponse[list[CampaignMessageRead]](
        data=[
            CampaignMessageRead.model_validate(message, from_attributes=True)
            for message in messages
        ]
    )


@router.post("", response_model=DataResponse[CampaignRead], status_code=201)
def create_campaign(
    payload: CampaignCreateRequest,
    user_id: CurrentUserDep,
    service: CampaignServiceDep,
    session: DBSessionDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    try:
        campaign = service.create_campaign(user_id=user_id, payload=payload)
    except CampaignTemplateNotFoundError:
        return _error_response(404, "TEMPLATE_NOT_FOUND", "Template not found.")
    except CampaignCustomerNotFoundError:
        return _error_response(404, "CUSTOMER_NOT_FOUND", "Customer not found.")
    except CampaignCustomersRequiredError:
        return _error_response(
            400,
            "CUSTOMER_IDS_REQUIRED",
            "At least one customer ID is required.",
        )

    session.commit()
    return DataResponse[CampaignRead](data=campaign)


@router.post("/{campaign_id}/send", response_model=DataResponse[CampaignSendResult])
def send_campaign(
    campaign_id: uuid.UUID,
    user_id: CurrentUserDep,
    service: CampaignServiceDep,
    session: DBSessionDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    try:
        result = service.send_campaign(user_id=user_id, campaign_id=campaign_id)
    except CampaignNotFoundError:
        return _error_response(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")
    except CampaignNotDraftError:
        return _error_response(
            409,
            "CAMPAIGN_NOT_DRAFT",
            "Only draft campaigns can be sent.",
        )
    except CampaignTemplateNotFoundError:
        return _error_response(404, "TEMPLATE_NOT_FOUND", "Template not found.")
    except SMTPSettingsNotFoundError:
        return _error_response(
            400,
            "SMTP_SETTINGS_NOT_FOUND",
            "SMTP settings are not configured.",
        )

    session.commit()
    return DataResponse[CampaignSendResult](data=result)


@router.delete("/{campaign_id}", response_model=DataResponse[CampaignDeleteResult])
def delete_campaign(
    campaign_id: uuid.UUID,
    user_id: CurrentUserDep,
    service: CampaignServiceDep,
    session: DBSessionDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    deleted = service.delete_campaign(user_id=user_id, campaign_id=campaign_id)
    if not deleted:
        return _error_response(404, "CAMPAIGN_NOT_FOUND", "Campaign not found.")

    session.commit()
    return DataResponse[CampaignDeleteResult](data=CampaignDeleteResult(deleted=True))
