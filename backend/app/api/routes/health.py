from fastapi import APIRouter, Response

from app.schemas.health import HealthStatusResponse
from app.services.health import get_health_status

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatusResponse)
def health_check(response: Response) -> HealthStatusResponse:
    payload, status_code = get_health_status()
    response.status_code = status_code
    return payload
