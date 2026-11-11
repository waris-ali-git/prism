import math
import re

from app.models.lesson import (
    CONTROL_ID_RE,
    PART_ID_RE,
    VALID_CATEGORIES,
    VALID_EFFECTS,
    VALID_MATERIALS,
    VALID_MOTION_TYPES,
    VALID_SHAPES,
    LessonDraft,
    TextDraft,
)
from app.services.topics import HeroTopicSpec

_HEX_PARSE_RE = re.compile(r"^#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$")
_PAREN_ASCII_RE = re.compile(r"[\(\[][A-Za-z0-9\s.,/_+-]{1,60}[\)\]]")


def is_arabic_script_char(ch: str) -> bool:
    return (
        ("\u0600" <= ch <= "\u06FF")
        or ("\u0750" <= ch <= "\u077F")
        or ("\uFB50" <= ch <= "\uFDFF")
        or ("\uFE70" <= ch <= "\uFEFF")
    )


def check_urdu_text(text: str, *, allow_pure_numeric: bool = False) -> str | None:
    stripped = text.strip()
    if not stripped:
        return "Urdu text is empty"

    # Common English technical terms in parentheses are explicitly permitted (6.4).
    without_parens = _PAREN_ASCII_RE.sub("", stripped).strip()
    sample = without_parens if any(c.isalpha() for c in without_parens) else stripped

    letters = [c for c in sample if c.isalpha()]
    if not letters:
        if allow_pure_numeric:
            return None
        return "Urdu text contains no letters"

    arabic_count = sum(1 for c in letters if is_arabic_script_char(c))
    ratio = arabic_count / len(letters)
    if ratio < 0.60:
        pct = int(round(ratio * 100))
        return f"Urdu text must be at least 60% Urdu/Arabic script (got {pct}%)"
    return None


def _check_bilingual(
    text_obj: TextDraft | None,
    field_label: str,
    errors: list[str],
    *,
    allow_numeric_ur: bool = False,
) -> None:
    if text_obj is None:
        errors.append(f"Missing bilingual text object at '{field_label}'.")
        return
    if not isinstance(text_obj.en, str) or not text_obj.en.strip():
        errors.append(f"Empty English text at '{field_label}.en'.")
    if not isinstance(text_obj.ur, str):
        errors.append(f"Invalid Urdu text at '{field_label}.ur'.")
        return
    ur_err = check_urdu_text(text_obj.ur, allow_pure_numeric=allow_numeric_ur)
    if ur_err is not None:
        errors.append(f"Invalid Urdu at '{field_label}.ur': {ur_err}.")


def _is_finite_vec3(vec: list[float] | None) -> bool:
    if vec is None or len(vec) != 3:
        return False
    return all(isinstance(v, (int, float)) and math.isfinite(float(v)) for v in vec)


def _normalize_id_candidate(raw: str) -> str:
    return raw.strip().lower().replace("-", "_").replace(" ", "_")


def normalize_category_str(cat_raw: str | None) -> str | None:
    if not cat_raw:
        return None
    cand = cat_raw.strip().lower().replace("-", "_").replace(" ", "_")
    if cand in VALID_CATEGORIES:
        return cand
    if "earth" in cand:
        return "earth_science"
    if "geo" in cand:
        return "geography"
    if "bio" in cand:
        return "biology"
    if "phys" in cand:
        return "physics"
    if "chem" in cand:
        return "chemistry"
    if "astro" in cand or "space" in cand:
        return "astronomy"
    if "math" in cand:
        return "math"
    return None


def validate_lesson_draft(
    draft: LessonDraft | None,
    hero_spec: HeroTopicSpec | None = None,
) -> list[str]:
    """Implement all Section 6.4 Reject rules. Returns human-readable error strings."""
    if draft is None:
        return ["Missing 'lesson' object in response."]

    errors: list[str] = []

    if not draft.topic or not draft.topic.strip():
        errors.append("Lesson 'topic' is empty.")
    
    norm_cat = normalize_category_str(draft.category)
    if norm_cat is None:
        errors.append(
            f"Invalid category '{draft.category}'. Must be one of {sorted(VALID_CATEGORIES)}."
        )
    else:
        draft.category = norm_cat

    _check_bilingual(draft.title, "title", errors)
    _check_bilingual(draft.summary, "summary", errors)

    if draft.camera is not None:
        if not _is_finite_vec3(draft.camera.position) or not _is_finite_vec3(
            draft.camera.target
        ):
            errors.append("Camera 'position' and 'target' must each be [x, y, z] numbers.")

    # --- Parts (keep first 14 in auto-fix, must have >= 3) ---
    if len(draft.parts) < 3:
        errors.append(f"Lesson must have at least 3 parts (got {len(draft.parts)}).")

    kept_parts = draft.parts[:14]
    seen_part_ids: set[str] = set()

    for idx, part in enumerate(kept_parts):
        prefix = f"parts[{idx}]"
        pid = part.id.strip()
        if not PART_ID_RE.match(pid):
            errors.append(
                f"{prefix}.id '{part.id}' is invalid; must match ^[a-z][a-z0-9_]{{1,31}}$."
            )
        elif pid in seen_part_ids:
            errors.append(f"Duplicate part id '{pid}'.")
        else:
            seen_part_ids.add(pid)

        _check_bilingual(part.name, f"{prefix}.name", errors)
        _check_bilingual(part.explain, f"{prefix}.explain", errors)

        if part.shape not in VALID_SHAPES:
            errors.append(
                f"{prefix}.shape '{part.shape}' is invalid; must be one of {sorted(VALID_SHAPES)}."
            )
        if part.material not in VALID_MATERIALS:
            errors.append(
                f"{prefix}.material '{part.material}' is invalid; must be one of {sorted(VALID_MATERIALS)}."
            )
        if not part.color or not _HEX_PARSE_RE.match(part.color.strip()):
            errors.append(
                f"{prefix}.color '{part.color}' must be a hex color like '#RRGGBB'."
            )
        if not _is_finite_vec3(part.position):
            errors.append(f"{prefix}.position must be 3 finite numbers [x, y, z].")
        try:
            val = float(part.size) if part.size is not None else 1.0
            if not math.isfinite(val) or val <= 0:
                part.size = 1.0
            else:
                part.size = max(0.05, min(4.0, val))
        except (ValueError, TypeError):
            part.size = 1.0

        if part.stretch is not None and not _is_finite_vec3(part.stretch):
            errors.append(f"{prefix}.stretch must be 3 finite numbers [x, y, z].")
        if part.rotation is not None and not _is_finite_vec3(part.rotation):
            errors.append(f"{prefix}.rotation must be 3 finite numbers [x, y, z].")

        if part.shape == "tube":
            if not part.path or not (3 <= len(part.path) <= 8):
                errors.append(
                    f"{prefix} has shape 'tube' and requires 'path' with 3 to 8 [x,y,z] points."
                )
            elif not all(_is_finite_vec3(pt) for pt in part.path):
                errors.append(f"{prefix}.path points must each be 3 finite numbers [x, y, z].")

        if part.motion is not None:
            if part.motion.type not in VALID_MOTION_TYPES:
                errors.append(
                    f"{prefix}.motion.type '{part.motion.type}' is invalid; must be one of {sorted(VALID_MOTION_TYPES)}."
                )
            if part.motion.pivot is not None and not _is_finite_vec3(part.motion.pivot):
                errors.append(f"{prefix}.motion.pivot must be 3 finite numbers [x, y, z].")

    # --- Controls (keep first 4 in auto-fix) ---
    kept_controls = draft.controls[:4]
    seen_control_ids: set[str] = set()

    for idx, ctrl in enumerate(kept_controls):
        prefix = f"controls[{idx}]"
        cid = ctrl.id.strip()
        if not CONTROL_ID_RE.match(cid):
            errors.append(
                f"{prefix}.id '{ctrl.id}' is invalid; must be a lowercase slug."
            )
        elif cid in seen_control_ids:
            errors.append(f"Duplicate control id '{cid}'.")
        else:
            seen_control_ids.add(cid)

        _check_bilingual(ctrl.label, f"{prefix}.label", errors)

        if ctrl.effect not in VALID_EFFECTS:
            errors.append(
                f"{prefix}.effect '{ctrl.effect}' is invalid; must be one of {sorted(VALID_EFFECTS)}."
            )
        if (
            ctrl.min is None
            or ctrl.max is None
            or not math.isfinite(float(ctrl.min))
            or not math.isfinite(float(ctrl.max))
        ):
            errors.append(f"{prefix}.min and max must be finite numbers.")
        elif float(ctrl.max) <= float(ctrl.min):
            errors.append(f"{prefix}.max ({ctrl.max}) must be greater than min ({ctrl.min}).")

        if ctrl.default is None or not math.isfinite(float(ctrl.default)):
            errors.append(f"{prefix}.default must be a finite number.")

        if not ctrl.affects:
            errors.append(f"{prefix}.affects must reference at least one existing part id.")
        else:
            resolved = [
                a
                for a in (
                    a_raw.strip()
                    if a_raw.strip() in seen_part_ids
                    else _normalize_id_candidate(a_raw)
                    for a_raw in ctrl.affects
                )
                if a in seen_part_ids
            ]
            if not resolved:
                errors.append(
                    f"{prefix}.affects {ctrl.affects} does not match any existing part id."
                )

    # --- Quiz (must have >= 4 questions) ---
    if len(draft.quiz) < 4:
        errors.append(
            f"Lesson must include at least 4 quiz questions (got {len(draft.quiz)})."
        )

    for idx, q_item in enumerate(draft.quiz[:6]):
        prefix = f"quiz[{idx}]"
        _check_bilingual(q_item.q, f"{prefix}.q", errors)
        _check_bilingual(q_item.explain, f"{prefix}.explain", errors)

        if len(q_item.options) != 4:
            errors.append(
                f"{prefix}.options must have exactly 4 options (got {len(q_item.options)})."
            )
        else:
            for opt_idx, opt in enumerate(q_item.options):
                _check_bilingual(
                    opt,
                    f"{prefix}.options[{opt_idx}]",
                    errors,
                    allow_numeric_ur=True,
                )

        if q_item.answer is None or not isinstance(q_item.answer, int) or isinstance(q_item.answer, bool) or not (0 <= q_item.answer <= 3):
            errors.append(f"{prefix}.answer must be an integer in 0..3 (got {q_item.answer}).")

    # --- Hero topic requirements (Section 6.7) ---
    if hero_spec is not None:
        actual_ids = tuple(p.id.strip() for p in kept_parts)
        if actual_ids != hero_spec.part_ids:
            errors.append(
                f"Hero topic '{hero_spec.topic_key}' requires exact part ids in order "
                f"{list(hero_spec.part_ids)}, but got {list(actual_ids)}."
            )
        req_ctrl = hero_spec.required_control
        matching_ctrl = next(
            (c for c in kept_controls if c.id.strip() == req_ctrl.id),
            None,
        )
        if matching_ctrl is None:
            errors.append(
                f"Hero topic '{hero_spec.topic_key}' requires a control with id '{req_ctrl.id}'."
            )
        else:
            if matching_ctrl.effect != req_ctrl.effect:
                errors.append(
                    f"Hero control '{req_ctrl.id}' must have effect '{req_ctrl.effect}' (got '{matching_ctrl.effect}')."
                )
            resolved_affects = {
                a.strip() if a.strip() in seen_part_ids else _normalize_id_candidate(a)
                for a in matching_ctrl.affects
            }
            if not set(req_ctrl.affects).issubset(resolved_affects):
                errors.append(
                    f"Hero control '{req_ctrl.id}' must affect {list(req_ctrl.affects)}."
                )

    return errors
