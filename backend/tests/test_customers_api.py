import uuid
from datetime import UTC, datetime
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user_id
from app.api.routes.customers import get_customer_service
from app.main import app


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
