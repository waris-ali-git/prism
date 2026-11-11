from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.ratelimit import extract_client_ip, lesson_rate_limiter
from app.models.api import LessonRequest, LessonResponse
from app.services.lesson_service import create_lesson_from_topic

router = APIRouter(tags=["lesson"])


@router.post("/api/lesson", response_model=LessonResponse)
async def create_lesson(payload: LessonRequest, request: Request) -> LessonResponse:
    settings = get_settings()
    lesson_rate_limiter.check(
        key=extract_client_ip(request),
        max_requests=settings.RATE_LIMIT_LESSON_PER_MIN,
    )
    if payload.topic is not None:
        return await create_lesson_from_topic(payload.topic, settings=settings)

    raise AppError(
        code="CONFIG_MISSING",
        message="Photo-to-lesson pipeline will be wired in phase B5.",
        status=503,
    )
