import type { Lesson } from '../api/types';

export const HUMAN_CELL_LESSON: Lesson = {
  schemaVersion: 1,
  topic: 'Human Cell',
  topicKey: 'human-cell',
  category: 'biology',
  title: {
    en: 'Human Cell Architecture',
    ur: 'انسانی خلیہ کی ساخت اور افعال',
  },
  summary: {
    en: 'The fundamental unit of eukaryotic life, containing specialized organelles working in unison enclosed by a flexible membrane.',
    ur: 'حیاتیات کی بنیادی اکائی، جس میں مخصوص اعضاء (آرگینیلز) ایک حفاظتی جھلی کے اندر زندگی کی بقا کے لیے کام کرتے ہیں۔',
  },
  camera: {
    position: [0, 1.2, 7.8],
    target: [0, 0, 0],
  },
  parts: [
    {
      id: 'membrane',
      name: { en: 'Cell membrane', ur: 'خلیاتی جھلی (Cell membrane)' },
      shape: 'sphere',
      material: 'membrane',
      color: '#F2C6DE',
      position: [0, 0, 0],
      size: 4.2,
      explain: {
        en: 'The semi-permeable phospholipid bilayer that protects the cell and regulates what nutrients and signals enter and leave.',
        ur: 'یہ نیم نفوذ پذیر بیرونی جھلی ہے جو خلیے کی حفاظت کرتی ہے اور اندر یا باہر جانے والے مادوں اور غذائی اجزاء کو کنٹرول کرتی ہے۔',
      },
    },
    {
      id: 'nucleus',
      name: { en: 'Nucleus', ur: 'مرکزہ (Nucleus)' },
      shape: 'sphere',
      material: 'organelle',
      color: '#B9B2EE',
      position: [-0.25, 0.15, -0.15],
      size: 1.45,
      explain: {
        en: 'The genetic command center of the cell that houses DNA and directs growth, metabolism, and cellular reproduction.',
        ur: 'یہ خلیے کا کنٹرول سینٹر ہے جس میں ڈی این اے (DNA) موجود ہوتا ہے اور یہ خلیے کی تمام اہم سرگرمیوں کی رہنمائی کرتا ہے۔',
      },
    },
    {
      id: 'nucleolus',
      name: { en: 'Nucleolus', ur: 'مرکزچہ (Nucleolus)' },
      shape: 'sphere',
      material: 'emissive',
      color: '#D6C7FF',
      position: [-0.25, 0.2, -0.1],
      size: 0.52,
      explain: {
        en: 'A dense spherical region inside the nucleus where ribosomal RNA is transcribed and ribosome subunits are assembled.',
        ur: 'مرکزے کے اندر موجود ایک گھنا حصہ جہاں رائبوسومز (Ribosomes) کے بنیادی حصے تیار کیے جاتے ہیں۔',
      },
    },
    {
      id: 'mitochondria',
      name: { en: 'Mitochondria', ur: 'مائٹوکونڈریا (Mitochondria)' },
      shape: 'capsule',
      material: 'organelle',
      color: '#FFCDB8',
      position: [1.35, -0.25, 0.75],
      size: 0.68,
      explain: {
        en: 'The powerhouses of the cell that convert nutrients into cellular ATP energy through aerobic respiration.',
        ur: 'انہیں خلیے کا بجلی گھر کہا جاتا ہے کیونکہ یہ خوراک کو کیمیائی توانائی (ATP) میں تبدیل کرتے ہیں۔',
      },
    },
    {
      id: 'rough_er',
      name: { en: 'Rough endoplasmic reticulum', ur: 'اینڈوپلازمک ریٹیکولم (Rough ER)' },
      shape: 'tube',
      material: 'organelle',
      color: '#B5E8D2',
      position: [-0.85, 0.1, 0.45],
      size: 0.26,
      path: [
        [-1.15, 0.45, 0.35],
        [-0.85, 0.1, 0.65],
        [-0.45, -0.3, 0.55],
        [-0.95, -0.55, 0.2],
      ],
      explain: {
        en: 'A network of folded membranes studded with ribosomes that synthesizes, processes, and folds new protein chains.',
        ur: 'مرکزے کے گرد لپٹی جھلیوں کا جال جس پر رائبوسومز جڑے ہوتے ہیں اور جہاں ضروری پروٹینز تیار ہوتی ہیں۔',
      },
    },
    {
      id: 'golgi',
      name: { en: 'Golgi apparatus', ur: 'گولجی باڈی (Golgi apparatus)' },
      shape: 'disc',
      material: 'organelle',
      color: '#FBE9A8',
      position: [0.95, 0.65, -0.65],
      size: 0.92,
      explain: {
        en: 'A series of flattened cisternae that modifies, sorts, and packages synthesized proteins for secretion or intracellular delivery.',
        ur: 'چپٹی تھیلیوں کا مجموعہ جو پروٹینز کو حتمی شکل دے کر پیک کرتا ہے اور خلیے کے دیگر حصوں تک روانہ کرتا ہے۔',
      },
    },
    {
      id: 'lysosomes',
      name: { en: 'Lysosomes', ur: 'لائسوسومز (Lysosomes)' },
      shape: 'sphere',
      material: 'organelle',
      color: '#F6BFD3',
      position: [-1.25, -0.65, -0.75],
      size: 0.42,
      explain: {
        en: 'Digestive vesicles filled with hydrolytic enzymes that break down waste, foreign pathogens, and worn-out cellular parts.',
        ur: 'ہاضمے کے خامروں سے بھری تھیلیاں جو فالتو مادوں اور پرانے بیکار حصوں کو توڑ کر خلیے کو صاف رکھتی ہیں۔',
      },
    },
    {
      id: 'ribosomes',
      name: { en: 'Ribosomes', ur: 'رائبوسومز (Ribosomes)' },
      shape: 'sphere',
      material: 'matte',
      color: '#B8DCF5',
      position: [-0.7, 0.35, 0.6],
      size: 0.14,
      count: 64,
      spread: 1.6,
      explain: {
        en: 'Molecular machines that translate messenger RNA into polypeptide chains to assemble functional proteins.',
        ur: 'انتہائی باریک ذرات جو میسنجر آر این اے کی ہدایات پڑھ کر امینو ایسڈز سے پروٹین بناتے ہیں۔',
      },
    },
    {
      id: 'vesicles',
      name: { en: 'Vesicles', ur: 'ویسیکلز (Vesicles)' },
      shape: 'sphere',
      material: 'liquid',
      color: '#C9E4F8',
      position: [1.45, 0.35, 0.15],
      size: 0.26,
      explain: {
        en: 'Small membrane-bound transport capsules carrying biochemical cargo between organelles and the outer membrane.',
        ur: 'چھوٹی جھلی دار تھیلیاں جو پروٹینز اور دیگر کیمیائی مادوں کو گولجی باڈی سے خلیاتی جھلی تک پہنچاتی ہیں۔',
      },
    },
  ],
  controls: [
    {
      id: 'energy',
      label: { en: 'Mitochondrial Energy (ATP)', ur: 'خلیاتی توانائی (ATP)' },
      min: 0,
      max: 100,
      default: 60,
      unit: '%',
      effect: 'glow',
      affects: ['mitochondria'],
    },
  ],
  quiz: [
    {
      q: {
        en: 'Which organelle is universally known as the powerhouse of the cell?',
        ur: 'خلیے کا پاور ہاؤس (بجلی گھر) کس حصے کو کہا جاتا ہے؟',
      },
      options: [
        { en: 'Mitochondria', ur: 'مائٹوکونڈریا' },
        { en: 'Golgi apparatus', ur: 'گولجی اپریٹس' },
        { en: 'Lysosome', ur: 'لائسوسوم' },
        { en: 'Nucleolus', ur: 'مرکزچہ' },
      ],
      answer: 0,
      explain: {
        en: 'Mitochondria generate ATP energy through cellular respiration.',
        ur: 'مائٹوکونڈریا سیلولر ریسپائریشن کے ذریعے اے ٹی پی (ATP) توانائی پیدا کرتے ہیں۔',
      },
    },
    {
      q: {
        en: 'What is the primary function of the cell membrane?',
        ur: 'خلیاتی جھلی (Cell membrane) کا بنیادی کام کیا ہے؟',
      },
      options: [
        { en: 'Creating genetic codes', ur: 'ڈی این اے کوڈ بنانا' },
        { en: 'Regulating what enters and leaves the cell', ur: 'اندر اور باہر مادوں کی آمد و رفت کنٹرول کرنا' },
        { en: 'Producing digestive acid', ur: 'ہاضمے کی تیزابیت بنانا' },
        { en: 'Anchoring bone tissues', ur: 'ہڈیوں کے خلیات جوڑنا' },
      ],
      answer: 1,
      explain: {
        en: 'The semi-permeable membrane regulates molecular transport into and out of the cell.',
        ur: 'نیم نفوذ پذیر جھلی خلیے کے اندر اور باہر مالیکیولز کی منتقلی کو باقاعدہ بناتی ہے۔',
      },
    },
    {
      q: {
        en: 'Where is ribosomal RNA synthesized within the cell?',
        ur: 'خلیے کے اندر رائبوسومل آر این اے کہاں تیار ہوتا ہے؟',
      },
      options: [
        { en: 'Nucleolus', ur: 'مرکزچہ (نیوکلیولس)' },
        { en: 'Smooth ER', ur: 'اسموتھ ای آر' },
        { en: 'Vesicle', ur: 'ویسیکل' },
        { en: 'Cell membrane', ur: 'خلیاتی جھلی' },
      ],
      answer: 0,
      explain: {
        en: 'The nucleolus is the dense core inside the nucleus dedicated to making ribosomes.',
        ur: 'نیوکلیولس مرکزے کا وہ گھنا حصہ ہے جہاں رائبوسومز بنائے جاتے ہیں۔',
      },
    },
    {
      q: {
        en: 'Which organelle modifies, sorts, and packages proteins for transport?',
        ur: 'کون سا عضو پروٹینز کو پروسیس اور پیک کر کے روانہ کرتا ہے؟',
      },
      options: [
        { en: 'Golgi apparatus', ur: 'گولجی باڈی (Golgi apparatus)' },
        { en: 'Lysosomes', ur: 'لائسوسومز' },
        { en: 'Mitochondria', ur: 'مائٹوکونڈریا' },
        { en: 'Nucleus', ur: 'مرکزہ' },
      ],
      answer: 0,
      explain: {
        en: 'The Golgi apparatus acts as the cell shipping center, packaging proteins into vesicles.',
        ur: 'گولجی اپریٹس تیار شدہ پروٹینز کی پیکنگ اور ترسیل کا ذمہ دار ہے۔',
      },
    },
  ],
};

export const LIGHT_PRISM_LESSON: Lesson = {
  schemaVersion: 1,
  topic: 'Light Prism',
  topicKey: 'light-prism',
  category: 'physics',
  title: {
    en: 'Light Prism & Dispersion',
    ur: 'شیشے کا منشور اور روشنی کا انتشار',
  },
  summary: {
    en: 'Refraction of composite white light as it bends and separates into its constituent spectral wavelengths through an optical prism.',
    ur: 'شیشے کے تکونی منشور سے گزرتے ہوئے سفید روشنی مختلف زاویوں پر مڑ کر قوسِ قزح کے رنگوں کے طیف میں بٹ جاتی ہے۔',
  },
  camera: {
    position: [0, 1.2, 7.8],
    target: [0, 0, 0],
  },
  parts: [
    {
      id: 'glass_prism',
      name: { en: 'Optical glass prism', ur: 'شیشے کا منشور (Glass prism)' },
      shape: 'box',
      material: 'glass',
      color: '#EAE6FD',
      position: [0, 0.1, 0],
      size: 2.1,
      explain: {
        en: 'A polished triangular glass block whose refractive index slows different wavelengths of light by different degrees.',
        ur: 'شیشے کا شفاف تکونی بلاک جو مختلف طولِ موج کی روشنی کی رفتار کو کم کر کے انہیں الگ کرتا ہے۔',
      },
    },
    {
      id: 'incident_beam',
      name: { en: 'Incident white beam', ur: 'سفید شعاعِ واقع (Incident beam)' },
      shape: 'tube',
      material: 'emissive',
      color: '#FFF8E8',
      position: [-2.4, -0.2, 0],
      size: 0.18,
      path: [
        [-4.1, -0.5, 0],
        [-2.4, -0.2, 0],
        [-0.68, 0.08, 0],
      ],
      explain: {
        en: 'A narrow collimated beam of white light entering the first face of the prism, containing all visible spectrum colors.',
        ur: 'سفید روشنی کی شعاع جو منشور پر پڑتی ہے؛ اس میں نظر آنے والے تمام رنگ بیک وقت موجود ہوتے ہیں۔',
      },
    },
    {
      id: 'refracted_beam',
      name: { en: 'Refracted beam', ur: 'اندرونی منعطف شعاع (Refracted beam)' },
      shape: 'tube',
      material: 'emissive',
      color: '#E5E0FA',
      position: [0, 0.08, 0],
      size: 0.22,
      path: [
        [-0.68, 0.08, 0],
        [0, 0.06, 0],
        [0.64, 0.02, 0],
      ],
      explain: {
        en: 'Inside the denser glass, light slows down and bends, with shorter wavelengths bending more sharply.',
        ur: 'شیشے کے اندر روشنی کی رفتار دھیمی ہو جاتی ہے اور وہ عام نارمل کی طرف جھکنا شروع کر دیتی ہے۔',
      },
    },
    {
      id: 'red_ray',
      name: { en: 'Red ray (700 nm)', ur: 'سرخ شعاع (Red ray - 700nm)' },
      shape: 'tube',
      material: 'emissive',
      color: '#FFB5B5',
      position: [2.1, 0.32, 0],
      size: 0.14,
      path: [
        [0.64, 0.16, 0],
        [2.1, 0.34, 0],
        [3.45, 0.52, 0],
      ],
      explain: {
        en: 'Red light has the longest wavelength (~700 nm) in the visible spectrum and experiences the least refraction.',
        ur: 'سرخ روشنی کا طولِ موج سب سے لمبا ہوتا ہے جس کی وجہ سے یہ منشور میں سب سے کم مڑتی ہے۔',
      },
    },
    {
      id: 'green_ray',
      name: { en: 'Green ray (530 nm)', ur: 'سبز شعاع (Green ray - 530nm)' },
      shape: 'tube',
      material: 'emissive',
      color: '#B5E8D2',
      position: [2.1, -0.05, 0],
      size: 0.14,
      path: [
        [0.64, 0.04, 0],
        [2.1, -0.06, 0],
        [3.45, -0.15, 0],
      ],
      explain: {
        en: 'Green light occupies the central band of the visible spectrum (~530 nm) with intermediate deviation.',
        ur: 'سبز روشنی نظر آنے والے طیف کے بالکل درمیان میں واقع ہوتی ہے اور اوسط زاویے پر مڑتی ہے۔',
      },
    },
    {
      id: 'violet_ray',
      name: { en: 'Violet ray (400 nm)', ur: 'بنفشی شعاع (Violet ray - 400nm)' },
      shape: 'tube',
      material: 'emissive',
      color: '#C7B9F5',
      position: [2.1, -0.48, 0],
      size: 0.14,
      path: [
        [0.64, -0.08, 0],
        [2.1, -0.46, 0],
        [3.45, -0.82, 0],
      ],
      explain: {
        en: 'Violet light has the shortest wavelength (~400 nm) and slows the most in glass, resulting in the largest bend angle.',
        ur: 'بنفشی روشنی کا طولِ موج سب سے چھوٹا ہوتا ہے اس لیے شیشے میں یہ سب سے زیادہ زاویے پر مڑتی ہے۔',
      },
    },
    {
      id: 'projection_screen',
      name: { en: 'Projection screen', ur: 'پروجیکشن سکرین (Display screen)' },
      shape: 'box',
      material: 'matte',
      color: '#FFFFFF',
      position: [3.6, -0.1, 0],
      size: 2.4,
      explain: {
        en: 'A white surface that intercepts the dispersed spectral rays, revealing the continuous band of rainbow colors.',
        ur: 'سفید پردہ جس پر منتشر ہونے والے تمام رنگ صاف اور واضح دکھائی دیتے ہیں۔',
      },
    },
  ],
  controls: [
    {
      id: 'dispersion',
      label: { en: 'Spectral Dispersion', ur: 'طیفی انتشار (Dispersion)' },
      min: 10,
      max: 100,
      default: 65,
      unit: '%',
      effect: 'spread',
      affects: ['red_ray', 'green_ray', 'violet_ray'],
    },
  ],
  quiz: [
    {
      q: {
        en: 'Which color of light bends the MOST when passing through a glass prism?',
        ur: 'منشور سے گزرتے ہوئے کون سے رنگ کی روشنی سب سے زیادہ مڑتی ہے؟',
      },
      options: [
        { en: 'Violet', ur: 'بنفشی (Violet)' },
        { en: 'Red', ur: 'سرخ (Red)' },
        { en: 'Green', ur: 'سبز (Green)' },
        { en: 'Yellow', ur: 'پیلا (Yellow)' },
      ],
      answer: 0,
      explain: {
        en: 'Violet light has the shortest wavelength and slows down the most in glass, bending with greatest refraction.',
        ur: 'بنفشی رنگ کا طولِ موج سب سے چھوٹا ہوتا ہے اس لیے شیشے میں اس کا انعطاف سب سے زیادہ ہوتا ہے۔',
      },
    },
    {
      q: {
        en: 'What optical phenomenon causes white light to separate into colors in a prism?',
        ur: 'منشور میں سفید روشنی کے مختلف رنگوں میں تقسیم ہونے کے عمل کو کیا کہتے ہیں؟',
      },
      options: [
        { en: 'Dispersion', ur: 'انتشارِ نور (Dispersion)' },
        { en: 'Total internal reflection', ur: 'مکمل اندرونی انعکاس' },
        { en: 'Polarization', ur: 'پولرائزیشن' },
        { en: 'Diffraction', ur: 'پھیلاؤ (Diffraction)' },
      ],
      answer: 0,
      explain: {
        en: 'Dispersion is the separation of white light into its component wavelengths due to varying speeds.',
        ur: 'روشنی کا انتشار (Dispersion) مختلف رنگوں کی مختلف رفتار کی وجہ سے ان کے الگ ہونے کا عمل ہے۔',
      },
    },
    {
      q: {
        en: 'Which visible light wavelength is the longest?',
        ur: 'مرئی روشنی میں کس رنگ کا طولِ موج (Wavelength) سب سے طویل ہوتا ہے؟',
      },
      options: [
        { en: 'Red (~700 nm)', ur: 'سرخ (تقریباً 700nm)' },
        { en: 'Blue (~450 nm)', ur: 'نیلا (تقریباً 450nm)' },
        { en: 'Violet (~400 nm)', ur: 'بنفشی (تقریباً 400nm)' },
        { en: 'Green (~530 nm)', ur: 'سبز (تقریباً 530nm)' },
      ],
      answer: 0,
      explain: {
        en: 'Red light possesses the longest wavelength and lowest frequency in the visible spectrum.',
        ur: 'سرخ روشنی کا طولِ موج نظر آنے والے رنگوں میں سب سے لمبا ہوتا ہے۔',
      },
    },
    {
      q: {
        en: 'Why does white light bend inside the prism?',
        ur: 'منشور کے اندر سفید روشنی کے مڑنے کی بنیادی وجہ کیا ہے؟',
      },
      options: [
        { en: 'Light speed changes between air and glass', ur: 'ہوا اور شیشے کے درمیان روشنی کی رفتار بدل جاتی ہے' },
        { en: 'The glass absorbs the heat', ur: 'شیشہ حرارت جذب کر لیتا ہے' },
        { en: 'Gravity pulls the rays downward', ur: 'کششِ ثقل شعاعوں کو نیچے کھینچتی ہے' },
        { en: 'The glass surface is magnetic', ur: 'شیشہ مقناطیسی اثر رکھتا ہے' },
      ],
      answer: 0,
      explain: {
        en: 'Refraction occurs because light travels slower in denser media like optical glass than in air.',
        ur: 'انعطاف اس لیے ہوتا ہے کیونکہ شیشے کی کثافت کی وجہ سے روشنی کی رفتار ہوا کے مقابلے میں کم ہو جاتی ہے۔',
      },
    },
  ],
};

export const SOLAR_SYSTEM_LESSON: Lesson = {
  schemaVersion: 1,
  topic: 'Solar System',
  topicKey: 'solar-system',
  category: 'astronomy',
  title: {
    en: 'The Solar System & Planetary Orbits',
    ur: 'نظامِ شمسی اور سیاروں کی گردش',
  },
  summary: {
    en: 'The Sun and celestial bodies bound in orbital equilibrium around it, governed by gravitational dynamics.',
    ur: 'سورج اور اس کے گرد کششِ ثقل کے توازن میں اپنے اپنے مدار میں چکر کاٹنے والے تمام سیارے اور فلکیاتی اجسام۔',
  },
  camera: {
    position: [0, 2.8, 9.2],
    target: [0, 0, 0],
  },
  parts: [
    {
      id: 'sun',
      name: { en: 'The Sun', ur: 'سورج (The Sun)' },
      shape: 'sphere',
      material: 'emissive',
      color: '#FFE29A',
      position: [0, 0, 0],
      size: 1.35,
      explain: {
        en: 'The central G-type star holding 99.8% of solar system mass, radiating warmth and light powered by hydrogen fusion.',
        ur: 'ہمارے نظام کا مرکزی ستارہ جس کی زبردست کششِ ثقل تمام سیاروں کو ان کے مدار میں باندھے رکھتی ہے۔',
      },
    },
    {
      id: 'mercury',
      name: { en: 'Mercury', ur: 'عطارد (Mercury)' },
      shape: 'sphere',
      material: 'matte',
      color: '#D8D2E8',
      position: [1.25, 0, 0],
      size: 0.24,
      explain: {
        en: 'The closest rocky planet to the Sun, completing a rapid orbit every 88 Earth days with extreme temperature swings.',
        ur: 'سورج کے سب سے قریب اور تیز ترین سیارہ جو صرف 88 زمینی دنوں میں سورج کے گرد چکر مکمل کرتا ہے۔',
      },
    },
    {
      id: 'venus',
      name: { en: 'Venus', ur: 'زہرہ (Venus)' },
      shape: 'sphere',
      material: 'organelle',
      color: '#FBE2B4',
      position: [1.72, 0, 0],
      size: 0.34,
      explain: {
        en: 'Wrapped in dense carbon dioxide clouds causing a runaway greenhouse effect, making Venus the hottest planet.',
        ur: 'گھنے بادلوں میں لپٹا ہوا سیارہ جہاں گرین ہاؤس اثر کی وجہ سے نظامِ شمسی کا سب سے زیادہ درجہ حرارت پایا جاتا ہے۔',
      },
    },
    {
      id: 'earth',
      name: { en: 'Earth', ur: 'زمین (Earth)' },
      shape: 'sphere',
      material: 'organelle',
      color: '#B8DCF5',
      position: [2.28, 0, 0],
      size: 0.38,
      explain: {
        en: 'Our habitable home world featuring liquid water oceans, protective magnetic field, and oxygen-rich atmosphere.',
        ur: 'ہمارا پیارا سیارہ جہاں مائع پانی، مقناطیسی ڈھال اور آکسیجن کی موجودگی زندگی کو برقرار رکھتی ہے۔',
      },
    },
    {
      id: 'mars',
      name: { en: 'Mars', ur: 'مریخ (Mars)' },
      shape: 'sphere',
      material: 'matte',
      color: '#FFC4B2',
      position: [2.82, 0, 0],
      size: 0.3,
      explain: {
        en: 'The Red Planet with iron-rich soil, polar ice caps, ancient river beds, and the largest volcano in the solar system.',
        ur: 'سرخ سیارہ جہاں آئرن آکسائیڈ کی مٹی ہے؛ اس کے قطبین پر برف اور ماضی کے خشک دریا پائے جاتے ہیں۔',
      },
    },
    {
      id: 'asteroid_belt',
      name: { en: 'Asteroid belt', ur: 'سیارچوں کی پٹی (Asteroid belt)' },
      shape: 'sphere',
      material: 'matte',
      color: '#DDD7EE',
      position: [3.38, 0, 0],
      size: 0.14,
      count: 90,
      spread: 1.2,
      explain: {
        en: 'A ring of millions of rocky remnants orbiting between the inner terrestrial planets and outer gas giants.',
        ur: 'مریخ اور مشتری کے درمیان گردش کرنے والے لاکھوں چٹانی ٹکڑوں اور سیارچوں کا ایک وسیع حلقہ۔',
      },
    },
    {
      id: 'jupiter',
      name: { en: 'Jupiter', ur: 'مشتری (Jupiter)' },
      shape: 'sphere',
      material: 'organelle',
      color: '#FFD5BE',
      position: [4.05, 0, 0],
      size: 0.72,
      explain: {
        en: 'The solar system largest gas giant of hydrogen and helium, famous for its colorful swirling cloud bands and Great Red Spot.',
        ur: 'نظامِ شمسی کا سب سے بڑا گیس دیو سیارہ جس پر دیوہیکل طوفانی پٹیاں اور عظیم سرخ دھبہ موجود ہے۔',
      },
    },
    {
      id: 'saturn',
      name: { en: 'Saturn', ur: 'زحل (Saturn)' },
      shape: 'sphere',
      material: 'organelle',
      color: '#FBE9A8',
      position: [4.78, 0, 0],
      size: 0.58,
      explain: {
        en: 'A golden gas giant world with lower density than water, famed for its breathtaking ring system made of reflective ice particles.',
        ur: 'خوبصورت سنہری گیس سیارہ جس کی کثافت پانی سے بھی کم ہے اور اس کے گرد وسیع برفیلی پٹیاں ہیں۔',
      },
    },
    {
      id: 'saturn_rings',
      name: { en: "Saturn's rings", ur: 'زحل کے حلقے (Saturn rings)' },
      shape: 'torus',
      material: 'glass',
      color: '#EDE6FC',
      position: [4.78, 0, 0],
      size: 1.08,
      explain: {
        en: 'Vast concentric planar rings composed of billions of water-ice particles and rocky debris orbiting Saturn equator.',
        ur: 'برف اور چٹانی ذرات کے اربوں روشن ٹکڑوں سے بنے وسیع چھلے جو زحل کے خطِ استوا کے گرد گھومتے ہیں۔',
      },
    },
    {
      id: 'neptune',
      name: { en: 'Neptune', ur: 'نیپچون (Neptune)' },
      shape: 'sphere',
      material: 'organelle',
      color: '#B5CCF8',
      position: [5.32, 0, 0],
      size: 0.44,
      explain: {
        en: 'A deep azure ice giant world swept by supersonic winds, where atmospheric methane absorbs red light.',
        ur: 'گہرے نیلے رنگ کا سرد ترین برفانی سیارہ جہاں میتھین گیس کے بادل اور طوفانی ہوائیں چلتی ہیں۔',
      },
    },
  ],
  controls: [
    {
      id: 'orbital_speed',
      label: { en: 'Orbital Speed', ur: 'مداری رفتار (Orbital speed)' },
      min: 10,
      max: 200,
      default: 100,
      unit: '%',
      effect: 'speed',
      affects: [
        'mercury',
        'venus',
        'earth',
        'mars',
        'jupiter',
        'saturn',
        'neptune',
      ],
    },
  ],
  quiz: [
    {
      q: {
        en: 'Which planet is the largest in our solar system?',
        ur: 'نظامِ شمسی کا سب سے بڑا سیارہ کون سا ہے؟',
      },
      options: [
        { en: 'Jupiter', ur: 'مشتری (Jupiter)' },
        { en: 'Saturn', ur: 'زحل (Saturn)' },
        { en: 'Earth', ur: 'زمین (Earth)' },
        { en: 'Neptune', ur: 'نیپچون (Neptune)' },
      ],
      answer: 0,
      explain: {
        en: 'Jupiter is more massive than all other planets in the solar system combined.',
        ur: 'مشتری تمام دوسرے سیاروں کے مجموعی وزن سے بھی زیادہ بھاری اور بڑا ہے۔',
      },
    },
    {
      q: {
        en: 'Why is Venus hotter than Mercury despite being farther from the Sun?',
        ur: 'زہرہ (Venus) عطارد کے مقابلے میں سورج سے دور ہونے کے باوجود زیادہ گرم کیوں ہے؟',
      },
      options: [
        { en: 'Dense carbon dioxide atmosphere causes runaway greenhouse effect', ur: 'گھنی کاربن ڈائی آکسائیڈ فضا شدید گرین ہاؤس اثر پیدا کرتی ہے' },
        { en: 'It has volcanic lava oceans covering the entire surface', ur: 'اس پر لاوے کے ابلتے سمندر موجود ہیں' },
        { en: 'It rotates twice as fast as Earth', ur: 'یہ زمین سے دوگنی رفتار سے گھومتا ہے' },
        { en: 'Its magnetic core is atomic', ur: 'اس کا اندرونی حصہ ایٹمی حرارت خارج کرتا ہے' },
      ],
      answer: 0,
      explain: {
        en: 'Dense carbon dioxide clouds trap solar heat, heating Venus to over 460 °C.',
        ur: 'کاربن ڈائی آکسائیڈ کی موٹی چادر سورج کی گرمی کو قید کر لیتی ہے جس سے درجہ حرارت 460 سینٹی گریڈ تک پہنچ جاتا ہے۔',
      },
    },
    {
      q: {
        en: 'What celestial region separates the rocky inner planets from the gas giants?',
        ur: 'اندرونی چٹانی سیاروں اور بیرونی گیس دیو سیاروں کے درمیان کیا واقع ہے؟',
      },
      options: [
        { en: 'The Asteroid belt', ur: 'سیارچوں کی پٹی (Asteroid belt)' },
        { en: 'Kuiper belt', ur: 'کائپر بیلٹ' },
        { en: 'Oort cloud', ur: 'اوؤرٹ کلاؤڈ' },
        { en: 'Van Allen belt', ur: 'وین ایلن بیلٹ' },
      ],
      answer: 0,
      explain: {
        en: 'The asteroid belt orbits between Mars and Jupiter, separating inner and outer worlds.',
        ur: 'سیارچوں کی پٹی مریخ اور مشتری کے درمیان مدار میں واقع ہے۔',
      },
    },
    {
      q: {
        en: 'What are Saturn spectacular rings primarily made of?',
        ur: 'زحل کے دلکش حلقے بنیادی طور پر کس چیز سے بنے ہیں؟',
      },
      options: [
        { en: 'Water ice particles and rocky dust', ur: 'پانی کی برف کے ٹکڑے اور چٹانی ذرات' },
        { en: 'Molten gold crystals', ur: 'پگھلے ہوئے سنہری کرسٹلز' },
        { en: 'Solid diamond sheets', ur: 'ٹھوس ہیرے کی چادریں' },
        { en: 'Glowing neon gases', ur: 'چمکیلی نیون گیسز' },
      ],
      answer: 0,
      explain: {
        en: 'Saturn rings consist of billions of reflective chunks of water ice and cosmic dust.',
        ur: 'زحل کے حلقے اربوں چمکدار برفیلی ٹکڑوں اور گرد پر مشتمل ہیں۔',
      },
    },
  ],
};

const HERO_KEY_MAP: Record<string, Lesson> = {
  'human-cell': HUMAN_CELL_LESSON,
  'light-prism': LIGHT_PRISM_LESSON,
  'solar-system': SOLAR_SYSTEM_LESSON,
};

const ALIASES: Record<string, string> = {
  // Cell aliases
  cell: 'human-cell',
  'human cell': 'human-cell',
  'animal cell': 'human-cell',
  'cell structure': 'human-cell',
  'structure of a cell': 'human-cell',
  'structure of cell': 'human-cell',
  'eukaryotic cell': 'human-cell',
  'biology cell': 'human-cell',
  'cell organelles': 'human-cell',
  'human-cell': 'human-cell',

  // Prism aliases
  prism: 'light-prism',
  'light prism': 'light-prism',
  'dispersion of light': 'light-prism',
  'light dispersion': 'light-prism',
  'refraction through prism': 'light-prism',
  'glass prism': 'light-prism',
  'optical prism': 'light-prism',
  dispersion: 'light-prism',
  'light-prism': 'light-prism',

  // Solar system aliases
  'solar system': 'solar-system',
  'the solar system': 'solar-system',
  planets: 'solar-system',
  'planetary system': 'solar-system',
  'planets of solar system': 'solar-system',
  'sun and planets': 'solar-system',
  'solar-system': 'solar-system',
};

export function getHeroLessonIfMatch(rawTopic: string): Lesson | null {
  const normalized = rawTopic
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');

  const heroKey = ALIASES[normalized];
  if (!heroKey) return null;
  return HERO_KEY_MAP[heroKey] ?? null;
}

