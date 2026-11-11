import re
from datetime import datetime, timezone

from fastapi import APIRouter, Request, status

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.ratelimit import extract_client_ip, result_rate_limiter
from app.models.api import ResultRequest, ResultResponse, StatsResponse, TopicStatItem
from app.services.firestore import get_topic_stats, record_quiz_result

router = APIRouter(tags=["stats"])

_CONTROL_CHARS_RE = re.compile(r"[\x00-\x1f\x7f-\x9f<>]")


def sanitize_nickname(raw: str | None) -> str | None:
    if not raw:
        return None
    cleaned = _CONTROL_CHARS_RE.sub("", raw).strip()
    return cleaned[:24] if cleaned else None


@router.post("/api/result", response_model=ResultResponse, status_code=status.HTTP_201_CREATED)
async def post_quiz_result(payload: ResultRequest, request: Request) -> ResultResponse:
    settings = get_settings()
    result_rate_limiter.check(
        key=extract_client_ip(request),
        max_requests=settings.RATE_LIMIT_RESULT_PER_MIN,
    )

    clean_nick = sanitize_nickname(payload.nickname)
    success = await record_quiz_result(
        topic_key=payload.topicKey,
        topic=payload.topic,
        score=payload.score,
        total=payload.total,
        nickname=clean_nick,
        prefix=settings.COLLECTION_PREFIX,
    )

    if success is False:
        raise AppError(
            code="NOT_FOUND",
            message=f"Topic '{payload.topicKey}' does not exist in lessons.",
            status=404,
        )
    if success is None:
        raise AppError(
            code="INTERNAL_ERROR",
            message="Failed to record quiz result.",
            status=500,
        )

    return ResultResponse(ok=True)


@router.get("/api/stats", response_model=StatsResponse)
async def get_stats() -> StatsResponse:
    settings = get_settings()
    items = await get_topic_stats(prefix=settings.COLLECTION_PREFIX)
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return StatsResponse(
        topics=[TopicStatItem(**item) for item in items],
        generatedAt=now_iso,
    )
