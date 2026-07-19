import math
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user_id
from app.db.session import get_db_session
from app.repositories.customer_repository import CustomerRepository
from app.schemas.api import (
    DataResponse,
    ErrorBody,
    ErrorResponse,
    PaginatedResponse,
    PaginationMeta,
)
from app.schemas.customer import CustomerRead
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])
CurrentUserDep = Annotated[uuid.UUID | None, Depends(get_current_user_id)]
DBSessionDep = Annotated[Session, Depends(get_db_session)]


def get_customer_service(session: DBSessionDep) -> CustomerService:
    return CustomerService(CustomerRepository(session))


CustomerServiceDep = Annotated[CustomerService, Depends(get_customer_service)]


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    payload = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(status_code=status_code, content=payload.model_dump())


@router.get("", response_model=PaginatedResponse[CustomerRead])
def list_customers(
    user_id: CurrentUserDep,
    service: CustomerServiceDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc"),
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    customers, total = service.list_customers(
        user_id=user_id,
        page=page,
        page_size=page_size,
        search=search,
        sort=sort,
        order=order,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedResponse[CustomerRead](
        data=[
            CustomerRead.model_validate(customer, from_attributes=True)
            for customer in customers
        ],
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.get("/{customer_id}", response_model=DataResponse[CustomerRead])
def get_customer_by_id(
    customer_id: uuid.UUID,
    user_id: CurrentUserDep,
    service: CustomerServiceDep,
):
    if user_id is None:
        return _error_response(401, "UNAUTHORIZED", "Unauthorized.")

    customer = service.get_customer_by_id(user_id=user_id, customer_id=customer_id)
    if customer is None:
        return _error_response(404, "CUSTOMER_NOT_FOUND", "Customer not found.")

    return DataResponse[CustomerRead](
        data=CustomerRead.model_validate(customer, from_attributes=True)
    )
