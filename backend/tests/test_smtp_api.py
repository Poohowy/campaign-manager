import uuid

from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user_id
from app.api.routes.smtp import get_smtp_service
from app.db.session import get_db_session
from app.main import app
from app.schemas.smtp_settings import SMTPSettingsRead
from app.services.smtp_service import SMTPPasswordRequiredError, SMTPSettingsNotFoundError


def test_get_smtp_settings_returns_null_when_not_configured() -> None:
    user_id = uuid.uuid4()

    class FakeService:
        def get_settings(self, *, user_id: uuid.UUID):
            return None

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_smtp_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get("/api/v1/smtp")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"data": None}


def test_put_smtp_settings_returns_saved_true() -> None:
    user_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def upsert_settings(self, *, user_id: uuid.UUID, payload):
            assert payload.host == "smtp.gmail.com"

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_smtp_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.put(
        "/api/v1/smtp",
        json={
            "host": "smtp.gmail.com",
            "port": 587,
            "username": "john@example.com",
            "password": "secret",
            "from_name": "John",
            "from_email": "john@example.com",
            "use_tls": True,
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"data": {"saved": True}}


def test_get_smtp_settings_never_returns_password() -> None:
    user_id = uuid.uuid4()

    class FakeService:
        def get_settings(self, *, user_id: uuid.UUID):
            return SMTPSettingsRead(
                host="smtp.gmail.com",
                port=587,
                username="john@example.com",
                from_name="John",
                from_email="john@example.com",
                use_tls=True,
            )

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_smtp_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get("/api/v1/smtp")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert "password" not in response.text
    assert "password_encrypted" not in response.text


def test_put_smtp_settings_requires_password_on_first_save() -> None:
    user_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def upsert_settings(self, *, user_id: uuid.UUID, payload):
            raise SMTPPasswordRequiredError

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_smtp_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.put(
        "/api/v1/smtp",
        json={
            "host": "smtp.gmail.com",
            "port": 587,
            "username": "john@example.com",
            "password": None,
            "from_name": "John",
            "from_email": "john@example.com",
            "use_tls": True,
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "SMTP_PASSWORD_REQUIRED",
            "message": "Password is required.",
        }
    }


def test_post_smtp_test_returns_success() -> None:
    user_id = uuid.uuid4()

    class FakeService:
        def send_test_email(self, *, user_id: uuid.UUID, payload):
            assert payload.recipient == "recipient@example.com"

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_smtp_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(
        "/api/v1/smtp/test",
        json={"recipient": "recipient@example.com"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"data": {"success": True}}


def test_post_smtp_test_enforces_ownership() -> None:
    user_id = uuid.uuid4()

    class FakeService:
        def send_test_email(self, *, user_id: uuid.UUID, payload):
            raise SMTPSettingsNotFoundError

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_smtp_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(
        "/api/v1/smtp/test",
        json={"recipient": "recipient@example.com"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "SMTP_SETTINGS_NOT_FOUND",
            "message": "SMTP settings are not configured.",
        }
    }
