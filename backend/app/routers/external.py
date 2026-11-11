from fastapi import APIRouter

from app.core.errors import AppError

router = APIRouter(tags=["external"])


@router.api_route(
    "/api/external/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def external_placeholder(path: str) -> dict[str, object]:
    _ = path
    raise AppError(
        code="EXTERNAL_NOT_CONFIGURED",
        message="The secondary simulation API is not configured yet.",
        status=503,
    )
