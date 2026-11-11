import pytest

from app.core.config import Settings
from app.core.errors import AppError
from app.models.lesson import LessonEnvelope
from app.services.gemini import GeminiService
from app.services.lesson_service import create_lesson_from_topic
from tests.test_b2_lesson import _make_valid_draft


class _StubGemini(GeminiService):
    def __init__(self, responses: list[LessonEnvelope]) -> None:
        super().__init__()
        self._responses = list(responses)
        self.calls: list[tuple[str, str | None, list[str] | None]] = []

    async def generate_lesson_draft(self, topic, hero_spec=None, previous_errors=None):
        self.calls.append(
            (topic, hero_spec.topic_key if hero_spec else None, previous_errors)
        )
        return self._responses.pop(0), "test-flash-model"


@pytest.mark.asyncio
async def test_non_educational_topic_rejected() -> None:
    cfg = Settings(GEMINI_API_KEY="k", GEMINI_MODEL="m")
    stub = _StubGemini([LessonEnvelope(accepted=False, reason="Not school", lesson=None)])
    with pytest.raises(AppError) as exc_info:
        await create_lesson_from_topic("celebrity gossip", gemini=stub, settings=cfg)
    assert exc_info.value.code == "TOPIC_NOT_EDUCATIONAL"
    assert exc_info.value.status == 422


@pytest.mark.asyncio
async def test_retry_once_recovers_from_invalid_first_attempt() -> None:
    cfg = Settings(GEMINI_API_KEY="k", GEMINI_MODEL="m")
    bad_draft = _make_valid_draft()
    bad_draft.parts = bad_draft.parts[:1]  # fewer than 3 parts -> fails validation
    good_draft = _make_valid_draft()

    stub = _StubGemini(
        [
            LessonEnvelope(accepted=True, reason=None, lesson=bad_draft),
            LessonEnvelope(accepted=True, reason=None, lesson=good_draft),
        ]
    )
    res = await create_lesson_from_topic("Simple Pendulum", gemini=stub, settings=cfg)
    assert len(stub.calls) == 2
    assert stub.calls[0][2] is None
    assert stub.calls[1][2] is not None and any("at least 3 parts" in e for e in stub.calls[1][2])
    assert res.lesson.topicKey == "simple-pendulum"
    assert res.meta.cached is False


@pytest.mark.asyncio
async def test_validation_failed_after_retry() -> None:
    cfg = Settings(GEMINI_API_KEY="k", GEMINI_MODEL="m")
    bad1 = _make_valid_draft()
    bad1.parts = []
    bad2 = _make_valid_draft()
    bad2.parts = []

    stub = _StubGemini(
        [
            LessonEnvelope(accepted=True, reason=None, lesson=bad1),
            LessonEnvelope(accepted=True, reason=None, lesson=bad2),
        ]
    )
    with pytest.raises(AppError) as exc_info:
        await create_lesson_from_topic("Pendulum", gemini=stub, settings=cfg)
    assert exc_info.value.code == "VALIDATION_FAILED"
    assert exc_info.value.status == 502


@pytest.mark.asyncio
async def test_short_or_long_topic_rejected() -> None:
    cfg = Settings(GEMINI_API_KEY="k", GEMINI_MODEL="m")
    stub = _StubGemini([])
    with pytest.raises(AppError) as exc_info:
        await create_lesson_from_topic("x", gemini=stub, settings=cfg)
    assert exc_info.value.code == "BAD_REQUEST"
