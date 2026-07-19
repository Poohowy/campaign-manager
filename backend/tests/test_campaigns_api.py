import uuid
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user_id
from app.api.routes.campaigns import get_campaign_service
from app.db.enums import CampaignMessageStatus, CampaignStatus
from app.db.session import get_db_session
from app.main import app
from app.schemas.campaign import CampaignRead, CampaignSendResult
from app.schemas.campaign_message import CampaignMessageRead
from app.services.campaign_service import (
    CampaignCustomerNotFoundError,
    CampaignCustomersRequiredError,
    CampaignNotDraftError,
    CampaignNotFoundError,
    CampaignTemplateNotFoundError,
)
from app.services.smtp_service import SMTPSettingsNotFoundError


def _fake_campaign(*, campaign_id: uuid.UUID, user_id: uuid.UUID, name: str) -> CampaignRead:
    now = datetime.now(UTC)
    return CampaignRead(
        id=campaign_id,
        user_id=user_id,
        template_id=uuid.uuid4(),
        template_name="Welcome",
        name=name,
        status=CampaignStatus.draft,
        recipients_count=2,
        customer_ids=[uuid.uuid4(), uuid.uuid4()],
        created_at=now,
        updated_at=now,
        started_at=None,
        finished_at=None,
    )


def test_list_campaigns_returns_data_envelope() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeService:
        def list_campaigns(self, *, user_id: uuid.UUID):
            return [_fake_campaign(campaign_id=campaign_id, user_id=user_id, name="Campaign A")]

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get("/api/v1/campaigns")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"][0]["id"] == str(campaign_id)
    assert response.json()["data"][0]["status"] == "draft"


def test_get_campaign_by_id_returns_campaign() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeService:
        def get_campaign_by_id(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID):
            return _fake_campaign(campaign_id=campaign_id, user_id=user_id, name="Campaign A")

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get(f"/api/v1/campaigns/{campaign_id}")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(campaign_id)
    assert response.json()["data"]["name"] == "Campaign A"


def test_create_campaign_returns_created_campaign() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def create_campaign(self, *, user_id: uuid.UUID, payload):
            assert payload.name == "Campaign A"
            return _fake_campaign(campaign_id=campaign_id, user_id=user_id, name="Campaign A")

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(
        "/api/v1/campaigns",
        json={
            "name": "Campaign A",
            "template_id": str(uuid.uuid4()),
            "customer_ids": [str(uuid.uuid4())],
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["data"]["id"] == str(campaign_id)
    assert response.json()["data"]["status"] == "draft"


def test_delete_campaign_returns_deleted_true() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def delete_campaign(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID) -> bool:
            return True

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.delete(f"/api/v1/campaigns/{campaign_id}")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"data": {"deleted": True}}


def test_campaign_endpoints_hide_other_users_campaigns() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def get_campaign_by_id(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID):
            raise CampaignNotFoundError

        def delete_campaign(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID) -> bool:
            return False

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    get_response = client.get(f"/api/v1/campaigns/{campaign_id}")
    delete_response = client.delete(f"/api/v1/campaigns/{campaign_id}")

    app.dependency_overrides.clear()

    assert get_response.status_code == 404
    assert delete_response.status_code == 404
    assert get_response.json()["error"]["code"] == "CAMPAIGN_NOT_FOUND"
    assert delete_response.json()["error"]["code"] == "CAMPAIGN_NOT_FOUND"


def test_create_campaign_returns_not_found_for_template_and_customer() -> None:
    user_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        error_type = CampaignTemplateNotFoundError

        def create_campaign(self, *, user_id: uuid.UUID, payload):
            raise self.error_type

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    service = FakeService()
    app.dependency_overrides[get_campaign_service] = lambda: service

    client = TestClient(app)
    template_missing_response = client.post(
        "/api/v1/campaigns",
        json={
            "name": "Campaign A",
            "template_id": str(uuid.uuid4()),
            "customer_ids": [str(uuid.uuid4())],
        },
    )

    service.error_type = CampaignCustomerNotFoundError
    customer_missing_response = client.post(
        "/api/v1/campaigns",
        json={
            "name": "Campaign A",
            "template_id": str(uuid.uuid4()),
            "customer_ids": [str(uuid.uuid4())],
        },
    )

    app.dependency_overrides.clear()

    assert template_missing_response.status_code == 404
    assert template_missing_response.json()["error"]["code"] == "TEMPLATE_NOT_FOUND"
    assert customer_missing_response.status_code == 404
    assert customer_missing_response.json()["error"]["code"] == "CUSTOMER_NOT_FOUND"


def test_create_campaign_requires_customer_ids() -> None:
    user_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def create_campaign(self, *, user_id: uuid.UUID, payload):
            raise CampaignCustomersRequiredError

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(
        "/api/v1/campaigns",
        json={
            "name": "Campaign A",
            "template_id": str(uuid.uuid4()),
            "customer_ids": [],
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "CUSTOMER_IDS_REQUIRED",
            "message": "At least one customer ID is required.",
        }
    }


def test_send_campaign_returns_send_result() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def send_campaign(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID):
            return CampaignSendResult(
                campaign_id=campaign_id,
                status=CampaignStatus.completed,
                sent=2,
                failed=0,
            )

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(f"/api/v1/campaigns/{campaign_id}/send")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "campaign_id": str(campaign_id),
            "status": "completed",
            "sent": 2,
            "failed": 0,
        }
    }


def test_send_campaign_returns_conflict_when_not_draft() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def send_campaign(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID):
            raise CampaignNotDraftError

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(f"/api/v1/campaigns/{campaign_id}/send")

    app.dependency_overrides.clear()

    assert response.status_code == 409
    assert response.json() == {
        "error": {
            "code": "CAMPAIGN_NOT_DRAFT",
            "message": "Only draft campaigns can be sent.",
        }
    }


def test_send_campaign_requires_smtp_settings() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeSession:
        def commit(self) -> None:
            return None

    class FakeService:
        def send_campaign(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID):
            raise SMTPSettingsNotFoundError

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_db_session] = lambda: FakeSession()
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.post(f"/api/v1/campaigns/{campaign_id}/send")

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "SMTP_SETTINGS_NOT_FOUND",
            "message": "SMTP settings are not configured.",
        }
    }


def test_list_campaign_messages_returns_data_envelope() -> None:
    user_id = uuid.uuid4()
    campaign_id = uuid.uuid4()

    class FakeService:
        def list_campaign_messages(self, *, user_id: uuid.UUID, campaign_id: uuid.UUID):
            return [
                CampaignMessageRead(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    campaign_id=campaign_id,
                    customer_id=uuid.uuid4(),
                    email="recipient@example.com",
                    subject="Hello",
                    body_markdown="Body",
                    rendered_variables={},
                    status=CampaignMessageStatus.sent,
                    error_message=None,
                    sent_at=datetime.now(UTC),
                    created_at=datetime.now(UTC),
                    updated_at=datetime.now(UTC),
                )
            ]

    app.dependency_overrides[get_current_user_id] = lambda: user_id
    app.dependency_overrides[get_campaign_service] = lambda: FakeService()

    client = TestClient(app)
    response = client.get(f"/api/v1/campaigns/{campaign_id}/messages")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["data"][0]["email"] == "recipient@example.com"
