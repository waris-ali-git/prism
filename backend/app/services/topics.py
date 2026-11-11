import re
import unicodedata
from dataclasses import dataclass

_NON_ALNUM_RE = re.compile(r"[^a-z0-9\s-]+")
_WHITESPACE_RE = re.compile(r"\s+")
_MULTI_DASH_RE = re.compile(r"-+")
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x1f\x7f-\x9f]")


@dataclass(frozen=True)
class HeroControlSpec:
    id: str
    effect: str
    affects: tuple[str, ...]


@dataclass(frozen=True)
class HeroTopicSpec:
    topic_key: str
    part_ids: tuple[str, ...]
    required_control: HeroControlSpec

    def build_prompt_requirement(self) -> str:
        ids_csv = ", ".join(self.part_ids)
        affects_json = "[" + ", ".join(f'"{pid}"' for pid in self.required_control.affects) + "]"
        return (
            f"HERO REQUIREMENT: Use exactly these part ids, in this order, and no other parts: {ids_csv}. "
            f'Also include a control with id "{self.required_control.id}", '
            f'effect "{self.required_control.effect}", affects {affects_json}.'
        )


HERO_SPECS: dict[str, HeroTopicSpec] = {
    "human-cell": HeroTopicSpec(
        topic_key="human-cell",
        part_ids=(
            "membrane",
            "nucleus",
            "nucleolus",
            "mitochondria",
            "rough_er",
            "golgi",
            "lysosomes",
            "ribosomes",
            "vesicles",
        ),
        required_control=HeroControlSpec(
            id="energy",
            effect="glow",
            affects=("mitochondria",),
        ),
    ),
    "light-prism": HeroTopicSpec(
        topic_key="light-prism",
        part_ids=(
            "glass_prism",
            "incident_beam",
            "refracted_beam",
            "red_ray",
            "green_ray",
            "violet_ray",
            "projection_screen",
        ),
        required_control=HeroControlSpec(
            id="dispersion",
            effect="spread",
            affects=("red_ray", "green_ray", "violet_ray"),
        ),
    ),
    "solar-system": HeroTopicSpec(
        topic_key="solar-system",
        part_ids=(
            "sun",
            "mercury",
            "venus",
            "earth",
            "mars",
            "asteroid_belt",
            "jupiter",
            "saturn",
            "saturn_rings",
            "neptune",
        ),
        required_control=HeroControlSpec(
            id="orbital_speed",
            effect="speed",
            affects=(
                "mercury",
                "venus",
                "earth",
                "mars",
                "jupiter",
                "saturn",
                "neptune",
            ),
        ),
    ),
}

TOPIC_ALIASES: dict[str, str] = {
    # Hero 1: human-cell
    "cell": "human-cell",
    "human cell": "human-cell",
    "animal cell": "human-cell",
    "cell structure": "human-cell",
    "structure of a cell": "human-cell",
    "structure of cell": "human-cell",
    "eukaryotic cell": "human-cell",
    # Hero 2: light-prism
    "prism": "light-prism",
    "light prism": "light-prism",
    "dispersion of light": "light-prism",
    "light dispersion": "light-prism",
    "refraction through prism": "light-prism",
    "refraction through a prism": "light-prism",
    "glass prism": "light-prism",
    "optical prism": "light-prism",
    "white light spectrum": "light-prism",
    # Hero 3: solar-system
    "solar system": "solar-system",
    "the solar system": "solar-system",
    "planets": "solar-system",
    "planetary system": "solar-system",
    "planets of solar system": "solar-system",
    "sun and planets": "solar-system",
    "orbital motion": "solar-system",
}


def sanitize_topic_input(raw: str) -> str:
    cleaned = _CONTROL_CHAR_RE.sub("", unicodedata.normalize("NFKC", raw))
    return _WHITESPACE_RE.sub(" ", cleaned).strip()


def normalize_topic_phrase(raw: str) -> str:
    lowered = sanitize_topic_input(raw).lower()
    alnum = _NON_ALNUM_RE.sub(" ", lowered)
    alnum = alnum.replace("-", " ")
    return _WHITESPACE_RE.sub(" ", alnum).strip()


def slugify_topic(raw: str) -> str:
    normalized = normalize_topic_phrase(raw)
    if normalized in TOPIC_ALIASES:
        return TOPIC_ALIASES[normalized]
    slug = normalized.replace(" ", "-")
    slug = _MULTI_DASH_RE.sub("-", slug).strip("-")
    if len(slug) > 60:
        slug = slug[:60].rstrip("-")
    return slug or "topic"


def get_hero_spec(topic_key: str) -> HeroTopicSpec | None:
    return HERO_SPECS.get(topic_key)
