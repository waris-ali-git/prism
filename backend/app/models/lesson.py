import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Category = Literal[
    "biology",
    "physics",
    "chemistry",
    "earth_science",
    "astronomy",
    "math",
    "geography",
    "other",
]
Shape = Literal["sphere", "capsule", "disc", "tube", "torus", "box"]
Material = Literal[
    "membrane",
    "organelle",
    "glass",
    "matte",
    "metal",
    "liquid",
    "emissive",
]
MotionType = Literal[
    "none",
    "drift",
    "pulse",
    "spin",
    "orbit",
    "flow",
    "swing",
    "bob",
]
ControlEffect = Literal[
    "scale",
    "speed",
    "glow",
    "spread",
    "amplitude",
    "opacity",
]

VALID_CATEGORIES: set[str] = {
    "biology",
    "physics",
    "chemistry",
    "earth_science",
    "astronomy",
    "math",
    "geography",
    "other",
}
VALID_SHAPES: set[str] = {"sphere", "capsule", "disc", "tube", "torus", "box"}
VALID_MATERIALS: set[str] = {
    "membrane",
    "organelle",
    "glass",
    "matte",
    "metal",
    "liquid",
    "emissive",
}
VALID_MOTION_TYPES: set[str] = {
    "none",
    "drift",
    "pulse",
    "spin",
    "orbit",
    "flow",
    "swing",
    "bob",
}
VALID_EFFECTS: set[str] = {
    "scale",
    "speed",
    "glow",
    "spread",
    "amplitude",
    "opacity",
}

PART_ID_RE = re.compile(r"^[a-z][a-z0-9_]{1,31}$")
CONTROL_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")
HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
TOPIC_KEY_RE = re.compile(r"^[a-z0-9-]{1,60}$")


# ---------------------------------------------------------------------------
# Lenient Draft models (Gemini output & response_schema compatible)
# ---------------------------------------------------------------------------


class TextDraft(BaseModel):
    en: str = ""
    ur: str = ""


class CameraDraft(BaseModel):
    position: list[float] | None = None
    target: list[float] | None = None


class MotionDraft(BaseModel):
    type: str = "drift"
    speed: float | None = None
    amplitude: float | None = None
    pivot: list[float] | None = None


class PartDraft(BaseModel):
    id: str = ""
    name: TextDraft | None = None
    shape: str = ""
    material: str = ""
    color: str = ""
    position: list[float] | None = None
    size: float | None = None
    stretch: list[float] | None = None
    rotation: list[float] | None = None
    organic: float | None = None
    path: list[list[float]] | None = None
    count: int | None = None
    spread: float | None = None
    motion: MotionDraft | None = None
    explain: TextDraft | None = None


class ControlDraft(BaseModel):
    id: str = ""
    label: TextDraft | None = None
    min: float | None = None
    max: float | None = None
    default: float | None = None
    step: float | None = None
    unit: str | None = None
    effect: str = ""
    affects: list[str] = Field(default_factory=list)


class QuestionDraft(BaseModel):
    q: TextDraft | None = None
    options: list[TextDraft] = Field(default_factory=list)
    answer: int | None = None
    explain: TextDraft | None = None


class LessonDraft(BaseModel):
    topic: str = ""
    category: str = ""
    title: TextDraft | None = None
    summary: TextDraft | None = None
    camera: CameraDraft | None = None
    parts: list[PartDraft] = Field(default_factory=list)
    controls: list[ControlDraft] = Field(default_factory=list)
    quiz: list[QuestionDraft] = Field(default_factory=list)


class LessonEnvelope(BaseModel):
    accepted: bool
    reason: str | None = None
    lesson: LessonDraft | None = None


# ---------------------------------------------------------------------------
# Strict Contract models (Section 6.3 — frozen)
# ---------------------------------------------------------------------------


def _check_vec3(v: list[float], field_name: str) -> list[float]:
    if len(v) != 3:
        raise ValueError(f"{field_name} must have exactly 3 numbers")
    return [float(x) for x in v]


class Text(BaseModel):
    model_config = ConfigDict(extra="forbid")

    en: str = Field(min_length=1)
    ur: str = Field(min_length=1)


class CameraHint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: list[float]
    target: list[float]

    @field_validator("position", "target")
    @classmethod
    def _vec3(cls, v: list[float], info) -> list[float]:
        return _check_vec3(v, info.field_name)


class Motion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: MotionType
    speed: float = Field(default=1.0, ge=0.0, le=3.0)
    amplitude: float = Field(default=0.3, ge=0.0, le=2.0)
    pivot: list[float] | None = None

    @field_validator("pivot")
    @classmethod
    def _vec3_opt(cls, v: list[float] | None) -> list[float] | None:
        if v is None:
            return None
        return _check_vec3(v, "pivot")


class Part(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: Text
    shape: Shape
    material: Material
    color: str
    position: list[float]
    size: float = Field(ge=0.05, le=4.0)
    stretch: list[float] = Field(default_factory=lambda: [1.0, 1.0, 1.0])
    rotation: list[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0])
    organic: float = Field(default=0.0, ge=0.0, le=1.0)
    path: list[list[float]] | None = None
    count: int = Field(default=1, ge=1, le=120)
    spread: float = Field(default=0.0, ge=0.0, le=6.0)
    motion: Motion | None = None
    explain: Text

    @field_validator("id")
    @classmethod
    def _check_id(cls, v: str) -> str:
        if not PART_ID_RE.match(v):
            raise ValueError(f"Invalid part id '{v}'")
        return v

    @field_validator("color")
    @classmethod
    def _check_color(cls, v: str) -> str:
        if not HEX_COLOR_RE.match(v):
            raise ValueError(f"Invalid hex color '{v}'")
        return v

    @field_validator("position")
    @classmethod
    def _check_position(cls, v: list[float]) -> list[float]:
        coords = _check_vec3(v, "position")
        for c in coords:
            if c < -5.5001 or c > 5.5001:
                raise ValueError("position coordinate out of [-5.5, 5.5]")
        return coords

    @field_validator("stretch")
    @classmethod
    def _check_stretch(cls, v: list[float]) -> list[float]:
        vals = _check_vec3(v, "stretch")
        for s in vals:
            if s < 0.2999 or s > 3.0001:
                raise ValueError("stretch multiplier out of [0.3, 3.0]")
        return vals

    @field_validator("rotation")
    @classmethod
    def _check_rotation(cls, v: list[float]) -> list[float]:
        return _check_vec3(v, "rotation")

    @model_validator(mode="after")
    def _check_tube_and_lengths(self) -> "Part":
        if len(self.name.en) > 40 or len(self.name.ur) > 40:
            raise ValueError("Part name exceeds 40 chars")
        if len(self.explain.en) > 300 or len(self.explain.ur) > 300:
            raise ValueError("Part explain exceeds 300 chars")
        if self.shape == "tube":
            if not self.path or not (3 <= len(self.path) <= 8):
                raise ValueError("Tube part requires a path of 3..8 points")
            self.path = [_check_vec3(pt, "path point") for pt in self.path]
        elif self.path is not None:
            self.path = [_check_vec3(pt, "path point") for pt in self.path]
        return self


class Control(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    label: Text
    min: float
    max: float
    default: float
    step: float | None = None
    unit: str | None = None
    effect: ControlEffect
    affects: list[str] = Field(min_length=1)

    @field_validator("id")
    @classmethod
    def _check_id(cls, v: str) -> str:
        if not CONTROL_ID_RE.match(v):
            raise ValueError(f"Invalid control id '{v}'")
        return v

    @model_validator(mode="after")
    def _check_ranges(self) -> "Control":
        if len(self.label.en) > 30 or len(self.label.ur) > 30:
            raise ValueError("Control label exceeds 30 chars")
        if self.max <= self.min:
            raise ValueError("Control max must be greater than min")
        if not (self.min <= self.default <= self.max):
            raise ValueError("Control default must be within [min, max]")
        return self


class Question(BaseModel):
    model_config = ConfigDict(extra="forbid")

    q: Text
    options: list[Text] = Field(min_length=4, max_length=4)
    answer: int = Field(ge=0, le=3)
    explain: Text

    @model_validator(mode="after")
    def _check_lengths(self) -> "Question":
        if len(self.q.en) > 160 or len(self.q.ur) > 200:
            raise ValueError("Question text exceeds maximum length")
        if len(self.explain.en) > 300 or len(self.explain.ur) > 300:
            raise ValueError("Question explain exceeds 300 chars")
        return self


class Lesson(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schemaVersion: Literal[1] = 1
    topic: str = Field(min_length=1, max_length=60)
    topicKey: str
    category: Category
    title: Text
    summary: Text
    camera: CameraHint | None = None
    parts: list[Part] = Field(min_length=3, max_length=14)
    controls: list[Control] = Field(default_factory=list, max_length=4)
    quiz: list[Question] = Field(min_length=4, max_length=6)

    @field_validator("topicKey")
    @classmethod
    def _check_topic_key(cls, v: str) -> str:
        if not TOPIC_KEY_RE.match(v):
            raise ValueError(f"Invalid topicKey '{v}'")
        return v

    @model_validator(mode="after")
    def _check_references(self) -> "Lesson":
        if len(self.title.en) > 60 or len(self.title.ur) > 80:
            raise ValueError("Lesson title exceeds max length")
        if len(self.summary.en) > 240 or len(self.summary.ur) > 240:
            raise ValueError("Lesson summary exceeds max length")

        part_ids = [p.id for p in self.parts]
        if len(set(part_ids)) != len(part_ids):
            raise ValueError("Duplicate part ids in lesson")
        part_id_set = set(part_ids)

        control_ids = [c.id for c in self.controls]
        if len(set(control_ids)) != len(control_ids):
            raise ValueError("Duplicate control ids in lesson")

        for ctrl in self.controls:
            for pid in ctrl.affects:
                if pid not in part_id_set:
                    raise ValueError(f"Control '{ctrl.id}' affects unknown part '{pid}'")
        return self
