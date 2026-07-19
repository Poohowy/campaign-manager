import uuid
from types import SimpleNamespace

from app.services.customer_service import CustomerService


class FakeCustomerRepository:
    def __init__(self) -> None:
        self.customers: dict[uuid.UUID, SimpleNamespace] = {}

    def delete_by_user_ids(self, user_id: uuid.UUID, customer_ids: list[uuid.UUID]) -> int:
        deleted = 0
        for customer_id in customer_ids:
            customer = self.customers.get(customer_id)
            if customer is None or customer.user_id != user_id:
                continue
            del self.customers[customer_id]
            deleted += 1
        return deleted


def test_delete_customers_deletes_one_customer() -> None:
    repository = FakeCustomerRepository()
    service = CustomerService(repository)  # type: ignore[arg-type]
    user_id = uuid.uuid4()
    customer_id = uuid.uuid4()
    repository.customers[customer_id] = SimpleNamespace(id=customer_id, user_id=user_id)

    result = service.delete_customers(user_id=user_id, customer_ids=[customer_id])

    assert result.deleted == 1
    assert customer_id not in repository.customers


def test_delete_customers_deletes_multiple_customers() -> None:
    repository = FakeCustomerRepository()
    service = CustomerService(repository)  # type: ignore[arg-type]
    user_id = uuid.uuid4()
    customer_id_1 = uuid.uuid4()
    customer_id_2 = uuid.uuid4()
    repository.customers[customer_id_1] = SimpleNamespace(id=customer_id_1, user_id=user_id)
    repository.customers[customer_id_2] = SimpleNamespace(id=customer_id_2, user_id=user_id)

    result = service.delete_customers(
        user_id=user_id,
        customer_ids=[customer_id_1, customer_id_2],
    )

    assert result.deleted == 2
    assert customer_id_1 not in repository.customers
    assert customer_id_2 not in repository.customers


def test_delete_customers_ignores_unknown_ids() -> None:
    repository = FakeCustomerRepository()
    service = CustomerService(repository)  # type: ignore[arg-type]
    user_id = uuid.uuid4()
    existing_customer_id = uuid.uuid4()
    unknown_customer_id = uuid.uuid4()
    repository.customers[existing_customer_id] = SimpleNamespace(
        id=existing_customer_id,
        user_id=user_id,
    )

    result = service.delete_customers(
        user_id=user_id,
        customer_ids=[existing_customer_id, unknown_customer_id],
    )

    assert result.deleted == 1
    assert existing_customer_id not in repository.customers


def test_delete_customers_enforces_user_ownership() -> None:
    repository = FakeCustomerRepository()
    service = CustomerService(repository)  # type: ignore[arg-type]
    owner_user_id = uuid.uuid4()
    another_user_id = uuid.uuid4()
    customer_id = uuid.uuid4()
    repository.customers[customer_id] = SimpleNamespace(id=customer_id, user_id=owner_user_id)

    result = service.delete_customers(user_id=another_user_id, customer_ids=[customer_id])

    assert result.deleted == 0
    assert customer_id in repository.customers
