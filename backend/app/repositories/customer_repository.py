import uuid

from sqlalchemy import Select, asc, delete, desc, func, or_, select

from app.db.models import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    model = Customer

    def get_by_user_and_id(self, user_id: uuid.UUID, customer_id: uuid.UUID) -> Customer | None:
        stmt: Select[tuple[Customer]] = select(Customer).where(
            Customer.id == customer_id,
            Customer.user_id == user_id,
        )
        return self.session.scalars(stmt).first()

    def get_by_user_and_external_id(self, user_id: uuid.UUID, external_id: str) -> Customer | None:
        stmt: Select[tuple[Customer]] = select(Customer).where(
            Customer.user_id == user_id,
            Customer.external_id == external_id,
        )
        return self.session.scalars(stmt).first()

    def list_by_user_and_ids(
        self,
        user_id: uuid.UUID,
        customer_ids: list[uuid.UUID],
    ) -> list[Customer]:
        if not customer_ids:
            return []

        stmt: Select[tuple[Customer]] = select(Customer).where(
            Customer.user_id == user_id,
            Customer.id.in_(customer_ids),
        )
        return list(self.session.scalars(stmt))

    def list_by_user(
        self,
        user_id: uuid.UUID,
        *,
        offset: int,
        limit: int,
        search: str | None = None,
        sort: str = "created_at",
        order: str = "desc",
    ) -> list[Customer]:
        stmt: Select[tuple[Customer]] = select(Customer).where(Customer.user_id == user_id)
        stmt = self._apply_search(stmt, search)
        stmt = self._apply_sort(stmt, sort, order)
        stmt = stmt.offset(offset).limit(limit)
        return list(self.session.scalars(stmt))

    def count_by_user(self, user_id: uuid.UUID, *, search: str | None = None) -> int:
        stmt = select(func.count(Customer.id)).where(Customer.user_id == user_id)
        stmt = self._apply_search(stmt, search)
        return int(self.session.scalar(stmt) or 0)

    def delete_by_user_ids(self, user_id: uuid.UUID, customer_ids: list[uuid.UUID]) -> int:
        if not customer_ids:
            return 0

        stmt = delete(Customer).where(
            Customer.user_id == user_id,
            Customer.id.in_(customer_ids),
        )
        result = self.session.execute(stmt)
        return int(result.rowcount or 0)

    def _apply_search(self, stmt: Select, search: str | None) -> Select:
        if not search:
            return stmt

        term = f"%{search.strip()}%"
        return stmt.where(
            or_(
                Customer.company_name.ilike(term),
                Customer.contact_name.ilike(term),
                Customer.email.ilike(term),
            )
        )

    def _apply_sort(self, stmt: Select, sort: str, order: str) -> Select:
        sort_map = {
            "created_at": Customer.created_at,
            "company_name": Customer.company_name,
            "contact_name": Customer.contact_name,
            "email": Customer.email,
        }
        column = sort_map.get(sort, Customer.created_at)
        direction = asc if order == "asc" else desc
        return stmt.order_by(direction(column))
