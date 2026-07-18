from app.core.config import get_settings
from app.core.supabase import verify_supabase_connection
from app.schemas.health import HealthStatusResponse


def get_health_status() -> tuple[HealthStatusResponse, int]:
    settings = get_settings()

    supabase_configured = bool(settings.supabase_url and settings.supabase_service_role_key)
    supabase_connected, detail = verify_supabase_connection()

    if supabase_configured and supabase_connected:
        return (
            HealthStatusResponse(
                status="ok",
                environment=settings.environment,
                supabase_configured=True,
                supabase_connected=True,
                detail=None,
            ),
            200,
        )

    return (
        HealthStatusResponse(
            status="degraded",
            environment=settings.environment,
            supabase_configured=supabase_configured,
            supabase_connected=False,
            detail=detail,
        ),
        503,
    )
