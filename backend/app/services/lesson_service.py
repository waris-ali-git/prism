from datetime import datetime, timezone

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.logging import get_logger, get_request_id
from app.models.api import LessonMeta, LessonResponse
from app.services.gemini import GeminiService, gemini_service
from app.services.normalize import normalize_lesson
from app.services.topics import get_hero_spec, sanitize_topic_input, slugify_topic
from app.services.validator import validate_lesson_draft

logger = get_logger("prism.lesson_service")


def validate_topic_input(raw_topic: str) -> str:
    cleaned = sanitize_topic_input(raw_topic)
    if len(cleaned) < 2 or len(cleaned) > 120:
        raise AppError(
            code="BAD_REQUEST",
            message="Topic must be between 2 and 120 characters.",
            status=400,
        )
    return cleaned


async def create_lesson_from_topic(
    raw_topic: str,
    *,
    gemini: GeminiService | None = None,
    settings: Settings | None = None,
) -> LessonResponse:
    cfg = settings or get_settings()
    if not cfg.gemini_configured:
        raise AppError(
            code="CONFIG_MISSING",
            message="Gemini API is not configured on the server. Set GEMINI_API_KEY and GEMINI_MODEL.",
            status=503,
        )

    clean_topic = validate_topic_input(raw_topic)
    topic_key = slugify_topic(clean_topic)
    hero_spec = get_hero_spec(topic_key)
    ai = gemini or gemini_service

    # Step 1: initial Gemini call
    envelope, model_used = await ai.generate_lesson_draft(
        clean_topic, hero_spec=hero_spec
    )
    if not envelope.accepted:
        raise AppError(
            code="TOPIC_NOT_EDUCATIONAL",
            message="Prism only builds school topics. Try something from science, geography or maths.",
            status=422,
        )

    # Step 2: validate; retry once with exact error list on failure
    errors = validate_lesson_draft(envelope.lesson, hero_spec=hero_spec)
    if errors:
        logger.warning(
            f"lesson_validation_retry topic_key={topic_key} error_count={len(errors)}",
            extra={"requestId": get_request_id()},
        )
        envelope, model_used = await ai.generate_lesson_draft(
            clean_topic,
            hero_spec=hero_spec,
            previous_errors=errors,
        )
        if not envelope.accepted:
            raise AppError(
                code="TOPIC_NOT_EDUCATIONAL",
                message="Prism only builds school topics. Try something from science, geography or maths.",
                status=422,
            )
        errors = validate_lesson_draft(envelope.lesson, hero_spec=hero_spec)
        if errors:
            logger.error(
                f"lesson_validation_failed topic_key={topic_key} errors={errors[:5]}",
                extra={"requestId": get_request_id()},
            )
            raise AppError(
                code="VALIDATION_FAILED",
                message="We couldn't build that lesson this time. Try again, or try a slightly different topic.",
                status=502,
            )

    assert envelope.lesson is not None
    lesson = normalize_lesson(envelope.lesson, topic_key=topic_key)

    if cfg.QUIZ_VERIFY_ENABLED:
        lesson = await ai.verify_quiz_answers(lesson)

    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return LessonResponse(
        lesson=lesson,
        meta=LessonMeta(
            cached=False,
            model=model_used,
            generatedAt=generated_at,
            source="text",
            requestId=get_request_id(),
        ),
    )
