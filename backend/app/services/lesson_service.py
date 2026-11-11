from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.logging import get_logger, get_request_id
from app.core.versions import PROMPT_VERSION, SCHEMA_VERSION
from app.models.api import LessonMeta, LessonResponse
from app.models.lesson import Lesson
from app.services.firestore import get_cached_lesson, save_cached_lesson
from app.services.gemini import GeminiService, gemini_service
from app.services.normalize import normalize_lesson
from app.services.topics import get_hero_spec, sanitize_topic_input, slugify_topic
from app.services.validator import validate_lesson_draft

logger = get_logger("prism.lesson_service")

# In-flight deduplication: map doc_id -> asyncio.Task[(Lesson, str)]
_inflight_lock = asyncio.Lock()
_inflight_tasks: dict[str, asyncio.Task[tuple[Lesson, str]]] = {}


def validate_topic_input(raw_topic: str) -> str:
    cleaned = sanitize_topic_input(raw_topic)
    if len(cleaned) < 2 or len(cleaned) > 120:
        raise AppError(
            code="BAD_REQUEST",
            message="Topic must be between 2 and 120 characters.",
            status=400,
        )
    return cleaned


def get_lesson_doc_id(topic_key: str) -> str:
    return f"{topic_key}__s{SCHEMA_VERSION}_p{PROMPT_VERSION}"


async def _generate_and_validate_lesson(
    clean_topic: str,
    topic_key: str,
    ai: GeminiService,
    cfg: Settings,
) -> tuple[Lesson, str]:
    hero_spec = get_hero_spec(topic_key)

    # Step 1: initial Gemini call
    envelope, model_used = await ai.generate_lesson_draft(
        clean_topic, hero_spec=hero_spec
    )
    if not envelope.accepted or envelope.lesson is None:
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
        if not envelope.accepted or envelope.lesson is None:
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

    lesson = normalize_lesson(envelope.lesson, topic_key=topic_key)

    if cfg.QUIZ_VERIFY_ENABLED:
        lesson = await ai.verify_quiz_answers(lesson)

    return lesson, model_used


async def create_lesson_from_topic(
    raw_topic: str,
    *,
    source: str = "text",
    gemini: GeminiService | None = None,
    settings: Settings | None = None,
) -> LessonResponse:
    cfg = settings or get_settings()
    clean_topic = validate_topic_input(raw_topic)
    topic_key = slugify_topic(clean_topic)
    doc_id = get_lesson_doc_id(topic_key)

    # 1. Check Firestore cache
    cached_doc = await get_cached_lesson(doc_id)
    if cached_doc and "lessonJson" in cached_doc:
        try:
            lesson = Lesson.model_validate_json(cached_doc["lessonJson"])
            logger.info(
                f"cache_hit doc_id={doc_id} topic_key={topic_key}",
                extra={"requestId": get_request_id()},
            )
            return LessonResponse(
                lesson=lesson,
                meta=LessonMeta(
                    cached=True,
                    model=cached_doc.get("model", cfg.GEMINI_MODEL),
                    generatedAt=cached_doc.get("createdAt", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")),
                    source=cached_doc.get("source", source),
                    requestId=get_request_id(),
                ),
            )
        except Exception as exc:
            logger.warning("Failed to deserialize cached lesson '%s': %s", doc_id, exc)

    if not cfg.gemini_configured:
        raise AppError(
            code="CONFIG_MISSING",
            message="Gemini API is not configured on the server. Set GEMINI_API_KEY and GEMINI_MODEL.",
            status=503,
        )

    ai = gemini or gemini_service

    # 2. In-flight deduplication
    task: asyncio.Task[tuple[Lesson, str]] | None = None
    is_initiator = False

    async with _inflight_lock:
        if doc_id in _inflight_tasks:
            logger.info(
                f"dedup_join_inflight doc_id={doc_id}",
                extra={"requestId": get_request_id()},
            )
            task = _inflight_tasks[doc_id]
        else:
            task = asyncio.create_task(
                _generate_and_validate_lesson(clean_topic, topic_key, ai, cfg)
            )
            _inflight_tasks[doc_id] = task
            is_initiator = True

    try:
        lesson, model_used = await task
    finally:
        if is_initiator:
            async with _inflight_lock:
                _inflight_tasks.pop(doc_id, None)

    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    # 3. Store in Firestore (resilient: failures do not block user response)
    doc_data = {
        "topic": lesson.topic,
        "topicKey": lesson.topicKey,
        "category": lesson.category,
        "titleEn": lesson.title.en,
        "titleUr": lesson.title.ur,
        "version": f"s{SCHEMA_VERSION}_p{PROMPT_VERSION}",
        "lessonJson": lesson.model_dump_json(),
        "model": model_used,
        "source": source,
        "createdAt": generated_at,
    }
    await save_cached_lesson(doc_id, doc_data)

    return LessonResponse(
        lesson=lesson,
        meta=LessonMeta(
            cached=False,
            model=model_used,
            generatedAt=generated_at,
            source=source,
            requestId=get_request_id(),
        ),
    )
