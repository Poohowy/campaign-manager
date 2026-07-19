from pydantic import BaseModel, Field


class CustomerImportPreview(BaseModel):
    headers: list[str]
    preview: list[dict[str, str]]
    row_count: int


class CustomerImportMapping(BaseModel):
    external_id: str = Field(min_length=1)
    company_name: str = Field(min_length=1)
    email: str = Field(min_length=1)
    contact_name: str | None = None
    phone: str | None = None
    website: str | None = None
    city: str | None = None
    country: str | None = None


class CustomerImportResult(BaseModel):
    imported: int
    updated: int
    skipped: int
