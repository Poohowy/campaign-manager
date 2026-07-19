import re

from pydantic import BaseModel, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SMTPSettingsRead(BaseModel):
    host: str | None
    port: int | None
    username: str | None
    from_name: str | None
    from_email: str | None
    use_tls: bool


class SMTPSettingsUpsertRequest(BaseModel):
    host: str
    port: int = Field(ge=1, le=65535)
    username: str
    password: str | None = None
    from_name: str
    from_email: str
    use_tls: bool

    @field_validator("host", "username", "from_name", mode="before")
    @classmethod
    def normalize_required_strings(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned

    @field_validator("from_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip()
        if not EMAIL_PATTERN.fullmatch(cleaned):
            raise ValueError("Enter a valid email address.")
        return cleaned


class SMTPSettingsSaveResult(BaseModel):
    saved: bool


class SMTPTestRequest(BaseModel):
    recipient: str

    @field_validator("recipient")
    @classmethod
    def validate_recipient(cls, value: str) -> str:
        cleaned = value.strip()
        if not EMAIL_PATTERN.fullmatch(cleaned):
            raise ValueError("Enter a valid email address.")
        return cleaned


class SMTPTestResult(BaseModel):
    success: bool
