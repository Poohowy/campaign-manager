import smtplib
import uuid
from types import SimpleNamespace

import pytest
from cryptography.fernet import Fernet

from app.schemas.smtp_settings import SMTPSettingsUpsertRequest, SMTPTestRequest
from app.services.smtp_service import (
    SMTPPasswordRequiredError,
    SMTPService,
    SMTPSettingsNotFoundError,
)

ENCRYPTION_KEY = Fernet.generate_key().decode("utf-8")


class FakeSMTPSettingsRepository:
    def __init__(self) -> None:
        self.settings_by_user: dict[uuid.UUID, SimpleNamespace] = {}

    def get_by_user(self, user_id: uuid.UUID) -> SimpleNamespace | None:
        return self.settings_by_user.get(user_id)

    def create(self, **values: object) -> SimpleNamespace:
        entity = SimpleNamespace(id=uuid.uuid4(), **values)
        self.settings_by_user[entity.user_id] = entity
        return entity

    def update(self, entity: SimpleNamespace, **values: object) -> SimpleNamespace:
        for key, value in values.items():
            setattr(entity, key, value)
        return entity


def test_upsert_creates_one_smtp_configuration_per_user() -> None:
    repository = FakeSMTPSettingsRepository()
    service = SMTPService(repository=repository, encryption_key=ENCRYPTION_KEY)
    user_id = uuid.uuid4()

    service.upsert_settings(
        user_id=user_id,
        payload=SMTPSettingsUpsertRequest(
            host="smtp.gmail.com",
            port=587,
            username="john@example.com",
            password="secret",
            from_name="John",
            from_email="john@example.com",
            use_tls=True,
        ),
    )
    service.upsert_settings(
        user_id=user_id,
        payload=SMTPSettingsUpsertRequest(
            host="smtp.office365.com",
            port=587,
            username="john@example.com",
            password=None,
            from_name="John Updated",
            from_email="john@example.com",
            use_tls=True,
        ),
    )

    assert len(repository.settings_by_user) == 1
    assert repository.settings_by_user[user_id].host == "smtp.office365.com"


def test_upsert_requires_password_for_first_save() -> None:
    repository = FakeSMTPSettingsRepository()
    service = SMTPService(repository=repository, encryption_key=ENCRYPTION_KEY)

    with pytest.raises(SMTPPasswordRequiredError):
        service.upsert_settings(
            user_id=uuid.uuid4(),
            payload=SMTPSettingsUpsertRequest(
                host="smtp.gmail.com",
                port=587,
                username="john@example.com",
                password=None,
                from_name="John",
                from_email="john@example.com",
                use_tls=True,
            ),
        )


def test_encrypt_and_decrypt_password_round_trip() -> None:
    repository = FakeSMTPSettingsRepository()
    service = SMTPService(repository=repository, encryption_key=ENCRYPTION_KEY)

    encrypted = service.encrypt_password("plain-secret")
    decrypted = service.decrypt_password(encrypted)

    assert encrypted != "plain-secret"
    assert decrypted == "plain-secret"


def test_send_test_email_uses_decrypted_password(monkeypatch: pytest.MonkeyPatch) -> None:
    repository = FakeSMTPSettingsRepository()
    service = SMTPService(repository=repository, encryption_key=ENCRYPTION_KEY)
    user_id = uuid.uuid4()
    service.upsert_settings(
        user_id=user_id,
        payload=SMTPSettingsUpsertRequest(
            host="smtp.gmail.com",
            port=587,
            username="john@example.com",
            password="smtp-secret",
            from_name="John",
            from_email="john@example.com",
            use_tls=True,
        ),
    )

    captured: dict[str, object] = {}

    class FakeSMTP:
        def __init__(self, host: str, port: int, timeout: int):
            captured["host"] = host
            captured["port"] = port
            captured["timeout"] = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def starttls(self) -> None:
            captured["tls"] = True

        def login(self, username: str, password: str) -> None:
            captured["username"] = username
            captured["password"] = password

        def send_message(self, message) -> None:
            captured["subject"] = message["Subject"]
            captured["to"] = message["To"]

    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)

    service.send_test_email(
        user_id=user_id,
        payload=SMTPTestRequest(recipient="recipient@example.com"),
    )

    assert captured["host"] == "smtp.gmail.com"
    assert captured["port"] == 587
    assert captured["tls"] is True
    assert captured["username"] == "john@example.com"
    assert captured["password"] == "smtp-secret"
    assert captured["subject"] == "Campaign Manager SMTP Test"
    assert captured["to"] == "recipient@example.com"


def test_send_test_email_enforces_user_ownership() -> None:
    repository = FakeSMTPSettingsRepository()
    service = SMTPService(repository=repository, encryption_key=ENCRYPTION_KEY)
    owner_id = uuid.uuid4()
    another_user_id = uuid.uuid4()
    service.upsert_settings(
        user_id=owner_id,
        payload=SMTPSettingsUpsertRequest(
            host="smtp.gmail.com",
            port=587,
            username="owner@example.com",
            password="owner-secret",
            from_name="Owner",
            from_email="owner@example.com",
            use_tls=True,
        ),
    )

    with pytest.raises(SMTPSettingsNotFoundError):
        service.send_test_email(
            user_id=another_user_id,
            payload=SMTPTestRequest(recipient="recipient@example.com"),
        )
