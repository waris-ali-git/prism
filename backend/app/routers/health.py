from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.core.versions import APP_VERSION, SCHEMA_VERSION
from app.models.api import HealthResponse
from app.services.firestore import check_firestore_health

router = APIRouter(tags=["health"])


@router.get("/api/health", response_model=HealthResponse)
async def get_health(request: Request) -> HealthResponse:
    settings = getattr(request.app.state, "settings", None) or get_settings()
    firestore_state = await check_firestore_health()
    # Normalize to literal "ok" | "error"
    fs_status = "ok" if firestore_state == "ok" else "error"
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        schemaVersion=SCHEMA_VERSION,
        gemini="configured" if settings.gemini_configured else "missing",
        firestore=fs_status,
        external="configured" if settings.external_configured else "not_configured",
    )
