import colorsys
import math

from app.models.lesson import (
    ControlDraft,
    LessonDraft,
    MotionDraft,
    PartDraft,
    QuestionDraft,
    TextDraft,
)
from app.services.normalize import (
    clamp_pastel_color,
    clean_and_truncate,
    compute_part_bounding_radius,
    normalize_lesson,
    parse_hex_rgb,
)
from app.services.topics import get_hero_spec, slugify_topic
from app.services.validator import check_urdu_text, validate_lesson_draft


def _txt(en: str = "Sample text.", ur: str = "یہ ایک تعلیمی متن ہے۔") -> TextDraft:
    return TextDraft(en=en, ur=ur)


def _make_question(ans: int = 0) -> QuestionDraft:
    return QuestionDraft(
        q=_txt("What is this part?", "یہ حصہ کیا کام کرتا ہے؟"),
        options=[
            _txt("Option one", "پہلا انتخاب"),
            _txt("Option two", "دوسرا انتخاب"),
            _txt("Option three", "تیسرا انتخاب"),
            _txt("Option four", "چوتھا انتخاب"),
        ],
        answer=ans,
        explain=_txt("Because of function.", "کیونکہ یہی درست کام ہے۔"),
    )


def _make_part(pid: str, pos: list[float] | None = None, size: float = 1.0) -> PartDraft:
    return PartDraft(
        id=pid,
        name=_txt(f"Part {pid}", "حصہ خلیہ (Cell Part)"),
        shape="sphere",
        material="organelle",
        color="#FF0000",
        position=pos or [0.0, 0.0, 0.0],
        size=size,
        explain=_txt("Explains the part clearly.", "یہ اس حصے کی واضح تشریح کرتا ہے۔"),
    )


def _make_valid_draft() -> LessonDraft:
    return LessonDraft(
        topic="Simple Pendulum",
        category="physics",
        title=_txt("Simple Pendulum", "سادہ پنڈولم"),
        summary=_txt("A weight suspended from a pivot.", "ایک محور سے لٹکا ہوا وزن جو جھولتا ہے۔"),
        parts=[
            _make_part("pivot_mount", [0.0, 2.0, 0.0], 0.5),
            PartDraft(
                id="rod_cord",
                name=_txt("String", "ڈوری"),
                shape="tube",
                material="matte",
                color="#00FF00",
                position=[0.0, 1.0, 0.0],
                size=0.1,
                path=[[0.0, 2.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 0.0]],
                explain=_txt("Holds the bob.", "یہ گولے کو سہارا دیتی ہے۔"),
            ),
            _make_part("bob_mass", [0.0, 0.0, 0.0], 1.0),
        ],
        controls=[
            ControlDraft(
                id="swing_speed",
                label=_txt("Speed", "رفتار"),
                min=0.0,
                max=10.0,
                default=5.0,
                unit="m/s",
                effect="speed",
                affects=["bob_mass"],
            )
        ],
        quiz=[_make_question(0), _make_question(1), _make_question(2), _make_question(3)],
    )


def test_topic_aliases_and_slugs() -> None:
    assert slugify_topic("animal cell") == "human-cell"
    assert slugify_topic("  Structure of a Cell! ") == "human-cell"
    assert slugify_topic("Dispersion of Light") == "light-prism"
    assert slugify_topic("Glass Prism") == "light-prism"
    assert slugify_topic("The Solar System") == "solar-system"
    assert slugify_topic("Water Cycle & Evaporation") == "water-cycle-evaporation"


def test_pastel_clamp_and_emissive_saturation() -> None:
    pastel_hex = clamp_pastel_color("#FF0000", "organelle")
    r, g, b = parse_hex_rgb(pastel_hex)
    _, l_val, s_val = colorsys.rgb_to_hls(r, g, b)
    assert 0.24 <= s_val <= 0.56
    assert 0.67 <= l_val <= 0.87

    emissive_hex = clamp_pastel_color("#FF0000", "emissive")
    r2, g2, b2 = parse_hex_rgb(emissive_hex)
    _, l2, s2 = colorsys.rgb_to_hls(r2, g2, b2)
    assert 0.68 <= s2 <= 0.71
    assert 0.67 <= l2 <= 0.87


def test_bounds_scaling_from_radius_9_to_5_5() -> None:
    draft = _make_valid_draft()
    # Distance 7.5 + half of size 3.0 = 9.0 bounding radius
    draft.parts[0].position = [7.5, 0.0, 0.0]
    draft.parts[0].size = 3.0

    errors = validate_lesson_draft(draft)
    assert errors == []

    lesson = normalize_lesson(draft, topic_key="simple-pendulum")
    radii = [
        compute_part_bounding_radius(p.model_dump())
        for p in lesson.parts
    ]
    assert math.isclose(max(radii), 5.5, rel_tol=1e-3, abs_tol=1e-3)


def test_truncation_and_affects_filtering() -> None:
    long_en = "First short sentence. Second sentence continues here. " * 8
    truncated = clean_and_truncate(long_en, 80)
    assert len(truncated) <= 80
    assert truncated.endswith(".")

    draft = _make_valid_draft()
    # Partial affects: bob_mass exists, ghost_part does not -> auto-filtered
    draft.controls[0].affects = ["bob_mass", "ghost_part"]
    draft.controls[0].default = 99.0  # out-of-range -> clamped to max (10.0)

    assert validate_lesson_draft(draft) == []
    lesson = normalize_lesson(draft, topic_key="simple-pendulum")
    assert lesson.controls[0].affects == ["bob_mass"]
    assert lesson.controls[0].default == 10.0


def test_validator_reject_rules() -> None:
    # 1. Tube without path, bad Urdu, <4 quiz questions, all-invalid control affects
    draft = _make_valid_draft()
    draft.parts[1].path = None
    draft.parts[0].explain = TextDraft(en="Valid English", ur="Pure English not Urdu")
    draft.controls[0].affects = ["unknown_id"]
    draft.quiz = draft.quiz[:2]

    errors = validate_lesson_draft(draft)
    assert any("shape 'tube'" in e for e in errors)
    assert any("60% Urdu/Arabic script" in e for e in errors)
    assert any("does not match any existing part id" in e for e in errors)
    assert any("at least 4 quiz questions" in e for e in errors)

    # 2. Urdu with technical term in parentheses is valid
    assert check_urdu_text("مائٹوکونڈریا (Mitochondria)") is None
    assert check_urdu_text("(Mitochondria)") is not None


def test_hero_spec_validation_for_all_three_heroes() -> None:
    for hero_key in ("human-cell", "light-prism", "solar-system"):
        spec = get_hero_spec(hero_key)
        assert spec is not None

        hero_parts = [_make_part(pid) for pid in spec.part_ids]
        hero_ctrl = ControlDraft(
            id=spec.required_control.id,
            label=_txt("Control", "کنٹرول"),
            min=0.0,
            max=100.0,
            default=50.0,
            effect=spec.required_control.effect,
            affects=list(spec.required_control.affects),
        )
        draft = LessonDraft(
            topic=hero_key,
            category="biology",
            title=_txt("Hero", "ہیرو سبق"),
            summary=_txt("Summary.", "خلاصہ۔"),
            parts=hero_parts,
            controls=[hero_ctrl],
            quiz=[_make_question(0), _make_question(1), _make_question(2), _make_question(3)],
        )
        assert validate_lesson_draft(draft, hero_spec=spec) == []

        # Swapping order of first two hero parts must be rejected
        draft.parts[0], draft.parts[1] = draft.parts[1], draft.parts[0]
        errs = validate_lesson_draft(draft, hero_spec=spec)
        assert any("requires exact part ids in order" in e for e in errs)


def test_motion_normalization() -> None:
    draft = _make_valid_draft()
    draft.parts[2].motion = MotionDraft(type="swing", speed=9.0, amplitude=5.0, pivot=[0.0, 2.0, 0.0])
    lesson = normalize_lesson(draft, topic_key="simple-pendulum")
    assert lesson.parts[2].motion is not None
    assert lesson.parts[2].motion.speed == 3.0
    assert lesson.parts[2].motion.amplitude == 2.0
