import uuid
from types import SimpleNamespace

from app.schemas.customer_import import CustomerImportMapping
from app.services.customer_service import CustomerService


class FakeCustomerRepository:
    def __init__(self) -> None:
        self.customers: dict[str, SimpleNamespace] = {}

    def get_by_user_and_external_id(self, user_id: uuid.UUID, external_id: str):
        customer = self.customers.get(external_id)
        if customer is None:
            return None
        if customer.user_id != user_id:
            return None
        return customer

    def create(self, *, user_id: uuid.UUID, **values: object):
        customer = SimpleNamespace(user_id=user_id, **values)
        self.customers[customer.external_id] = customer
        return customer

    def update(self, entity: SimpleNamespace, **values: object):
        for field, value in values.items():
            setattr(entity, field, value)
        return entity


def test_import_customers_creates_new_customers() -> None:
    repository = FakeCustomerRepository()
    service = CustomerService(repository)  # type: ignore[arg-type]
    user_id = uuid.uuid4()

    result = service.import_customers(
        user_id=user_id,
        file_content=(
            b"external_id,company_name,email\n"
            b"ext-1,ACME,hello@acme.com\n"
            b"ext-2,Globex,hello@globex.com\n"
        ),
        mapping=CustomerImportMapping(
            external_id="external_id",
            company_name="company_name",
            email="email",
        ),
    )

    assert result.imported == 2
    assert result.updated == 0
    assert result.skipped == 0
    assert set(repository.customers.keys()) == {"ext-1", "ext-2"}


def test_import_customers_updates_existing_and_preserves_unmapped_data() -> None:
    repository = FakeCustomerRepository()
    service = CustomerService(repository)  # type: ignore[arg-type]
    user_id = uuid.uuid4()
    repository.customers["ext-1"] = SimpleNamespace(
        user_id=user_id,
        external_id="ext-1",
        email="old@acme.com",
        company_name="Old ACME",
        contact_name="Legacy Contact",
        phone="111",
        custom_fields={"legacy_field": "legacy-value"},
    )

    result = service.import_customers(
        user_id=user_id,
        file_content=(
            b"external_id,company_name,email,favorite_color\n"
            b"ext-1,ACME,new@acme.com,blue\n"
        ),
        mapping=CustomerImportMapping(
            external_id="external_id",
            company_name="company_name",
            email="email",
        ),
    )

    assert result.imported == 0
    assert result.updated == 1
    assert result.skipped == 0

    updated_customer = repository.customers["ext-1"]
    assert updated_customer.company_name == "ACME"
    assert updated_customer.email == "new@acme.com"
    assert updated_customer.contact_name == "Legacy Contact"
    assert updated_customer.custom_fields == {
        "legacy_field": "legacy-value",
        "favorite_color": "blue",
    }


def test_import_customers_skips_invalid_rows() -> None:
    repository = FakeCustomerRepository()
    service = CustomerService(repository)  # type: ignore[arg-type]
    user_id = uuid.uuid4()

    result = service.import_customers(
        user_id=user_id,
        file_content=(
            b"external_id,company_name,email\n"
            b",ACME,hello@acme.com\n"
            b"ext-1,,hello@acme.com\n"
            b"ext-2,Globex,invalid-email\n"
            b"ext-3,Initech,hello@initech.com\n"
        ),
        mapping=CustomerImportMapping(
            external_id="external_id",
            company_name="company_name",
            email="email",
        ),
    )

    assert result.imported == 1
    assert result.updated == 0
    assert result.skipped == 3
    assert set(repository.customers.keys()) == {"ext-3"}
