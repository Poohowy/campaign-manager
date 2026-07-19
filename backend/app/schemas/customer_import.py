from pydantic import BaseModel


class CustomerImportPreview(BaseModel):
    headers: list[str]
    preview: list[dict[str, str]]
    row_count: int
