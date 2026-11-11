import re
import unicodedata
from dataclasses import dataclass

from app.models.lesson import ControlDraft, LessonDraft, PartDraft, TextDraft

_NON_ALNUM_RE = re.compile(r"[^a-z0-9\s-]+")
_WHITESPACE_RE = re.compile(r"\s+")
_MULTI_DASH_RE = re.compile(r"-+")
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x1f\x7f-\x9f]")


@dataclass(frozen=True)
class HeroPartBlueprint:
    id: str
    name_en: str
    name_ur: str
    shape: str
    material: str
    color: str
    position: tuple[float, float, float]
    size: float
    prompt_hint: str
    explain_en: str
    explain_ur: str
    path: tuple[tuple[float, float, float], ...] | None = None
    count: int = 1
    spread: float = 0.0


@dataclass(frozen=True)
class HeroControlSpec:
    id: str
    label_en: str
    label_ur: str
    effect: str
    affects: tuple[str, ...]
    min_val: float = 0.0
    max_val: float = 100.0
    default_val: float = 50.0
    unit: str = "%"


@dataclass(frozen=True)
class HeroTopicSpec:
    topic_key: str
    category: str
    part_ids: tuple[str, ...]
    required_control: HeroControlSpec
    part_blueprints: tuple[HeroPartBlueprint, ...]
    part_aliases: dict[str, str]
    scene_guidance: str

    def build_prompt_requirement(self) -> str:
        ids_csv = ", ".join(self.part_ids)
        affects_json = "[" + ", ".join(f'"{pid}"' for pid in self.required_control.affects) + "]"
        part_lines = "\n".join(
            f'  {idx + 1}. "{bp.id}" ({bp.name_en}): {bp.prompt_hint}'
            for idx, bp in enumerate(self.part_blueprints)
        )
        return (
            f"HERO REQUIREMENT: Use exactly these part ids, in this order, and no other parts: {ids_csv}. "
            f'Also include a control with id "{self.required_control.id}", '
            f'effect "{self.required_control.effect}", affects {affects_json}.\n'
            f"Scene notes for {self.topic_key}:\n"
            f"{self.scene_guidance}\n"
            f"Required parts in exact order:\n{part_lines}"
        )


HERO_SPECS: dict[str, HeroTopicSpec] = {
    "human-cell": HeroTopicSpec(
        topic_key="human-cell",
        category="biology",
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
            label_en="Cellular ATP energy",
            label_ur="خلیاتی توانائی (ATP)",
            effect="glow",
            affects=("mitochondria",),
            min_val=0.0,
            max_val=100.0,
            default_val=60.0,
            unit="%",
        ),
        part_blueprints=(
            HeroPartBlueprint(
                id="membrane",
                name_en="Cell membrane",
                name_ur="خلیاتی جھلی (Cell membrane)",
                shape="sphere",
                material="membrane",
                color="#F2C6DE",
                position=(0.0, 0.0, 0.0),
                size=4.2,
                prompt_hint="outer translucent boundary that controls what enters and leaves the cell",
                explain_en="The semi-permeable outer boundary that protects the cell and regulates what substances enter and leave.",
                explain_ur="یہ نیم نفوذ پذیر بیرونی جھلی ہے جو خلیے کی حفاظت کرتی ہے اور اندر یا باہر جانے والے مادوں کو کنٹرول کرتی ہے۔",
            ),
            HeroPartBlueprint(
                id="nucleus",
                name_en="Nucleus",
                name_ur="مرکزہ (Nucleus)",
                shape="sphere",
                material="organelle",
                color="#B9B2EE",
                position=(-0.25, 0.15, -0.15),
                size=1.45,
                prompt_hint="central command centre holding DNA and genetic instructions",
                explain_en="The control center of the cell that houses DNA and directs growth, metabolism, and protein synthesis.",
                explain_ur="یہ خلیے کا کنٹرول سینٹر ہے جس میں ڈی این اے (DNA) موجود ہوتا ہے اور یہ خلیے کی تمام سرگرمیوں کی رہنمائی کرتا ہے۔",
            ),
            HeroPartBlueprint(
                id="nucleolus",
                name_en="Nucleolus",
                name_ur="مرکزچہ (Nucleolus)",
                shape="sphere",
                material="emissive",
                color="#D6C7FF",
                position=(-0.25, 0.2, -0.1),
                size=0.52,
                prompt_hint="dense core inside the nucleus that assembles ribosome subunits",
                explain_en="A dense region inside the nucleus where ribosomal RNA is synthesized and ribosome subunits are assembled.",
                explain_ur="مرکزے کے اندر موجود ایک گھنا حصہ جہاں رائبوسومز (Ribosomes) کے حصے تیار کیے جاتے ہیں۔",
            ),
            HeroPartBlueprint(
                id="mitochondria",
                name_en="Mitochondria",
                name_ur="مائٹوکونڈریا (Mitochondria)",
                shape="capsule",
                material="organelle",
                color="#FFCDB8",
                position=(1.35, -0.25, 0.75),
                size=0.68,
                prompt_hint="powerhouses with folded inner membranes that generate ATP energy",
                explain_en="Known as the powerhouses of the cell, they convert nutrients into chemical energy in the form of ATP.",
                explain_ur="انہیں خلیے کا بجلی گھر کہا جاتا ہے کیونکہ یہ خوراک کو کیمیائی توانائی (ATP) میں تبدیل کرتے ہیں۔",
            ),
            HeroPartBlueprint(
                id="rough_er",
                name_en="Rough endoplasmic reticulum",
                name_ur="رف اینڈوپلازمک ریٹیکولم (Rough ER)",
                shape="tube",
                material="organelle",
                color="#B5E8D2",
                position=(-0.85, 0.1, 0.45),
                size=0.26,
                path=((-1.15, 0.45, 0.35), (-0.85, 0.1, 0.65), (-0.45, -0.3, 0.55), (-0.95, -0.55, 0.2)),
                prompt_hint="ribosome-studded folded membrane network wrapping near the nucleus that folds proteins",
                explain_en="A network of folded membranes studded with ribosomes that synthesizes and folds new proteins.",
                explain_ur="مرکزے کے گرد لپٹی جھلیوں کا جال جس پر رائبوسومز جڑے ہوتے ہیں اور جہاں پروٹینز تیار ہوتی ہیں۔",
            ),
            HeroPartBlueprint(
                id="golgi",
                name_en="Golgi apparatus",
                name_ur="گولجی باڈی (Golgi apparatus)",
                shape="disc",
                material="organelle",
                color="#FBE9A8",
                position=(0.95, 0.65, -0.65),
                size=0.92,
                prompt_hint="stack of curved membrane discs that modifies, sorts and packages proteins",
                explain_en="A stack of flattened membrane sacs that modifies, sorts, and packages proteins into vesicles for delivery.",
                explain_ur="چپٹی تھیلیوں کا مجموعہ جو پروٹینز کو ترتیب دے کر پیک کرتا ہے اور خلیے کے دیگر حصوں تک بھیجتا ہے۔",
            ),
            HeroPartBlueprint(
                id="lysosomes",
                name_en="Lysosomes",
                name_ur="لائسوسومز (Lysosomes)",
                shape="sphere",
                material="organelle",
                color="#F6BFD3",
                position=(-1.25, -0.65, -0.75),
                size=0.42,
                prompt_hint="digestive enzyme spheres that recycle worn-out cell parts and break down waste",
                explain_en="Small spherical organelles filled with digestive enzymes that break down waste and worn-out cell components.",
                explain_ur="ہاضمے کے خامروں (Enzymes) سے بھری چھوٹی تھیلیاں جو فالتو مادوں اور پرانے حصوں کو توڑ کر صاف کرتی ہیں۔",
            ),
            HeroPartBlueprint(
                id="ribosomes",
                name_en="Ribosomes",
                name_ur="رائبوسومز (Ribosomes)",
                shape="sphere",
                material="matte",
                color="#B8DCF5",
                position=(-0.7, 0.35, 0.6),
                size=0.14,
                count=64,
                spread=1.6,
                prompt_hint="tiny protein-building complexes attached to rough ER and floating in cytoplasm",
                explain_en="Tiny molecular machines that read genetic instructions to link amino acids together and build proteins.",
                explain_ur="انتہائی چھوٹے ذرات جو جینیاتی ہدایات کے مطابق امینو ایسڈز کو جوڑ کر پروٹین بناتے ہیں۔",
            ),
            HeroPartBlueprint(
                id="vesicles",
                name_en="Vesicles",
                name_ur="ویسیکلز (Vesicles)",
                shape="sphere",
                material="liquid",
                color="#C9E4F8",
                position=(1.45, 0.35, 0.15),
                size=0.26,
                prompt_hint="small membrane-bound transport bubbles carrying cargo between Golgi and cell membrane",
                explain_en="Small membrane sacs that transport proteins and lipids between organelles and to the cell surface.",
                explain_ur="چھوٹی جھلی دار تھیلیاں جو پروٹینز اور دیگر مادوں کو گولجی باڈی سے خلیاتی جھلی تک منتقل کرتی ہیں۔",
            ),
        ),
        part_aliases={
            "cell_membrane": "membrane",
            "plasma_membrane": "membrane",
            "outer_membrane": "membrane",
            "cell_nucleus": "nucleus",
            "mitochondrion": "mitochondria",
            "er": "rough_er",
            "endoplasmic_reticulum": "rough_er",
            "rough_endoplasmic_reticulum": "rough_er",
            "golgi_apparatus": "golgi",
            "golgi_body": "golgi",
            "golgi_complex": "golgi",
            "lysosome": "lysosomes",
            "ribosome": "ribosomes",
            "vesicle": "vesicles",
            "secretory_vesicles": "vesicles",
        },
        scene_guidance=(
            "Place membrane at the origin surrounding all other organelles. "
            "Place nucleolus inside nucleus. Include the 'energy' control (effect 'glow', affects ['mitochondria'])."
        ),
    ),
    "light-prism": HeroTopicSpec(
        topic_key="light-prism",
        category="physics",
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
            label_en="Spectral dispersion",
            label_ur="روشنی کا انتشار (Dispersion)",
            effect="spread",
            affects=("red_ray", "green_ray", "violet_ray"),
            min_val=10.0,
            max_val=100.0,
            default_val=65.0,
            unit="%",
        ),
        part_blueprints=(
            HeroPartBlueprint(
                id="glass_prism",
                name_en="Optical glass prism",
                name_ur="شیشے کا منشور (Glass prism)",
                shape="box",
                material="glass",
                color="#EAE6FD",
                position=(0.0, 0.1, 0.0),
                size=2.1,
                prompt_hint="triangular transparent optical glass prism at the centre that refracts light twice",
                explain_en="A polished triangular glass block whose refractive index slows different wavelengths of light by different amounts.",
                explain_ur="شیشے کا ایک شفاف تکونی منشور جس میں سے گزرتے ہوئے مختلف طولِ موج (Wavelength) کی روشنی مختلف زاویوں پر مڑتی ہے۔",
            ),
            HeroPartBlueprint(
                id="incident_beam",
                name_en="Incident white beam",
                name_ur="سفید شعاعِ واقع (Incident beam)",
                shape="tube",
                material="emissive",
                color="#FFF8E8",
                position=(-2.4, -0.2, 0.0),
                size=0.18,
                path=((-4.1, -0.5, 0.0), (-2.4, -0.2, 0.0), (-0.68, 0.08, 0.0)),
                prompt_hint="incoming beam of white light containing all visible wavelengths traveling from left into the prism",
                explain_en="A narrow beam of white light entering the first face of the prism, containing all colors of the visible spectrum combined.",
                explain_ur="سفید روشنی کی شعاع جو منشور کی پہلی سطح پر پڑتی ہے؛ اس میں قوسِ قزح کے تمام رنگ شامل ہوتے ہیں۔",
            ),
            HeroPartBlueprint(
                id="refracted_beam",
                name_en="Internal refracted beam",
                name_ur="اندرونی منعطف شعاع (Refracted beam)",
                shape="tube",
                material="emissive",
                color="#E5E0FA",
                position=(0.0, 0.08, 0.0),
                size=0.22,
                path=((-0.68, 0.08, 0.0), (0.0, 0.06, 0.0), (0.64, 0.02, 0.0)),
                prompt_hint="light bending inside the glass medium as shorter wavelengths slow down more than longer ones",
                explain_en="Inside the dense glass, light slows down and bends toward the normal, beginning to separate by wavelength.",
                explain_ur="شیشے کے اندر داخل ہونے پر روشنی کی رفتار کم ہو جاتی ہے اور مختلف رنگ اپنی رفتار کے فرق سے الگ ہونا شروع ہو جاتے ہیں۔",
            ),
            HeroPartBlueprint(
                id="red_ray",
                name_en="Red spectrum ray (700 nm)",
                name_ur="سرخ شعاع (Red ray)",
                shape="tube",
                material="emissive",
                color="#FFB5B5",
                position=(2.1, 0.32, 0.0),
                size=0.14,
                path=((0.64, 0.16, 0.0), (2.1, 0.34, 0.0), (3.45, 0.52, 0.0)),
                prompt_hint="longest wavelength visible ray that bends the least upon exiting the prism",
                explain_en="Red light has the longest wavelength (~700 nm) and highest speed in glass, so it bends the least.",
                explain_ur="سرخ روشنی کا طولِ موج سب سے زیادہ (تقریباً 700 نینو میٹر) ہوتا ہے، اس لیے یہ سب سے کم زاویے پر مڑتی ہے۔",
            ),
            HeroPartBlueprint(
                id="green_ray",
                name_en="Green spectrum ray (530 nm)",
                name_ur="سبز شعاع (Green ray)",
                shape="tube",
                material="emissive",
                color="#B5E8D2",
                position=(2.1, -0.05, 0.0),
                size=0.14,
                path=((0.64, 0.04, 0.0), (2.1, -0.06, 0.0), (3.45, -0.15, 0.0)),
                prompt_hint="middle wavelength ray in the center of the dispersed visible spectrum",
                explain_en="Green light sits in the middle of the visible spectrum (~530 nm) and experiences an intermediate angle of deviation.",
                explain_ur="سبز روشنی مرئی طیف کے درمیان میں ہوتی ہے اور درمیانے زاویے سے مڑتی ہوئی پردے تک پہنچتی ہے۔",
            ),
            HeroPartBlueprint(
                id="violet_ray",
                name_en="Violet spectrum ray (400 nm)",
                name_ur="بنفشی شعاع (Violet ray)",
                shape="tube",
                material="emissive",
                color="#C7B9F5",
                position=(2.1, -0.48, 0.0),
                size=0.14,
                path=((0.64, -0.08, 0.0), (2.1, -0.46, 0.0), (3.45, -0.82, 0.0)),
                prompt_hint="shortest wavelength visible ray that slows down and bends the most",
                explain_en="Violet light has the shortest wavelength (~400 nm) and slows the most in glass, bending at the sharpest angle.",
                explain_ur="بنفشی روشنی کا طولِ موج سب سے کم (تقریباً 400 نینو میٹر) ہوتا ہے، اس لیے شیشے میں یہ سب سے زیادہ مڑتی ہے۔",
            ),
            HeroPartBlueprint(
                id="projection_screen",
                name_en="Spectrum projection screen",
                name_ur="طیفی پردہ (Projection screen)",
                shape="box",
                material="matte",
                color="#F2EFFC",
                position=(3.55, -0.15, 0.0),
                size=2.4,
                prompt_hint="observation screen on the right where the separated rainbow band (ROYGBIV) is displayed",
                explain_en="The observation screen captures the separated band of colors, revealing the continuous visible spectrum from red to violet.",
                explain_ur="یہ مشاہداتی پردہ منشور سے نکلنے والی الگ الگ رنگین شعاعوں کو قوسِ قزح کی پٹی (طیف) کی صورت میں دکھاتا ہے۔",
            ),
        ),
        part_aliases={
            "prism": "glass_prism",
            "optical_prism": "glass_prism",
            "incident_ray": "incident_beam",
            "white_light": "incident_beam",
            "white_beam": "incident_beam",
            "internal_beam": "refracted_beam",
            "refracted_ray": "refracted_beam",
            "red_light": "red_ray",
            "green_light": "green_ray",
            "violet_light": "violet_ray",
            "purple_ray": "violet_ray",
            "screen": "projection_screen",
            "spectrum_screen": "projection_screen",
        },
        scene_guidance=(
            "Place glass_prism near the origin. incident_beam enters from left (-X), refracted_beam travels inside the prism, "
            "and red_ray, green_ray, violet_ray fan out to projection_screen on the right (+X)."
        ),
    ),
    "solar-system": HeroTopicSpec(
        topic_key="solar-system",
        category="astronomy",
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
            label_en="Orbital velocity",
            label_ur="مداری رفتار (Orbital speed)",
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
            min_val=10.0,
            max_val=200.0,
            default_val=100.0,
            unit="%",
        ),
        part_blueprints=(
            HeroPartBlueprint(
                id="sun",
                name_en="The Sun",
                name_ur="سورج (Sun)",
                shape="sphere",
                material="emissive",
                color="#FFE29A",
                position=(0.0, 0.0, 0.0),
                size=1.35,
                prompt_hint="central G-type star holding 99.8% of the solar system's mass and radiating light via nuclear fusion",
                explain_en="The central star of our solar system whose immense gravity holds all planets in orbit and whose core fusion radiates light and heat.",
                explain_ur="ہمارے نظامِ شمسی کا مرکزی ستارہ جس کی کششِ ثقل تمام سیاروں کو ان کے مدار میں رکھتی ہے اور جو روشنی اور حرارت خارج کرتا ہے۔",
            ),
            HeroPartBlueprint(
                id="mercury",
                name_en="Mercury",
                name_ur="عطارد (Mercury)",
                shape="sphere",
                material="matte",
                color="#D8D2E8",
                position=(1.25, 0.0, 0.0),
                size=0.24,
                prompt_hint="smallest, innermost rocky planet with extreme temperature swings and the fastest orbit",
                explain_en="The closest rocky planet to the Sun, completing an orbit in just 88 Earth days with extreme day-to-night temperatures.",
                explain_ur="سورج کے سب سے قریب اور سب سے چھوٹا چٹانی سیارہ جو صرف 88 زمینی دنوں میں سورج کے گرد چکر مکمل کرتا ہے۔",
            ),
            HeroPartBlueprint(
                id="venus",
                name_en="Venus",
                name_ur="زہرہ (Venus)",
                shape="sphere",
                material="organelle",
                color="#FBE2B4",
                position=(1.72, 0.0, 0.0),
                size=0.34,
                prompt_hint="second planet wrapped in thick carbon dioxide clouds causing a runaway greenhouse effect",
                explain_en="Shrouded in dense clouds that trap heat, making Venus the hottest planet in the solar system.",
                explain_ur="گھنے بادلوں سے ڈھکا ہوا سیارہ جہاں گرین ہاؤس اثر کی وجہ سے نظامِ شمسی کا سب سے زیادہ درجہ حرارت پایا جاتا ہے۔",
            ),
            HeroPartBlueprint(
                id="earth",
                name_en="Earth",
                name_ur="زمین (Earth)",
                shape="sphere",
                material="organelle",
                color="#B8DCF5",
                position=(2.28, 0.0, 0.0),
                size=0.38,
                prompt_hint="our home world in the habitable zone with liquid water oceans and a protective atmosphere",
                explain_en="Located in the habitable zone with liquid oceans, an oxygen-rich atmosphere, and a protective magnetic field that supports life.",
                explain_ur="قابلِ رہائش زون میں واقع ہمارا سیارہ جہاں مائع پانی کے سمندر اور آکسیجن سے بھرپور فضا زندگی کو ممکن بناتی ہے۔",
            ),
            HeroPartBlueprint(
                id="mars",
                name_en="Mars",
                name_ur="مریخ (Mars)",
                shape="sphere",
                material="matte",
                color="#FFC4B2",
                position=(2.82, 0.0, 0.0),
                size=0.30,
                prompt_hint="cold dusty red planet with iron-oxide soil, polar ice caps, and giant volcanoes",
                explain_en="Known as the Red Planet due to iron oxide dust on its surface, featuring polar ice caps and ancient river valleys.",
                explain_ur="آئرن آکسائیڈ کی سرخی مائل گرد کی وجہ سے اسے سرخ سیارہ کہا جاتا ہے؛ اس کے قطبین پر برف موجود ہے۔",
            ),
            HeroPartBlueprint(
                id="asteroid_belt",
                name_en="Asteroid belt",
                name_ur="سیارچوں کی پٹی (Asteroid belt)",
                shape="sphere",
                material="matte",
                color="#DDD7EE",
                position=(3.38, 0.0, 0.0),
                size=0.14,
                count=90,
                spread=1.2,
                prompt_hint="ring of rocky remnants orbiting between Mars and Jupiter",
                explain_en="A torus-shaped region between Mars and Jupiter containing millions of rocky remnants left over from the early solar system.",
                explain_ur="مریخ اور مشتری کے درمیان گردش کرنے والے لاکھوں چٹانی ٹکڑوں اور سیارچوں کی پٹی۔",
            ),
            HeroPartBlueprint(
                id="jupiter",
                name_en="Jupiter",
                name_ur="مشتری (Jupiter)",
                shape="sphere",
                material="organelle",
                color="#FFD5BE",
                position=(4.05, 0.0, 0.0),
                size=0.72,
                prompt_hint="largest gas giant composed of hydrogen and helium with swirling cloud bands and the Great Red Spot",
                explain_en="The largest planet in the solar system, a massive gas giant of hydrogen and helium with powerful banded storms.",
                explain_ur="نظامِ شمسی کا سب سے بڑا گیس دیو سیارہ جو ہائیڈروجن اور ہیلیم سے بنا ہے اور جس پر عظیم طوفانی پٹیاں موجود ہیں۔",
            ),
            HeroPartBlueprint(
                id="saturn",
                name_en="Saturn",
                name_ur="زحل (Saturn)",
                shape="sphere",
                material="organelle",
                color="#FBE9A8",
                position=(4.78, 0.0, 0.0),
                size=0.58,
                prompt_hint="pale gold gas giant famous for its low density and spectacular ring system",
                explain_en="A gas giant of hydrogen and helium with a tilted axis, surrounded by the most extensive ring system in the solar system.",
                explain_ur="سنہری رنگت والا عظیم گیس سیارہ جو اپنے خوبصورت اور وسیع گردشی حلقوں کی وجہ سے مشہور ہے۔",
            ),
            HeroPartBlueprint(
                id="saturn_rings",
                name_en="Saturn's rings",
                name_ur="زحل کے حلقے (Saturn's rings)",
                shape="torus",
                material="glass",
                color="#EDE6FC",
                position=(4.78, 0.0, 0.0),
                size=1.08,
                prompt_hint="concentric bands of ice and dust particles orbiting around Saturn's equator",
                explain_en="Vast concentric bands made of billions of reflective water-ice and rocky particles orbiting Saturn's equator.",
                explain_ur="برف اور چٹانی ذرات کے اربوں ٹکڑوں سے بنے روشن حلقے جو زحل کے خطِ استوا کے گرد گردش کرتے ہیں۔",
            ),
            HeroPartBlueprint(
                id="neptune",
                name_en="Neptune",
                name_ur="نیپچون (Neptune)",
                shape="sphere",
                material="organelle",
                color="#B5CCF8",
                position=(5.32, 0.0, 0.0),
                size=0.44,
                prompt_hint="distant azure ice giant with methane clouds and supersonic winds",
                explain_en="The outermost major planet, a cold blue ice giant where methane in the upper atmosphere absorbs red light.",
                explain_ur="نظامِ شمسی کا دور ترین نیلا برفانی سیارہ جہاں میتھین گیس کی موجودگی اسے گہرا نیلا رنگ دیتی ہے۔",
            ),
        ),
        part_aliases={
            "the_sun": "sun",
            "star_sun": "sun",
            "planet_mercury": "mercury",
            "planet_venus": "venus",
            "planet_earth": "earth",
            "planet_mars": "mars",
            "asteroids": "asteroid_belt",
            "main_asteroid_belt": "asteroid_belt",
            "planet_jupiter": "jupiter",
            "planet_saturn": "saturn",
            "rings": "saturn_rings",
            "saturns_rings": "saturn_rings",
            "ring_system": "saturn_rings",
            "planet_neptune": "neptune",
        },
        scene_guidance=(
            "Place sun at the origin [0,0,0]. Arrange planets outward along the orbital plane within radius 5.35. "
            "Include 'orbital_speed' control (effect 'speed') affecting all planets."
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
    "biology cell": "human-cell",
    "cell organelles": "human-cell",
    "parts of a cell": "human-cell",
    "inside a cell": "human-cell",
    # Hero 2: light-prism
    "prism": "light-prism",
    "light prism": "light-prism",
    "dispersion of light": "light-prism",
    "light dispersion": "light-prism",
    "refraction through prism": "light-prism",
    "refraction through a prism": "light-prism",
    "refraction of light": "light-prism",
    "glass prism": "light-prism",
    "optical prism": "light-prism",
    "white light spectrum": "light-prism",
    "rainbow prism": "light-prism",
    "newton prism": "light-prism",
    "spectrum of light": "light-prism",
    # Hero 3: solar-system
    "solar system": "solar-system",
    "the solar system": "solar-system",
    "planets": "solar-system",
    "planetary system": "solar-system",
    "planets of solar system": "solar-system",
    "planets in solar system": "solar-system",
    "sun and planets": "solar-system",
    "orbital motion": "solar-system",
    "eight planets": "solar-system",
    "our solar system": "solar-system",
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


def repair_hero_draft(draft: LessonDraft, hero_spec: HeroTopicSpec) -> None:
    """
    Canonicalize a Gemini LessonDraft for a hero topic so minor part ordering,
    synonym part ids, or control id variations never cause avoidable 502 failures.
    """
    if not draft.category or draft.category.strip() not in {
        "biology",
        "physics",
        "chemistry",
        "earth_science",
        "astronomy",
        "math",
        "geography",
        "other",
    }:
        draft.category = hero_spec.category

    by_canonical_id: dict[str, PartDraft] = {}
    for part in draft.parts:
        raw_id = part.id.strip().lower().replace("-", "_").replace(" ", "_")
        canonical_id = hero_spec.part_aliases.get(raw_id, raw_id)
        if canonical_id in hero_spec.part_ids and canonical_id not in by_canonical_id:
            part.id = canonical_id
            by_canonical_id[canonical_id] = part

    # Rebuild parts in exact canonical order, filling any missing hero part from blueprint
    ordered_parts: list[PartDraft] = []
    for bp in hero_spec.part_blueprints:
        existing = by_canonical_id.get(bp.id)
        if existing is not None:
            if existing.shape == "tube" and (not existing.path or len(existing.path) < 3):
                existing.path = (
                    [list(pt) for pt in bp.path]
                    if bp.path
                    else [[-1.0, 0.0, 0.0], [0.0, 0.0, 0.0], [1.0, 0.0, 0.0]]
                )
            ordered_parts.append(existing)
        else:
            ordered_parts.append(
                PartDraft(
                    id=bp.id,
                    name=TextDraft(en=bp.name_en, ur=bp.name_ur),
                    shape=bp.shape,
                    material=bp.material,
                    color=bp.color,
                    position=list(bp.position),
                    size=bp.size,
                    path=[list(pt) for pt in bp.path] if bp.path else None,
                    count=bp.count if bp.count > 1 else None,
                    spread=bp.spread if bp.spread > 0 else None,
                    explain=TextDraft(en=bp.explain_en, ur=bp.explain_ur),
                )
            )
    draft.parts = ordered_parts

    # Ensure required hero control exists with exact id, effect, and affects
    req = hero_spec.required_control
    matched_ctrl: ControlDraft | None = None
    for ctrl in draft.controls:
        cid = ctrl.id.strip().lower().replace("-", "_").replace(" ", "_")
        if cid == req.id:
            matched_ctrl = ctrl
            break

    if matched_ctrl is None and draft.controls:
        # Check if first control has matching effect
        for ctrl in draft.controls:
            if ctrl.effect == req.effect:
                matched_ctrl = ctrl
                break

    if matched_ctrl is not None:
        matched_ctrl.id = req.id
        matched_ctrl.effect = req.effect
        matched_ctrl.affects = list(req.affects)
        if matched_ctrl.label is None or not matched_ctrl.label.en.strip():
            matched_ctrl.label = TextDraft(en=req.label_en, ur=req.label_ur)
    else:
        draft.controls.insert(
            0,
            ControlDraft(
                id=req.id,
                label=TextDraft(en=req.label_en, ur=req.label_ur),
                min=req.min_val,
                max=req.max_val,
                default=req.default_val,
                unit=req.unit,
                effect=req.effect,
                affects=list(req.affects),
            ),
        )
