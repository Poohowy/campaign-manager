import uuid

from app.db.models import Customer
from app.repositories.customer_repository import CustomerRepository
from app.schemas.customer import CustomerCreate


class CustomerService:
    def __init__(self, repository: CustomerRepository):
        self.repository = repository

    def list_customers(
        self,
        *,
        user_id: uuid.UUID,
        page: int,
        page_size: int,
        search: str | None,
        sort: str,
        order: str,
    ) -> tuple[list[Customer], int]:
        safe_sort_fields = {"created_at", "company_name", "contact_name", "email"}
        safe_sort = sort if sort in safe_sort_fields else "created_at"
        safe_order = "asc" if order == "asc" else "desc"
        offset = (page - 1) * page_size

        customers = self.repository.list_by_user(
            user_id,
            offset=offset,
            limit=page_size,
            search=search,
            sort=safe_sort,
            order=safe_order,
        )
        total = self.repository.count_by_user(user_id, search=search)
        return customers, total

    def get_customer_by_id(self, *, user_id: uuid.UUID, customer_id: uuid.UUID) -> Customer | None:
        return self.repository.get_by_user_and_id(user_id, customer_id)

    def upsert_customer(self, *, user_id: uuid.UUID, payload: CustomerCreate) -> Customer:
        existing = self.repository.get_by_user_and_external_id(user_id, payload.external_id)
        values = payload.model_dump(exclude={"user_id"})

        if existing is None:
            return self.repository.create(user_id=user_id, **values)

        return self.repository.update(existing, **values)
