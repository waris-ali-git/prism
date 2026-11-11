import asyncio
from typing import Literal

from fastapi import APIRouter

from app.core.config import get_settings
from app.core.versions import APP_VERSION, SCHEMA_VERSION
from app.models.api import HealthResponse

router = APIRouter(tags=["health"])


async def _check_firestore_status() -> Literal["ok", "error"]:
    settings = get_settings()
    if not settings.firestore_credentials_present:
        return "error"
    try:
        from app.services import firestore as firestore_svc

        checker = getattr(firestore_svc, "ping_firestore", None)
        if checker is None:
            return "error"
        ok = await asyncio.wait_for(checker(), timeout=2.0)
        return "ok" if ok else "error"
    except Exception:
        return "error"


@router.get("/api/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    settings = get_settings()
    firestore_state = await _check_firestore_status()
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        schemaVersion=SCHEMA_VERSION,
        gemini="configured" if settings.gemini_configured else "missing",
        firestore=firestore_state,
        external="configured" if settings.external_configured else "not_configured",
    )
