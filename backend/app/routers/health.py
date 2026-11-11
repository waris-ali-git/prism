from fastapi import APIRouter

from app.core.versions import APP_VERSION, SCHEMA_VERSION

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def get_health() -> dict[str, object]:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "gemini": "missing",
        "firestore": "error",
        "external": "not_configured",
    }
