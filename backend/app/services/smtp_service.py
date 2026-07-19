import smtplib
import uuid
from email.message import EmailMessage

from cryptography.fernet import Fernet, InvalidToken

from app.repositories.smtp_settings_repository import SMTPSettingsRepository
from app.schemas.smtp_settings import SMTPSettingsRead, SMTPSettingsUpsertRequest, SMTPTestRequest


class SMTPSettingsNotFoundError(Exception):
    pass


class SMTPPasswordRequiredError(Exception):
    pass


class SMTPEncryptionKeyError(Exception):
    pass


class SMTPTestFailedError(Exception):
    pass


class SMTPSendFailedError(Exception):
    pass


class SMTPService:
    def __init__(self, repository: SMTPSettingsRepository, encryption_key: str | None):
        self.repository = repository
        self.encryption_key = encryption_key

    def get_settings(self, *, user_id: uuid.UUID) -> SMTPSettingsRead | None:
        settings = self.repository.get_by_user(user_id)
        if settings is None:
            return None

        return SMTPSettingsRead(
            host=settings.host,
            port=settings.port,
            username=settings.username,
            from_name=settings.from_name,
            from_email=settings.from_email,
            use_tls=settings.use_tls,
        )

    def upsert_settings(self, *, user_id: uuid.UUID, payload: SMTPSettingsUpsertRequest) -> None:
        existing = self.repository.get_by_user(user_id)

        encrypted_password = existing.password_encrypted if existing is not None else None
        if payload.password is not None and payload.password.strip():
            encrypted_password = self.encrypt_password(payload.password.strip())
        elif encrypted_password is None:
            raise SMTPPasswordRequiredError

        values = {
            "host": payload.host,
            "port": payload.port,
            "username": payload.username,
            "password_encrypted": encrypted_password,
            "from_name": payload.from_name,
            "from_email": str(payload.from_email),
            "use_tls": payload.use_tls,
        }
        if existing is None:
            self.repository.create(user_id=user_id, **values)
            return

        self.repository.update(existing, **values)

    def send_test_email(self, *, user_id: uuid.UUID, payload: SMTPTestRequest) -> None:
        try:
            self.send_email(
                user_id=user_id,
                recipient=str(payload.recipient),
                subject="Campaign Manager SMTP Test",
                body="This is a test email sent from Campaign Manager.",
            )
        except SMTPSendFailedError as error:
            raise SMTPTestFailedError(
                "Unable to send test email. Check SMTP settings and try again."
            ) from error

    def send_email(
        self,
        *,
        user_id: uuid.UUID,
        recipient: str,
        subject: str,
        body: str,
    ) -> None:
        settings = self.repository.get_by_user(user_id)
        if settings is None:
            raise SMTPSettingsNotFoundError

        required = [settings.host, settings.port, settings.username, settings.password_encrypted]
        if any(value in (None, "") for value in required):
            raise SMTPSettingsNotFoundError
        if not settings.from_email:
            raise SMTPSettingsNotFoundError

        password = self.decrypt_password(settings.password_encrypted or "")
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.from_email
        message["To"] = recipient
        message.set_content(body)

        try:
            with smtplib.SMTP(settings.host, int(settings.port), timeout=15) as smtp:
                if settings.use_tls:
                    smtp.starttls()
                smtp.login(settings.username, password)
                smtp.send_message(message)
        except (smtplib.SMTPException, OSError, ValueError) as error:
            raise SMTPSendFailedError(
                "Unable to send email. Check SMTP settings and try again."
            ) from error

    def encrypt_password(self, password: str) -> str:
        fernet = self._build_fernet()
        return fernet.encrypt(password.encode("utf-8")).decode("utf-8")

    def decrypt_password(self, encrypted_password: str) -> str:
        fernet = self._build_fernet()
        try:
            return fernet.decrypt(encrypted_password.encode("utf-8")).decode("utf-8")
        except InvalidToken as error:
            raise SMTPEncryptionKeyError from error

    def _build_fernet(self) -> Fernet:
        if not self.encryption_key:
            raise SMTPEncryptionKeyError

        try:
            return Fernet(self.encryption_key.encode("utf-8"))
        except ValueError as error:
            raise SMTPEncryptionKeyError from error
