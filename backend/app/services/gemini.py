import asyncio
import json
import re
from pathlib import Path
from typing import Any

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.logging import get_logger, get_request_id
from app.models.lesson import Lesson, LessonEnvelope
from app.services.topics import HeroTopicSpec

logger = get_logger("prism.gemini")

_PROMPTS_DIR = Path(__file__).resolve().parents[1] / "prompts"
_LESSON_SYSTEM_PROMPT = (_PROMPTS_DIR / "lesson_system.md").read_text(encoding="utf-8").strip()
_IMAGE_IDENTIFY_PROMPT = (_PROMPTS_DIR / "image_identify.md").read_text(encoding="utf-8").strip()
_RETRY_DELAY_RE = re.compile(r"(\d+(?:\.\d+)?)s")


class QuizVerifyResponse(BaseModel):
    answers: list[int] = Field(default_factory=list)


class ImageIdentifyDraft(BaseModel):
    recognized: bool = False
    isEducational: bool = False
    topic: str = ""
    category: str = "other"
    confidence: float = 0.0


class GeminiService:
    """Manages a single genai.Client and concurrency semaphore for Gemini API calls."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings
        self._client: genai.Client | None = None
        self._client_key: str = ""
        self._semaphore: asyncio.Semaphore | None = None
        self._semaphore_limit: int = 0

    def _current_settings(self) -> Settings:
        return self._settings or get_settings()

    def init_client(self, settings: Settings | None = None) -> None:
        cfg = settings or self._current_settings()
        api_key = cfg.GEMINI_API_KEY.strip()
        if api_key and (self._client is None or self._client_key != api_key):
            self._client = genai.Client(api_key=api_key)
            self._client_key = api_key

    def _get_client(self, cfg: Settings) -> genai.Client:
        if not cfg.gemini_configured:
            raise AppError(
                code="CONFIG_MISSING",
                message="Gemini API is not configured on the server. Set GEMINI_API_KEY and GEMINI_MODEL.",
                status=503,
            )
        self.init_client(cfg)
        assert self._client is not None
        return self._client

    def _get_semaphore(self, cfg: Settings) -> asyncio.Semaphore:
        limit = max(1, cfg.GEMINI_MAX_CONCURRENCY)
        if self._semaphore is None or self._semaphore_limit != limit:
            self._semaphore = asyncio.Semaphore(limit)
            self._semaphore_limit = limit
        return self._semaphore

    def build_lesson_user_prompt(
        self,
        topic: str,
        hero_spec: HeroTopicSpec | None = None,
        previous_errors: list[str] | None = None,
    ) -> str:
        sections: list[str] = [f'Topic: "{topic}"']
        if hero_spec is not None:
            sections.append(hero_spec.build_prompt_requirement())
        if previous_errors:
            bullet_list = "\n".join(f"- {err}" for err in previous_errors)
            sections.append(
                f"Your previous output had these problems:\n{bullet_list}\n"
                "Return a corrected full JSON."
            )
        return "\n\n".join(sections)

    async def generate_lesson_draft(
        self,
        topic: str,
        hero_spec: HeroTopicSpec | None = None,
        previous_errors: list[str] | None = None,
    ) -> tuple[LessonEnvelope, str]:
        cfg = self._current_settings()
        client = self._get_client(cfg)
        model_name = cfg.GEMINI_MODEL.strip()
        user_prompt = self.build_lesson_user_prompt(topic, hero_spec, previous_errors)

        raw_text = await self._call_json_model(
            client=client,
            cfg=cfg,
            model_name=model_name,
            system_instruction=_LESSON_SYSTEM_PROMPT,
            contents=user_prompt,
            schema=LessonEnvelope,
            temperature=0.35,
            max_output_tokens=8192,
        )

        try:
            data = json.loads(raw_text)
            envelope = LessonEnvelope.model_validate(data)
        except Exception as exc:
            logger.warning(
                "gemini_json_parse_failed",
                extra={"requestId": get_request_id()},
            )
            raise AppError(
                code="VALIDATION_FAILED",
                message="We couldn't build that lesson this time. Try again, or try a slightly different topic.",
                status=502,
            ) from exc

        return envelope, model_name

    async def verify_quiz_answers(self, lesson: Lesson) -> Lesson:
        cfg = self._current_settings()
        client = self._get_client(cfg)
        model_name = cfg.GEMINI_MODEL.strip()

        facts = [f"Summary: {lesson.summary.en}"] + [
            f"- {p.name.en}: {p.explain.en}" for p in lesson.parts
        ]
        questions_block = []
        for idx, q in enumerate(lesson.quiz):
            opts = " | ".join(f"{i}: {opt.en}" for i, opt in enumerate(q.options))
            questions_block.append(f"Q{idx}: {q.q.en} [{opts}]")

        verify_prompt = (
            "Answer each multiple-choice question (0..3) using ONLY the lesson text below.\n\n"
            + "\n".join(facts)
            + "\n\nQuestions:\n"
            + "\n".join(questions_block)
        )
        try:
            raw_text = await self._call_json_model(
                client=client,
                cfg=cfg,
                model_name=model_name,
                system_instruction="Return JSON { answers: [int, ...] } with the zero-based index for each question.",
                contents=verify_prompt,
                schema=QuizVerifyResponse,
                temperature=0.1,
                max_output_tokens=512,
            )
            parsed = QuizVerifyResponse.model_validate_json(raw_text)
            if len(parsed.answers) != len(lesson.quiz):
                return lesson
            kept = [
                q
                for q, ans in zip(lesson.quiz, parsed.answers)
                if q.answer == ans
            ]
            if len(kept) >= 4:
                return lesson.model_copy(update={"quiz": kept})
        except Exception:
            logger.warning("quiz_verify_skipped", extra={"requestId": get_request_id()})
        return lesson

    async def identify_image_topic(
        self,
        image_bytes: bytes,
        mime_type: str,
    ) -> tuple[ImageIdentifyDraft, str]:
        cfg = self._current_settings()
        client = self._get_client(cfg)
        model_name = cfg.GEMINI_MODEL.strip()

        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            "Identify the single main school topic taught on this textbook page.",
        ]

        raw_text = await self._call_json_model(
            client=client,
            cfg=cfg,
            model_name=model_name,
            system_instruction=_IMAGE_IDENTIFY_PROMPT,
            contents=contents,
            schema=ImageIdentifyDraft,
            temperature=0.2,
            max_output_tokens=512,
        )
        result = ImageIdentifyDraft.model_validate_json(raw_text)
        return result, model_name

    async def _call_json_model(
        self,
        *,
        client: genai.Client,
        cfg: Settings,
        model_name: str,
        system_instruction: str,
        contents: Any,
        schema: type[BaseModel],
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        sem = self._get_semaphore(cfg)
        async with sem:
            return await self._invoke_with_schema_fallback(
                client=client,
                cfg=cfg,
                model_name=model_name,
                system_instruction=system_instruction,
                contents=contents,
                schema=schema,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )

    async def _invoke_with_schema_fallback(
        self,
        *,
        client: genai.Client,
        cfg: Settings,
        model_name: str,
        system_instruction: str,
        contents: Any,
        schema: type[BaseModel],
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        thinking_cfg = (
            types.ThinkingConfig(thinking_budget=cfg.GEMINI_THINKING_BUDGET)
            if cfg.GEMINI_THINKING_BUDGET is not None
            else None
        )
        gen_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            response_mime_type="application/json",
            response_schema=schema,
            thinking_config=thinking_cfg,
        )

        timeout = (
            cfg.GEMINI_TIMEOUT_SECONDS
            if (cfg.GEMINI_TIMEOUT_SECONDS and cfg.GEMINI_TIMEOUT_SECONDS > 0)
            else None
        )

        candidate_models = [model_name]
        for m in ("gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"):
            if m not in candidate_models:
                candidate_models.append(m)

        last_exc: Exception | None = None
        for cand_model in candidate_models:
            try:
                if timeout is not None:
                    response = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model=cand_model,
                            contents=contents,
                            config=gen_config,
                        ),
                        timeout=timeout,
                    )
                else:
                    response = await client.aio.models.generate_content(
                        model=cand_model,
                        contents=contents,
                        config=gen_config,
                    )
                last_exc = None
                break
            except genai_errors.APIError as exc:
                last_exc = exc
                if exc.code == 400 and (
                    "schema" in str(exc).lower() or "thinking" in str(exc).lower()
                ):
                    fallback_cfg = types.GenerateContentConfig(
                        system_instruction=(
                            f"{system_instruction}\n\n"
                            f"JSON Schema:\n{json.dumps(schema.model_json_schema())}"
                        ),
                        temperature=temperature,
                        max_output_tokens=max_output_tokens,
                        response_mime_type="application/json",
                    )
                    try:
                        if timeout is not None:
                            response = await asyncio.wait_for(
                                client.aio.models.generate_content(
                                    model=cand_model,
                                    contents=contents,
                                    config=fallback_cfg,
                                ),
                                timeout=timeout,
                            )
                        else:
                            response = await client.aio.models.generate_content(
                                model=cand_model,
                                contents=contents,
                                config=fallback_cfg,
                            )
                        last_exc = None
                        break
                    except Exception as inner_exc:
                        last_exc = inner_exc
                        continue
                elif exc.code in (503, 404, 429):
                    logger.warning(f"model_fallback_retry cand={cand_model} code={exc.code}")
                    continue
                else:
                    self._raise_mapped_upstream_error(exc)
            except Exception as exc:
                last_exc = exc
                continue

        if last_exc is not None:
            self._raise_mapped_upstream_error(last_exc)

        usage = getattr(response, "usage_metadata", None)
        if usage is not None:
            logger.info(
                "gemini_usage "
                f"prompt_tokens={getattr(usage, 'prompt_token_count', None)} "
                f"output_tokens={getattr(usage, 'candidates_token_count', None)} "
                f"total_tokens={getattr(usage, 'total_token_count', None)}",
                extra={"requestId": get_request_id()},
            )

        text = getattr(response, "text", None)
        if not text:
            raise AppError(
                code="UPSTREAM_FAILED",
                message="Gemini returned an empty response. Please try again.",
                status=502,
            )
        return text

    def _raise_mapped_upstream_error(self, exc: Exception) -> None:
        if isinstance(exc, AppError):
            raise exc
        if isinstance(exc, (asyncio.TimeoutError, TimeoutError, httpx.TimeoutException)):
            raise AppError(
                code="UPSTREAM_FAILED",
                message="The AI service timed out while building your lesson. Please try again.",
                status=502,
            ) from exc
        if isinstance(exc, genai_errors.APIError):
            logger.error(f"gemini_api_error code={getattr(exc, 'code', None)} msg={getattr(exc, 'message', str(exc))}")
            if exc.code == 429:
                retry_after = _extract_retry_seconds(exc)
                raise AppError(
                    code="UPSTREAM_RATE_LIMITED",
                    message="Lots of lessons are being built right now. Try again in a few seconds.",
                    status=429,
                    retry_after=retry_after,
                ) from exc
            raise AppError(
                code="UPSTREAM_FAILED",
                message="We couldn't build that lesson this time. Try again, or try a slightly different topic.",
                status=502,
            ) from exc
        raise AppError(
            code="UPSTREAM_FAILED",
            message="Failed to reach the AI service. Please try again.",
            status=502,
        ) from exc


def _extract_retry_seconds(exc: genai_errors.APIError) -> int | None:
    resp = getattr(exc, "response", None)
    headers = getattr(resp, "headers", None)
    if headers:
        raw_hdr = headers.get("retry-after") or headers.get("Retry-After")
        if raw_hdr and str(raw_hdr).isdigit():
            return max(1, int(raw_hdr))
    raw_json = getattr(exc, "response_json", None)
    if raw_json is not None:
        dumped = json.dumps(raw_json) if not isinstance(raw_json, str) else raw_json
        match = _RETRY_DELAY_RE.search(dumped)
        if match:
            return max(1, int(float(match.group(1))))
    return None


gemini_service = GeminiService()
