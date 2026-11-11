from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.lesson import Lesson, Text


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
    schemaVersion: int
    gemini: Literal["configured", "missing"]
    firestore: Literal["ok", "error"]
    external: Literal["configured", "not_configured"]


class LessonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str | None = None
    imageBase64: str | None = None
    mimeType: Literal["image/jpeg", "image/png", "image/webp"] | None = None

    @model_validator(mode="after")
    def _validate_choice(self) -> "LessonRequest":
        has_topic = self.topic is not None
        has_image = self.imageBase64 is not None
        if has_topic and has_image:
            raise ValueError("Provide either 'topic' or 'imageBase64', not both")
        if not has_topic and not has_image:
            raise ValueError("Provide either 'topic' or 'imageBase64'")
        if has_image and self.mimeType is None:
            raise ValueError("'mimeType' is required when 'imageBase64' is provided")
        if has_topic and self.mimeType is not None:
            raise ValueError("'mimeType' must not be provided with 'topic'")
        return self


class LessonMeta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cached: bool
    model: str
    generatedAt: str
    source: Literal["text", "image"]
    requestId: str


class LessonResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lesson: Lesson
    meta: LessonMeta


class RecentLessonItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str
    topicKey: str
    category: str
    title: Text
    createdAt: str


class RecentLessonsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lessons: list[RecentLessonItem]
