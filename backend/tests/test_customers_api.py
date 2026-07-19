import uuid
from datetime import UTC, datetime
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user_id
from app.api.routes.customers import get_customer_import_service, get_customer_service
from app.db.session import get_db_session
from app.main import app
from app.schemas.customer import CustomerDeleteResult
from app.schemas.customer_import import CustomerImportMapping, CustomerImportPreview


def test_get_customers_returns_paginated_data() -> None:
    user_id = uuid.uuid4()
    customer_id = uuid.uuid4()

    fake_customer = SimpleNamespace(
        id=customer_id,
        user_id=user_id,
        external_id="ext-1",
        email="customer@example.com",
        company_name="ACME",
        contact_name="Jane Doe",
        phone=None,
        custom_fields={},
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )

    class FakeService:
        def list_customers(self, **kwargs):
            assert kwargs["user_id"] == user_id
            return [fake_customer], 1

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_customer_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get("/api/v1/customers?page=1&page_size=20")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["data"]) == 1
    assert payload["data"][0]["id"] == str(customer_id)
    assert payload["pagination"] == {
        "page": 1,
        "page_size": 20,
        "total": 1,
        "total_pages": 1,
    }


def test_get_customers_requires_authentication() -> None:
    class FakeService:
        def list_customers(self, **kwargs):
            return [], 0

    app.dependency_overrides[get_current_user_id] = lambda: None
    app.dependency_overrides[get_customer_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get("/api/v1/customers")

    app.dependency_overrides.clear()

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Unauthorized.",
        }
    }


def test_preview_customer_import_returns_data_envelope() -> None:
    user_id = uuid.uuid4()
    csv_payload = "external_id,company_name,email\next-1,ACME,hello@acme.com\n"

    class FakeImportService:
        def generate_preview(self, *, file_content: bytes) -> CustomerImportPreview:
            assert file_content.decode("utf-8") == csv_payload
            return CustomerImportPreview(
                headers=["external_id", "company_name", "email"],
                preview=[
                    {
                        "external_id": "ext-1",
                        "company_name": "ACME",
                        "email": "hello@acme.com",
                    }
                ],
                row_count=1,
            )

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_customer_import_service] = lambda: FakeImportService()

    client = TestClient(app)
    response = client.post(
        "/api/v1/customers/import/preview",
        files={"file": ("customers.csv", csv_payload)},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "headers": ["external_id", "company_name", "email"],
            "preview": [
                {
                    "external_id": "ext-1",
                    "company_name": "ACME",
                    "email": "hello@acme.com",
                }
            ],
            "row_count": 1,
        }
    }


def test_preview_customer_import_requires_authentication() -> None:
    csv_payload = "external_id,company_name,email\next-1,ACME,hello@acme.com\n"
    app.dependency_overrides[get_current_user_id] = lambda: None

    client = TestClient(app)
    response = client.post(
        "/api/v1/customers/import/preview",
        files={"file": ("customers.csv", csv_payload)},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Unauthorized.",
        }
    }


def test_preview_customer_import_requires_file() -> None:
    user_id = uuid.uuid4()
    app.dependency_overrides[get_current_user_id] = lambda: user_id

    client = TestClient(app)
    response = client.post("/api/v1/customers/import/preview")

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "CSV_FILE_REQUIRED",
            "message": "CSV file is required.",
        }
    }


def test_preview_customer_import_invalid_csv_returns_error_envelope() -> None:
    user_id = uuid.uuid4()
    app.dependency_overrides[get_current_user_id] = lambda: user_id

    client = TestClient(app)
    response = client.post(
        "/api/v1/customers/import/preview",
        files={"file": ("customers.csv", b"external_id,email\nrow\x00value,hello@acme.com")},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "CSV_FILE_INVALID",
            "message": "CSV file contains invalid characters.",
        }
    }


def test_import_customers_returns_summary_envelope() -> None:
    user_id = uuid.uuid4()
    csv_payload = "external_id,company_name,email\next-1,ACME,hello@acme.com\n"
    mapping_payload = '{"external_id":"external_id","company_name":"company_name","email":"email"}'

    class FakeSession:
        def commit(self) -> None:
            return None

        def rollback(self) -> None:
            return None

    class FakeService:
        def import_customers(self, **kwargs):
            assert kwargs["user_id"] == user_id
            assert kwargs["file_content"].decode("utf-8") == csv_payload
            assert isinstance(kwargs["mapping"], CustomerImportMapping)
            return {
                "imported": 1,
                "updated": 0,
                "skipped": 0,
            }

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_customer_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(
        "/api/v1/customers/import",
        data={"mapping": mapping_payload},
        files={"file": ("customers.csv", csv_payload)},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "imported": 1,
            "updated": 0,
            "skipped": 0,
        }
    }


def test_import_customers_requires_mapping() -> None:
    user_id = uuid.uuid4()
    csv_payload = "external_id,company_name,email\next-1,ACME,hello@acme.com\n"

    class FakeSession:
        def commit(self) -> None:
            return None

        def rollback(self) -> None:
            return None

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()

    client = TestClient(app)
    response = client.post(
        "/api/v1/customers/import",
        files={"file": ("customers.csv", csv_payload)},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "IMPORT_MAPPING_REQUIRED",
            "message": "Column mapping is required.",
        }
    }


def test_import_customers_rejects_invalid_mapping_payload() -> None:
    user_id = uuid.uuid4()
    csv_payload = "external_id,company_name,email\next-1,ACME,hello@acme.com\n"

    class FakeSession:
        def commit(self) -> None:
            return None

        def rollback(self) -> None:
            return None

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()

    client = TestClient(app)
    response = client.post(
        "/api/v1/customers/import",
        data={"mapping": '{"external_id":"","company_name":"company_name","email":"email"}'},
        files={"file": ("customers.csv", csv_payload)},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "IMPORT_MAPPING_INVALID",
            "message": "Column mapping is invalid.",
        }
    }


def test_delete_customers_returns_deleted_count_envelope() -> None:
    user_id = uuid.uuid4()
    customer_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def delete_customers(self, *, user_id: uuid.UUID, customer_ids: list[uuid.UUID]):
            assert customer_ids == [customer_id]
            return CustomerDeleteResult(deleted=1)

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_customer_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.request(
        "DELETE",
        "/api/v1/customers",
        json={"ids": [str(customer_id)]},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"data": {"deleted": 1}}


def test_delete_customers_requires_ids() -> None:
    user_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def delete_customers(self, *, user_id: uuid.UUID, customer_ids: list[uuid.UUID]):
            return CustomerDeleteResult(deleted=0)

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_customer_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.request(
        "DELETE",
        "/api/v1/customers",
        json={"ids": []},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "CUSTOMER_IDS_REQUIRED",
            "message": "At least one customer ID is required.",
        }
    }
