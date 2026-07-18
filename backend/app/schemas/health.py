from pydantic import BaseModel


class HealthStatusResponse(BaseModel):
    status: str
    environment: str
    supabase_configured: bool
    supabase_connected: bool
    detail: str | None = None
