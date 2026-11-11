import colorsys
import math
import re

from app.core.versions import SCHEMA_VERSION
from app.models.lesson import (
    CameraHint,
    Control,
    ControlDraft,
    Lesson,
    LessonDraft,
    Motion,
    Part,
    PartDraft,
    Question,
    QuestionDraft,
    Text,
    TextDraft,
)

_CTRL_CHARS_RE = re.compile(r"[\x00-\x1f\x7f-\x9f]")
_SPACES_RE = re.compile(r"\s+")
_SENTENCE_END_CHARS = (".", "!", "?", "۔", "؟")
_ORGANIC_DEFAULT_MATERIALS = {"membrane", "organelle", "liquid"}


def clean_and_truncate(text: str, max_chars: int) -> str:
    cleaned = _CTRL_CHARS_RE.sub(" ", text)
    cleaned = _SPACES_RE.sub(" ", cleaned).strip()
    if len(cleaned) <= max_chars:
        return cleaned

    window = cleaned[:max_chars]
    best_sentence = -1
    for punct in _SENTENCE_END_CHARS:
        pos = window.rfind(punct)
        if pos > best_sentence:
            best_sentence = pos

    if best_sentence >= int(max_chars * 0.55):
        return window[: best_sentence + 1].strip()

    last_space = window.rfind(" ")
    if last_space >= int(max_chars * 0.40):
        trimmed = window[:last_space].rstrip(" ,;:-")
        if len(trimmed) + 1 <= max_chars:
            return trimmed + "…"
        return trimmed

    if max_chars > 1:
        return window[: max_chars - 1].rstrip() + "…"
    return window


def _clamp(val: float, lo: float, hi: float) -> float:
    return min(max(float(val), lo), hi)


def parse_hex_rgb(hex_color: str) -> tuple[float, float, float]:
    raw = hex_color.strip().lstrip("#")
    if len(raw) == 3:
        raw = "".join(ch * 2 for ch in raw)
    r = int(raw[0:2], 16) / 255.0
    g = int(raw[2:4], 16) / 255.0
    b = int(raw[4:6], 16) / 255.0
    return r, g, b


def clamp_pastel_color(hex_color: str, material: str = "organelle") -> str:
    """Convert hex color to HSL, preserve hue, clamp S in [0.25, 0.55] (0.70 for emissive) and L in [0.68, 0.86]."""
    r, g, b = parse_hex_rgb(hex_color)
    # Note: colorsys uses HLS order (hue, lightness, saturation)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    max_sat = 0.70 if material == "emissive" else 0.55
    s_clamped = _clamp(s, 0.25, max_sat)
    l_clamped = _clamp(l, 0.68, 0.86)
    r_out, g_out, b_out = colorsys.hls_to_rgb(h, l_clamped, s_clamped)
    ri = int(round(_clamp(r_out, 0.0, 1.0) * 255))
    gi = int(round(_clamp(g_out, 0.0, 1.0) * 255))
    bi = int(round(_clamp(b_out, 0.0, 1.0) * 255))
    return f"#{ri:02X}{gi:02X}{bi:02X}"


def _norm_text(draft: TextDraft | None, max_en: int, max_ur: int) -> Text:
    assert draft is not None
    return Text(
        en=clean_and_truncate(draft.en, max_en),
        ur=clean_and_truncate(draft.ur, max_ur),
    )


def _normalize_id_candidate(raw: str) -> str:
    return raw.strip().lower().replace("-", "_").replace(" ", "_")


def _normalize_part(draft: PartDraft) -> dict[str, object]:
    material = draft.material.strip()
    default_organic = 0.12 if material in _ORGANIC_DEFAULT_MATERIALS else 0.0
    organic = (
        _clamp(draft.organic, 0.0, 1.0)
        if draft.organic is not None
        else default_organic
    )
    stretch = (
        [_clamp(v, 0.3, 3.0) for v in draft.stretch]
        if draft.stretch is not None
        else [1.0, 1.0, 1.0]
    )
    rotation = (
        [float(v) for v in draft.rotation]
        if draft.rotation is not None
        else [0.0, 0.0, 0.0]
    )
    count = int(_clamp(draft.count, 1, 120)) if draft.count is not None else 1
    spread = _clamp(draft.spread, 0.0, 6.0) if draft.spread is not None else 0.0
    size = _clamp(draft.size if draft.size is not None else 1.0, 0.05, 4.0)
    pos = [float(v) for v in (draft.position or [0.0, 0.0, 0.0])]
    path = (
        [[float(c) for c in pt] for pt in draft.path]
        if draft.path is not None
        else None
    )

    motion_obj: dict[str, object] | None = None
    if draft.motion is not None:
        speed = (
            _clamp(draft.motion.speed, 0.0, 3.0)
            if draft.motion.speed is not None
            else 1.0
        )
        amplitude = (
            _clamp(draft.motion.amplitude, 0.0, 2.0)
            if draft.motion.amplitude is not None
            else 0.3
        )
        pivot = (
            [float(c) for c in draft.motion.pivot]
            if draft.motion.pivot is not None
            else None
        )
        motion_obj = {
            "type": draft.motion.type,
            "speed": speed,
            "amplitude": amplitude,
            "pivot": pivot,
        }

    return {
        "id": draft.id.strip(),
        "name": _norm_text(draft.name, 40, 40),
        "shape": draft.shape.strip(),
        "material": material,
        "color": clamp_pastel_color(draft.color, material),
        "position": pos,
        "size": size,
        "stretch": stretch,
        "rotation": rotation,
        "organic": organic,
        "path": path,
        "count": count,
        "spread": spread,
        "motion": motion_obj,
        "explain": _norm_text(draft.explain, 300, 300),
    }


def compute_part_bounding_radius(part_dict: dict[str, object]) -> float:
    pos = part_dict["position"]
    assert isinstance(pos, list)
    size = float(part_dict["size"])  # type: ignore[arg-type]
    stretch = part_dict["stretch"]
    assert isinstance(stretch, list)
    spread = float(part_dict["spread"])  # type: ignore[arg-type]

    pos_dist = math.sqrt(sum(float(c) ** 2 for c in pos))
    half_extent = 0.5 * size * max(float(s) for s in stretch)
    radius = pos_dist + half_extent + spread

    path = part_dict.get("path")
    if isinstance(path, list):
        for pt in path:
            if isinstance(pt, list) and len(pt) == 3:
                pt_dist = math.sqrt(sum(float(c) ** 2 for c in pt)) + 0.5 * size
                if pt_dist > radius:
                    radius = pt_dist
    return radius


def _scale_scene_in_place(
    part_dicts: list[dict[str, object]],
    camera: CameraHint | None,
    max_bound: float = 5.5,
) -> CameraHint | None:
    if not part_dicts:
        return camera
    current_radius = max(compute_part_bounding_radius(p) for p in part_dicts)
    if current_radius > max_bound and current_radius > 0:
        scale = max_bound / current_radius
        for p in part_dicts:
            pos = p["position"]
            assert isinstance(pos, list)
            p["position"] = [_clamp(float(c) * scale, -max_bound, max_bound) for c in pos]
            p["size"] = _clamp(float(p["size"]) * scale, 0.05, 4.0)  # type: ignore[arg-type]
            p["spread"] = _clamp(float(p["spread"]) * scale, 0.0, 6.0)  # type: ignore[arg-type]

            path = p.get("path")
            if isinstance(path, list):
                p["path"] = [
                    [_clamp(float(c) * scale, -max_bound, max_bound) for c in pt]
                    for pt in path
                ]

            motion = p.get("motion")
            if isinstance(motion, dict) and motion.get("pivot") is not None:
                piv = motion["pivot"]
                if isinstance(piv, list):
                    motion["pivot"] = [float(c) * scale for c in piv]

        if camera is not None:
            camera = CameraHint(
                position=[float(c) * scale for c in camera.position],
                target=[float(c) * scale for c in camera.target],
            )
    else:
        for p in part_dicts:
            pos = p["position"]
            assert isinstance(pos, list)
            p["position"] = [_clamp(float(c), -max_bound, max_bound) for c in pos]
    return camera


def _normalize_controls(
    drafts: list[ControlDraft], valid_part_ids: set[str]
) -> list[Control]:
    out: list[Control] = []
    for ctrl in drafts[:4]:
        resolved_affects: list[str] = []
        for raw_id in ctrl.affects:
            cand = raw_id.strip()
            if cand not in valid_part_ids:
                cand = _normalize_id_candidate(raw_id)
            if cand in valid_part_ids and cand not in resolved_affects:
                resolved_affects.append(cand)
        if not resolved_affects:
            continue

        lo = float(ctrl.min)  # type: ignore[arg-type]
        hi = float(ctrl.max)  # type: ignore[arg-type]
        default_val = _clamp(float(ctrl.default), lo, hi)  # type: ignore[arg-type]
        unit = clean_and_truncate(ctrl.unit, 16) if ctrl.unit and ctrl.unit.strip() else None
        step = float(ctrl.step) if ctrl.step is not None and ctrl.step > 0 else None

        out.append(
            Control(
                id=ctrl.id.strip(),
                label=_norm_text(ctrl.label, 30, 30),
                min=lo,
                max=hi,
                default=default_val,
                step=step,
                unit=unit,
                effect=ctrl.effect.strip(),  # type: ignore[arg-type]
                affects=resolved_affects,
            )
        )
    return out


def _normalize_quiz(drafts: list[QuestionDraft]) -> list[Question]:
    questions: list[Question] = []
    for q_item in drafts[:6]:
        options = [_norm_text(opt, 120, 120) for opt in q_item.options[:4]]
        questions.append(
            Question(
                q=_norm_text(q_item.q, 160, 200),
                options=options,
                answer=int(q_item.answer),  # type: ignore[arg-type]
                explain=_norm_text(q_item.explain, 300, 300),
            )
        )
    return questions


def normalize_lesson(draft: LessonDraft, topic_key: str) -> Lesson:
    """Apply all Section 6.4 Auto-fix rules as a pure transformation into a strict Lesson."""
    part_dicts = [_normalize_part(p) for p in draft.parts[:14]]

    camera: CameraHint | None = None
    if draft.camera is not None and draft.camera.position and draft.camera.target:
        camera = CameraHint(
            position=[float(c) for c in draft.camera.position],
            target=[float(c) for c in draft.camera.target],
        )

    camera = _scale_scene_in_place(part_dicts, camera, max_bound=5.5)

    parts: list[Part] = []
    for pd in part_dicts:
        motion_raw = pd.pop("motion")
        motion_model = Motion(**motion_raw) if isinstance(motion_raw, dict) else None
        parts.append(Part(**pd, motion=motion_model))

    valid_part_ids = {p.id for p in parts}
    controls = _normalize_controls(draft.controls, valid_part_ids)
    quiz = _normalize_quiz(draft.quiz)

    return Lesson(
        schemaVersion=SCHEMA_VERSION,  # type: ignore[arg-type]
        topic=clean_and_truncate(draft.topic, 60),
        topicKey=topic_key,
        category=draft.category.strip(),  # type: ignore[arg-type]
        title=_norm_text(draft.title, 60, 80),
        summary=_norm_text(draft.summary, 240, 240),
        camera=camera,
        parts=parts,
        controls=controls,
        quiz=quiz,
    )
