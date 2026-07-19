import uuid
from datetime import UTC, datetime
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user_id
from app.api.routes.templates import get_template_service
from app.db.session import get_db_session
from app.main import app


def _fake_template(*, template_id: uuid.UUID, user_id: uuid.UUID, name: str) -> SimpleNamespace:
    now = datetime.now(UTC)
    return SimpleNamespace(
        id=template_id,
        user_id=user_id,
        name=name,
        description=None,
        subject=f"Subject {name}",
        body_markdown=f"Body {name}",
        created_at=now,
        updated_at=now,
    )


def test_list_templates_returns_data_envelope() -> None:
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()

    class FakeService:
        def list_templates(self, *, user_id: uuid.UUID):
            return [_fake_template(template_id=template_id, user_id=user_id, name="Welcome")]

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_template_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get("/api/v1/templates")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"][0]["id"] == str(template_id)
    assert response.json()["data"][0]["name"] == "Welcome"


def test_create_template_returns_created_template() -> None:
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def create_template(self, *, user_id: uuid.UUID, payload):
            assert payload.name == "Welcome"
            return _fake_template(template_id=template_id, user_id=user_id, name="Welcome")

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_template_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(
        "/api/v1/templates",
        json={
            "name": "Welcome",
            "subject": "Hello",
            "body_markdown": "# Welcome",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["data"]["id"] == str(template_id)
    assert response.json()["data"]["name"] == "Welcome"


def test_update_template_returns_updated_template() -> None:
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def update_template(self, *, user_id: uuid.UUID, template_id: uuid.UUID, payload):
            assert payload.name == "Updated"
            return _fake_template(template_id=template_id, user_id=user_id, name="Updated")

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_template_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.put(
        f"/api/v1/templates/{template_id}",
        json={
            "name": "Updated",
            "subject": "Updated subject",
            "body_markdown": "Updated body",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(template_id)
    assert response.json()["data"]["name"] == "Updated"


def test_delete_template_returns_deleted_true() -> None:
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def delete_template(self, *, user_id: uuid.UUID, template_id: uuid.UUID) -> bool:
            return True

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_template_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.delete(f"/api/v1/templates/{template_id}")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"data": {"deleted": True}}


def test_template_endpoints_hide_other_users_templates() -> None:
    user_id = uuid.uuid4()
    template_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def get_template_by_id(self, *, user_id: uuid.UUID, template_id: uuid.UUID):
            return None

        def update_template(self, *, user_id: uuid.UUID, template_id: uuid.UUID, payload):
            return None

        def delete_template(self, *, user_id: uuid.UUID, template_id: uuid.UUID) -> bool:
            return False

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_template_service] = lambda: FakeService()

    client = TestClient(app)
    get_response = client.get(f"/api/v1/templates/{template_id}")
    put_response = client.put(
        f"/api/v1/templates/{template_id}",
        json={
            "name": "Updated",
            "subject": "Updated",
            "body_markdown": "Updated",
        },
    )
    delete_response = client.delete(f"/api/v1/templates/{template_id}")

    app.dependency_overrides.clear()

    assert get_response.status_code == 404
    assert put_response.status_code == 404
    assert delete_response.status_code == 404
    assert get_response.json()["error"]["code"] == "TEMPLATE_NOT_FOUND"
    assert put_response.json()["error"]["code"] == "TEMPLATE_NOT_FOUND"
    assert delete_response.json()["error"]["code"] == "TEMPLATE_NOT_FOUND"
