import uuid
from collections.abc import Callable
from functools import lru_cache
from typing import Any

from app.core.config import get_settings

SupabaseClientFactory = Callable[[], Any]


@lru_cache
def get_supabase_client() -> Any | None:
    settings = get_settings()

    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None

    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def verify_supabase_connection(
    client_factory: SupabaseClientFactory = get_supabase_client,
) -> tuple[bool, str | None]:
    try:
        client = client_factory()
    except Exception as exc:  # pragma: no cover - defensive startup guard
        return False, f"Unable to initialize Supabase client: {exc}"

    if client is None:
        return False, "Supabase credentials are not configured."

    try:
        client.auth.admin.list_users(page=1, per_page=1)
        return True, None
    except Exception as exc:
        return False, f"Supabase connectivity check failed: {exc}"


def get_user_id_from_access_token(
    access_token: str,
    client_factory: SupabaseClientFactory = get_supabase_client,
) -> uuid.UUID | None:
    try:
        client = client_factory()
    except Exception:
        return None

    if client is None:
        return None

    try:
        response = client.auth.get_user(access_token)
        user = getattr(response, "user", None)
        user_id = getattr(user, "id", None)
        if user_id is None:
            return None
        return uuid.UUID(str(user_id))
    except Exception:
        return None
