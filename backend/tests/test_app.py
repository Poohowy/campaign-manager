from fastapi.testclient import TestClient

from app.main import app


def test_app_metadata() -> None:
    assert app.title == "Campaign Manager API"


def test_health_endpoint_available() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/health")

    assert response.status_code in {200, 503}
    payload = response.json()

    assert "status" in payload
    assert "supabase_configured" in payload
    assert "supabase_connected" in payload
