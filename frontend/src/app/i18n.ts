import type { ApiErrorCode, BilingualText, Language } from '../api/types';
import { APP_NAME } from './constants';

export function t(text: BilingualText, lang: Language): string {
  return lang === 'ur' ? text.ur : text.en;
}

export const COPY = {
  navExplore: {
    en: 'Explore',
    ur: 'ایکسپلور کریں',
  },
  navTeacher: {
    en: 'Teacher view',
    ur: 'اساتذہ کا صفحہ',
  },
  textSizeLabel: {
    en: 'Text size',
    ur: 'تحریر کا سائز',
  },
  heroHeading: {
    en: 'Turn every textbook into a crystal world you can explore.',
    ur: 'اپنی درسی کتاب کے ہر سبق کو تھری ڈی دنیا میں دیکھیں اور سمجھیں۔',
  },
  heroSubtitle: {
    en: 'Type any school topic or photograph a textbook page to step inside a calm, interactive 3D lesson in English and Urdu.',
    ur: 'کوئی بھی اسکول کا عنوان لکھیں یا کتاب کے صفحے کی تصویر لیں اور اردو و انگریزی میں دلکش تھری ڈی ماڈل کے ذریعے سیکھیں۔',
  },
  topicPlaceholder: {
    en: 'What do you want to explore?',
    ur: 'آپ کیا سیکھنا اور دیکھنا چاہتے ہیں؟',
  },
  submitButton: {
    en: 'Explore',
    ur: 'ایکسپلور',
  },
  scanPageButton: {
    en: 'Scan textbook page',
    ur: 'کتاب کا صفحہ اسکین کریں',
  },
  recentlyExplored: {
    en: 'Recently explored',
    ur: 'حال ہی میں دیکھے گئے اسباق',
  },
  scrollCue: {
    en: 'Scroll to see how it works',
    ur: 'نیچے اسکرول کر کے طریقہ کار دیکھیں',
  },

  /* Editorial Scroll Story Chapters (pure product explanation — zero dummy lessons) */
  storyIntroHeading: {
    en: 'Designed like a quiet science museum, built for everyday classrooms.',
    ur: 'ایک پرسکون سائنس میوزیم جیسا معیار، ہر طالب علم اور کمرۂ جماعت کے لیے۔',
  },
  storyStep1Title: {
    en: 'From a flat textbook page to living depth',
    ur: 'سادہ کتابی صفحے سے جیتے جاگتے تھری ڈی منظر تک',
  },
  storyStep1Body: {
    en: 'Students often memorize flat diagrams without feeling how parts fit together in space. Type a topic from science, maths or geography, or snap a single page from your book.',
    ur: 'اکثر طلبہ کتاب کی چپٹی تصویروں کو صرف رٹ لیتے ہیں۔ یہاں آپ سائنس، ریاضی یا جغرافیہ کا کوئی بھی عنوان لکھ کر یا صفحے کی تصویر لے کر ہر حصے کی ساخت کو گہرائی سے سمجھ سکتے ہیں۔',
  },
  storyStep2Title: {
    en: 'Touch, rotate, and slide real parameters',
    ur: 'ماڈل کو گھمائیں، حصوں کو چھوئیں اور تبدیلی خود دیکھیں',
  },
  storyStep2Body: {
    en: 'Move gentle sliders to see how energy, dispersion, speed or scale transforms a concept right before your eyes. Try sliding the crystal refraction beam here.',
    ur: 'سلائیڈرز کی مدد سے توانائی، رفتار یا روشنی کے پھیلاؤ میں کمی بیشی کریں اور اس کا اثر فوری طور پر ماڈل پر دیکھیں۔ ساتھ دیے گئے کرسٹل سلائیڈر کو ہلا کر آزمائیں۔',
  },
  prismDemoSliderLabel: {
    en: 'Crystal dispersion angle',
    ur: 'کرسٹل سے روشنی کا پھیلاؤ',
  },
  storyStep3Title: {
    en: 'Clear explanations in English and natural Urdu',
    ur: 'آسان انگریزی اور فطری درسی اردو میں وضاحت',
  },
  storyStep3Body: {
    en: 'Switch seamlessly between English and Nastaliq Urdu at any moment, even in the middle of a quiz. Quiz scores help teachers see which topics need extra care in class.',
    ur: 'کسی بھی لمحے انگریزی اور نستعلیق اردو کے درمیان تبدیلی کریں، چاہے آپ کوئز ہی کیوں نہ حل کر رہے ہوں۔ کوئز کے نتائج سے اساتذہ جان سکتے ہیں کہ کن اسباق پر مزید توجہ کی ضرورت ہے۔',
  },
  storyBottomCtaTitle: {
    en: 'Ready to step inside your first topic?',
    ur: 'اپنا پہلا سبق تھری ڈی میں دیکھنے کے لیے تیار ہیں؟',
  },
  storyBottomCtaButton: {
    en: 'Start exploring',
    ur: 'ابھی آغاز کریں',
  },
  storyTeacherCtaButton: {
    en: 'Open teacher view',
    ur: 'اساتذہ کا ڈیش بورڈ دیکھیں',
  },

  /* Loading & Cold-Start Copy — Section 9.6 & F11 */
  loadingMain: {
    en: 'Building your lesson…',
    ur: 'آپ کا سبق تیار کیا جا رہا ہے…',
  },
  loadingSlowStart: {
    en: 'Waking up the server. The first lesson can take up to a minute.',
    ur: 'سرور بیدار ہو رہا ہے۔ پہلا سبق تیار ہونے میں ایک منٹ تک لگ سکتا ہے۔',
  },
  cancelButton: {
    en: 'Cancel',
    ur: 'منسوخ کریں',
  },

  /* Photo Capture & Preview — F11 & Section 11 */
  photoSheetTitle: {
    en: 'Scan a textbook page',
    ur: 'درسی کتاب کے صفحے کی تصویر لیں',
  },
  photoHint: {
    en: 'Photograph only the textbook page. Photos are processed in memory and never stored.',
    ur: 'صرف کتاب کے صفحے کی تصویر لیں۔ تصاویر محفوظ نہیں کی جاتیں اور صرف سبق پہچاننے کے لیے استعمال ہوتی ہیں۔',
  },
  photoChooseFile: {
    en: 'Choose or take a photo',
    ur: 'تصویر منتخب کریں یا کیمرہ کھولیں',
  },
  photoUseThis: {
    en: 'Use this photo',
    ur: 'یہ تصویر استعمال کریں',
  },
  photoRetake: {
    en: 'Retake',
    ur: 'دوبارہ لیں',
  },

  /* Explorer Ready Workspace — F5, F6, F7, F8, F9 */
  newTopicButton: {
    en: 'New topic',
    ur: 'نیا عنوان',
  },
  resetView: {
    en: 'Reset view',
    ur: 'منظر واپس لائیں',
  },
  goInside: {
    en: 'Go inside',
    ur: 'اندر جائیں',
  },
  backOutside: {
    en: 'Back outside',
    ur: 'باہر آئیں',
  },
  tabExplore: {
    en: 'Lesson',
    ur: 'وضاحت',
  },
  tabQuiz: {
    en: 'Quiz',
    ur: 'کوئز',
  },
  partsHeading: {
    en: 'Parts in this model',
    ur: 'اس ماڈل کے حصے',
  },
  allOverview: {
    en: 'Overview',
    ur: 'مجموعی جائزہ',
  },
  controlsHeading: {
    en: 'Interactive controls',
    ur: 'انٹرایکٹو سلائیڈرز',
  },
  selectPartPrompt: {
    en: 'Tap any 3D part or pick one below to focus and read how it works.',
    ur: 'تھری ڈی ماڈل کے کسی بھی حصے کو چھوئیں یا نیچے فہرست سے منتخب کریں۔',
  },

  /* Quiz — F9 */
  quizQuestionProgress: {
    en: 'Question',
    ur: 'سوال',
  },
  quizNext: {
    en: 'Next question',
    ur: 'اگلا سوال',
  },
  quizFinish: {
    en: 'See score',
    ur: 'نتیجہ دیکھیں',
  },
  quizRetry: {
    en: 'Try quiz again',
    ur: 'کوئز دوبارہ حل کریں',
  },
  quizNicknameLabel: {
    en: 'Optional nickname',
    ur: 'فرضی نام (اختیاری)',
  },
  quizPrivacyNote: {
    en: 'Only a nickname and your score are saved.',
    ur: 'صرف فرضی نام اور آپ کا اسکور محفوظ کیا جاتا ہے۔',
  },
  quizSaveScore: {
    en: 'Save score for teacher view',
    ur: 'نتیجہ محفوظ کریں',
  },
  quizSaved: {
    en: 'Score saved to teacher view.',
    ur: 'آپ کا نتیجہ محفوظ ہو گیا ہے۔',
  },
  quizSaveFailed: {
    en: "Couldn't save your score right now. You can retry calmly.",
    ur: 'اس وقت نتیجہ محفوظ نہیں ہو سکا۔ آپ دوبارہ کوشش کر سکتے ہیں۔',
  },
  quizMissedHeading: {
    en: 'Review the ones you missed',
    ur: 'جن سوالات میں غلطی ہوئی ان کی وضاحت',
  },
  quizPerfect: {
    en: 'You answered every question accurately.',
    ur: 'شاندار! آپ نے تمام سوالات کے درست جواب دیے۔',
  },

  /* Error Screen — Section 9.6 */
  tryAgain: {
    en: 'Try again',
    ur: 'دوبارہ کوشش کریں',
  },
  backToExplore: {
    en: 'Back to explorer',
    ur: 'واپس ایکسپلورر پر جائیں',
  },

  /* Teacher Dashboard — F10 & Section 9.6 */
  dashboardTitle: {
    en: 'Teacher insights',
    ur: 'اساتذہ کے لیے جائزہ ڈیش بورڈ',
  },
  dashboardSubtitle: {
    en: 'Topics are ordered weakest first so you can spot where students need guidance before class.',
    ur: 'جن موضوعات میں طلبہ کو سب سے زیادہ مشکل پیش آ رہی ہے وہ سب سے اوپر دکھائے گئے ہیں تاکہ آپ کلاس سے پہلے ان کا جائزہ لے سکیں۔',
  },
  dashboardRefresh: {
    en: 'Refresh',
    ur: 'تازہ کریں',
  },
  dashboardAutoRefresh: {
    en: 'Live refresh (15s)',
    ur: 'خودکار تازہ کاری (15 سیکنڈ)',
  },
  dashboardEmpty: {
    en: 'No quiz results yet. When students finish a quiz, the hardest topics appear here.',
    ur: 'ابھی تک کسی کوئز کا نتیجہ موجود نہیں۔ جب طلبہ کوئز مکمل کریں گے تو مشکل ترین موضوعات یہاں نظر آئیں گے۔',
  },
  dashboardAttempts: {
    en: 'attempts',
    ur: 'کوششیں',
  },
  dashboardOpenLesson: {
    en: 'Review lesson',
    ur: 'سبق دیکھیں',
  },

  /* Responsible AI Footer — Section 9.6 & 11 */
  aiFooter: {
    en: 'Explanations are AI-generated and diagrams are simplified, not to scale. Teachers can review a lesson before using it in class.',
    ur: 'یہ وضاحتیں مصنوعی ذہانت (AI) سے تیار کردہ ہیں اور ماڈلز سمجھانے کے لیے سادہ بنائے گئے ہیں (اصل پیمائش کے مطابق نہیں)۔ اساتذہ کلاس میں استعمال سے پہلے سبق کا جائزہ لے سکتے ہیں۔',
  },
} as const;

export function getErrorCopy(code: ApiErrorCode, lang: Language): string {
  const table: Record<ApiErrorCode, BilingualText> = {
    TOPIC_NOT_EDUCATIONAL: {
      en: `${APP_NAME} only builds school topics. Try something from science, geography or maths.`,
      ur: `${APP_NAME} صرف اسکول کے تعلیمی موضوعات بناتا ہے۔ سائنس، جغرافیہ یا ریاضی کا کوئی عنوان لکھیں۔`,
    },
    TOPIC_NOT_RECOGNIZED: {
      en: "We couldn't find a topic on that page. Try a clearer photo of one textbook page.",
      ur: 'اس صفحے پر کوئی واضح تعلیمی عنوان نہیں مل سکا۔ کتاب کے ایک صفحے کی صاف تصویر دوبارہ لیں۔',
    },
    IMAGE_TOO_LARGE: {
      en: "That photo can't be used. Choose a JPEG, PNG or WebP image.",
      ur: 'یہ تصویر استعمال نہیں ہو سکتی۔ براہ کرم JPEG، PNG یا WebP تصویر منتخب کریں۔',
    },
    UNSUPPORTED_IMAGE: {
      en: "That photo can't be used. Choose a JPEG, PNG or WebP image.",
      ur: 'یہ تصویر استعمال نہیں ہو سکتی۔ براہ کرم JPEG، PNG یا WebP تصویر منتخب کریں۔',
    },
    RATE_LIMITED: {
      en: 'Lots of lessons are being built right now. Try again in a few seconds.',
      ur: 'اس وقت بہت سے اسباق تیار ہو رہے ہیں۔ چند سیکنڈ بعد دوبارہ کوشش کریں۔',
    },
    UPSTREAM_RATE_LIMITED: {
      en: 'Lots of lessons are being built right now. Try again in a few seconds.',
      ur: 'اس وقت بہت سے اسباق تیار ہو رہے ہیں۔ چند سیکنڈ بعد دوبارہ کوشش کریں۔',
    },
    VALIDATION_FAILED: {
      en: "We couldn't build that lesson this time. Try again, or try a slightly different topic.",
      ur: 'اس بار یہ سبق تیار نہیں ہو سکا۔ دوبارہ کوشش کریں یا ملتا جلتا عنوان لکھیں۔',
    },
    UPSTREAM_FAILED: {
      en: "We couldn't build that lesson this time. Try again, or try a slightly different topic.",
      ur: 'اس بار یہ سبق تیار نہیں ہو سکا۔ دوبارہ کوشش کریں یا ملتا جلتا عنوان لکھیں۔',
    },
    CONFIG_MISSING: {
      en: 'The lesson service is still being configured on the server. Check the backend environment keys and try again.',
      ur: 'سرور پر ابھی سیٹنگز مکمل نہیں ہوئیں۔ بیک اینڈ کیز چیک کر کے دوبارہ کوشش کریں۔',
    },
    EXTERNAL_NOT_CONFIGURED: {
      en: 'That extra service is not configured yet.',
      ur: 'یہ اضافی سہولت ابھی ترتیب نہیں دی گئی۔',
    },
    EXTERNAL_FAILED: {
      en: 'The external service did not respond. Please try again shortly.',
      ur: 'بیرونی سروس سے رابطہ نہیں ہو سکا۔ تھوڑی دیر بعد کوشش کریں۔',
    },
    BAD_REQUEST: {
      en: 'Please enter a school topic between 2 and 120 characters, or choose a clear textbook photo.',
      ur: 'براہ کرم 2 سے 120 حروف کے درمیان کوئی تعلیمی عنوان لکھیں یا کتاب کی صاف تصویر منتخب کریں۔',
    },
    NOT_FOUND: {
      en: "We couldn't find that lesson anymore. Generate it once more first.",
      ur: 'یہ سبق ریکارڈ میں نہیں ملا۔ پہلے اسے دوبارہ تیار کریں۔',
    },
    INTERNAL: {
      en: "We couldn't build that lesson this time. Try again, or try a slightly different topic.",
      ur: 'اس بار یہ سبق تیار نہیں ہو سکا۔ دوبارہ کوشش کریں یا تھوڑا مختلف عنوان لکھیں۔',
    },
    NETWORK_ERROR: {
      en: "Can't reach the server. Check your connection and try again.",
      ur: 'سرور سے رابطہ نہیں ہو پا رہا۔ اپنا انٹرنیٹ یا بیک اینڈ سرور چیک کریں اور دوبارہ کوشش کریں۔',
    },
    ABORTED: {
      en: 'Lesson generation was cancelled.',
      ur: 'سبق کی تیاری منسوخ کر دی گئی۔',
    },
  };

  return t(table[code] ?? table.INTERNAL, lang);
}

