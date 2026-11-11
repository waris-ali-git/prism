from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from app.core.config import get_settings
from app.core.errors import AppError
from app.services.external_api import external_service

router = APIRouter(tags=["external"])


class ExternalSimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str
    params: dict[str, Any] | None = None


@router.post("/api/external/simulation")
async def post_external_simulation(payload: ExternalSimulationRequest) -> dict[str, Any]:
    settings = get_settings()
    if not settings.external_configured:
        raise AppError(
            code="EXTERNAL_NOT_CONFIGURED",
            message="The external simulation API is not configured.",
            status=503,
        )

    return await external_service.generate_simulation(payload.topic, payload.params)


@router.api_route(
    "/api/external/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def external_fallback(path: str) -> dict[str, object]:
    _ = path
    raise AppError(
        code="EXTERNAL_NOT_CONFIGURED",
        message="Endpoint not supported or external simulation API not configured.",
        status=503,
    )
