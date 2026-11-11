from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.ratelimit import extract_client_ip, lesson_rate_limiter
from app.models.api import LessonRequest

router = APIRouter(tags=["lesson"])


@router.post("/api/lesson")
async def create_lesson(payload: LessonRequest, request: Request) -> dict[str, object]:
    settings = get_settings()
    lesson_rate_limiter.check(
        key=extract_client_ip(request),
        max_requests=settings.RATE_LIMIT_LESSON_PER_MIN,
    )
    if not settings.gemini_configured:
        raise AppError(
            code="CONFIG_MISSING",
            message="Gemini API is not configured on the server. Set GEMINI_API_KEY and GEMINI_MODEL.",
            status=503,
        )
    raise AppError(
        code="CONFIG_MISSING",
        message="Lesson generation pipeline will be wired in phase B3.",
        status=503,
    )
