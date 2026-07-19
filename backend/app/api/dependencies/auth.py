import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.supabase import get_user_id_from_access_token

bearer_scheme = HTTPBearer(auto_error=False)
BearerCredentialsDep = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


def get_current_user_id(
    credentials: BearerCredentialsDep,
) -> uuid.UUID | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None

    return get_user_id_from_access_token(credentials.credentials)
