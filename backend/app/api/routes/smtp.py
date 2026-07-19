import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user_id
from app.core.config import get_settings
from app.db.session import get_db_session
from app.repositories.smtp_settings_repository import SMTPSettingsRepository
from app.schemas.api import DataResponse, ErrorBody, ErrorResponse
from app.schemas.smtp_settings import (
    SMTPSettingsRead,
    SMTPSettingsSaveResult,
    SMTPSettingsUpsertRequest,
    SMTPTestRequest,
    SMTPTestResult,
)
from app.services.smtp_service import (
    SMTPEncryptionKeyError,
    SMTPPasswordRequiredError,
    SMTPService,
    SMTPSettingsNotFoundError,
    SMTPTestFailedError,
)

router = APIRouter(prefix="/smtp", tags=["smtp"])
CurrentUserDep = Annotated[uuid.UUID | None, Depends(get_current_user_id)]
DBSessionDep = Annotated[Session, Depends(get_db_session)]


def get_smtp_service(session: DBSessionDep) -> SMTPService:
    settings = get_settings()
    return SMTPService(
        repository=SMTPSettingsRepository(session),
        encryption_key=settings.smtp_encryption_key,
    )


SMTPServiceDep = Annotated[SMTPService, Depends(get_smtp_service)]


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    payload = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(status_code=status_code, content=payload.model_dump())


@router.get("", response_model=DataResponse[SMTPSettingsRead | None])
def get_smtp_settings(
    user_id: CurrentUserDep,
    service: SMTPServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    data = service.get_settings(user_id=user_id)
    return DataResponse[SMTPSettingsRead | None](data=data)


@router.put("", response_model=DataResponse[SMTPSettingsSaveResult])
def save_smtp_settings(
    payload: SMTPSettingsUpsertRequest,
    user_id: CurrentUserDep,
    service: SMTPServiceDep,
    session: DBSessionDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    try:
        service.upsert_settings(user_id=user_id, payload=payload)
    except SMTPPasswordRequiredError:
        return _error_response(400, "SMTP_PASSWORD_REQUIRED", "Password is required.")
    except SMTPEncryptionKeyError:
        return _error_response(
            500,
            "SMTP_ENCRYPTION_ERROR",
            "SMTP encryption is not configured correctly.",
        )

    session.commit()
    return DataResponse[SMTPSettingsSaveResult](data=SMTPSettingsSaveResult(saved=True))


@router.post("/test", response_model=DataResponse[SMTPTestResult])
def test_smtp_connection(
    payload: SMTPTestRequest,
    user_id: CurrentUserDep,
    service: SMTPServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    try:
        service.send_test_email(user_id=user_id, payload=payload)
    except SMTPSettingsNotFoundError:
        return _error_response(
            404,
            "SMTP_SETTINGS_NOT_FOUND",
            "SMTP settings are not configured.",
        )
    except SMTPEncryptionKeyError:
        return _error_response(
            500,
            "SMTP_ENCRYPTION_ERROR",
            "SMTP encryption is not configured correctly.",
        )
    except SMTPTestFailedError as error:
        return _error_response(400, "SMTP_TEST_FAILED", str(error))

    return DataResponse[SMTPTestResult](data=SMTPTestResult(success=True))
