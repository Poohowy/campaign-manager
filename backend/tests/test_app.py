from app.main import app


def test_app_metadata() -> None:
    assert app.title == "Campaign Manager API"
