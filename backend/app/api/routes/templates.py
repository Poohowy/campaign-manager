import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user_id
from app.db.session import get_db_session
from app.repositories.customer_repository import CustomerRepository
from app.repositories.template_repository import TemplateRepository
from app.schemas.api import DataResponse, ErrorBody, ErrorResponse
from app.schemas.template import (
    TemplateCreateRequest,
    TemplateDeleteResult,
    TemplateRead,
    TemplateRenderRequest,
    TemplateRenderResult,
    TemplateUpdateRequest,
)
from app.services.template_service import (
    CustomerNotFoundError,
    TemplateNotFoundError,
    TemplateService,
)

router = APIRouter(prefix="/templates", tags=["templates"])
CurrentUserDep = Annotated[uuid.UUID | None, Depends(get_current_user_id)]
DBSessionDep = Annotated[Session, Depends(get_db_session)]


def get_template_service(session: DBSessionDep) -> TemplateService:
    return TemplateService(
        template_repository=TemplateRepository(session),
        customer_repository=CustomerRepository(session),
    )


TemplateServiceDep = Annotated[TemplateService, Depends(get_template_service)]


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    payload = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(status_code=status_code, content=payload.model_dump())


@router.get("", response_model=DataResponse[list[TemplateRead]])
def list_templates(
    user_id: CurrentUserDep,
    service: TemplateServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    templates = service.list_templates(user_id=user_id)
    return DataResponse[list[TemplateRead]](
        data=[TemplateRead.model_validate(template, from_attributes=True) for template in templates]
    )


@router.get("/{template_id}", response_model=DataResponse[TemplateRead])
def get_template_by_id(
    template_id: uuid.UUID,
    user_id: CurrentUserDep,
    service: TemplateServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    template = service.get_template_by_id(user_id=user_id, template_id=template_id)
    if template is None:
        return _error_response(404, "TEMPLATE_NOT_FOUND", "Template not found.")

    return DataResponse[TemplateRead](
        data=TemplateRead.model_validate(template, from_attributes=True)
    )


@router.post("", response_model=DataResponse[TemplateRead], status_code=201)
def create_template(
    payload: TemplateCreateRequest,
    user_id: CurrentUserDep,
    service: TemplateServiceDep,
    session: DBSessionDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    template = service.create_template(user_id=user_id, payload=payload)
    session.commit()

    return DataResponse[TemplateRead](
        data=TemplateRead.model_validate(template, from_attributes=True)
    )


@router.post("/render", response_model=DataResponse[TemplateRenderResult])
def render_template(
    payload: TemplateRenderRequest,
    user_id: CurrentUserDep,
    service: TemplateServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    try:
        result = service.render_template(user_id=user_id, payload=payload)
    except TemplateNotFoundError:
        return _error_response(404, "TEMPLATE_NOT_FOUND", "Template not found.")
    except CustomerNotFoundError:
        return _error_response(404, "CUSTOMER_NOT_FOUND", "Customer not found.")

    return DataResponse[TemplateRenderResult](data=result)


@router.put("/{template_id}", response_model=DataResponse[TemplateRead])
def update_template(
    template_id: uuid.UUID,
    payload: TemplateUpdateRequest,
    user_id: CurrentUserDep,
    service: TemplateServiceDep,
    session: DBSessionDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    template = service.update_template(user_id=user_id, template_id=template_id, payload=payload)
    if template is None:
        return _error_response(404, "TEMPLATE_NOT_FOUND", "Template not found.")

    session.commit()
    return DataResponse[TemplateRead](
        data=TemplateRead.model_validate(template, from_attributes=True)
    )


@router.delete("/{template_id}", response_model=DataResponse[TemplateDeleteResult])
def delete_template(
    template_id: uuid.UUID,
    user_id: CurrentUserDep,
    service: TemplateServiceDep,
    session: DBSessionDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    deleted = service.delete_template(user_id=user_id, template_id=template_id)
    if not deleted:
        return _error_response(404, "TEMPLATE_NOT_FOUND", "Template not found.")

    session.commit()
    return DataResponse[TemplateDeleteResult](data=TemplateDeleteResult(deleted=True))
