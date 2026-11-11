from fastapi import APIRouter, Query, Request

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.ratelimit import extract_client_ip, lesson_rate_limiter
from app.core.versions import PROMPT_VERSION, SCHEMA_VERSION
from app.models.api import (
    LessonRequest,
    LessonResponse,
    RecentLessonItem,
    RecentLessonsResponse,
)
from app.services.firestore import list_recent_lessons
from app.services.lesson_service import (
    create_lesson_from_image,
    create_lesson_from_topic,
)

router = APIRouter(tags=["lesson"])


@router.post("/api/lesson", response_model=LessonResponse)
async def create_lesson(payload: LessonRequest, request: Request) -> LessonResponse:
    settings = getattr(request.app.state, "settings", None) or get_settings()
    lesson_rate_limiter.check(
        key=extract_client_ip(request),
        max_requests=settings.RATE_LIMIT_LESSON_PER_MIN,
    )
    if payload.topic is not None:
        return await create_lesson_from_topic(payload.topic, settings=settings)

    if payload.imageBase64 is not None:
        return await create_lesson_from_image(
            payload.imageBase64,
            payload.mimeType,
            settings=settings,
        )

    raise AppError(
        code="BAD_REQUEST",
        message="Provide either 'topic' or 'imageBase64'.",
        status=400,
    )


@router.get("/api/lessons", response_model=RecentLessonsResponse)
async def get_recent_lessons(
    limit: int = Query(default=12, ge=1, le=30),
) -> RecentLessonsResponse:
    version_tag = f"s{SCHEMA_VERSION}_p{PROMPT_VERSION}"
    items = await list_recent_lessons(limit=limit, version=version_tag)
    return RecentLessonsResponse(
        lessons=[
            RecentLessonItem(
                topic=item["topic"],
                topicKey=item["topicKey"],
                category=item["category"],
                title=item["title"],
                createdAt=item["createdAt"],
            )
            for item in items
        ]
    )
