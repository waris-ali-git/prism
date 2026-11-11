export type Language = 'en' | 'ur';

export type TextScale = 1 | 2 | 3;

export interface BilingualText {
  en: string;
  ur: string;
}

export type LessonCategory =
  | 'biology'
  | 'physics'
  | 'chemistry'
  | 'earth_science'
  | 'astronomy'
  | 'math'
  | 'geography'
  | 'other';

export type PartShape = 'sphere' | 'capsule' | 'disc' | 'tube' | 'torus' | 'box';

export type PartMaterial =
  | 'membrane'
  | 'organelle'
  | 'glass'
  | 'matte'
  | 'metal'
  | 'liquid'
  | 'emissive';

export type MotionType =
  | 'none'
  | 'drift'
  | 'pulse'
  | 'spin'
  | 'orbit'
  | 'flow'
  | 'swing'
  | 'bob';

export interface PartMotion {
  type: MotionType;
  speed?: number;
  amplitude?: number;
  pivot?: [number, number, number];
}

export interface LessonPart {
  id: string;
  name: BilingualText;
  shape: PartShape;
  material: PartMaterial;
  color: string;
  position: [number, number, number];
  size: number;
  stretch?: [number, number, number];
  rotation?: [number, number, number];
  organic?: number;
  path?: [number, number, number][];
  count?: number;
  spread?: number;
  motion?: PartMotion;
  explain: BilingualText;
}

export type ControlEffect =
  | 'scale'
  | 'speed'
  | 'glow'
  | 'spread'
  | 'amplitude'
  | 'opacity';

export interface LessonControl {
  id: string;
  label: BilingualText;
  min: number;
  max: number;
  default: number;
  step?: number;
  unit?: string;
  effect: ControlEffect;
  affects: string[];
}

export interface QuizQuestion {
  q: BilingualText;
  options: [BilingualText, BilingualText, BilingualText, BilingualText] | BilingualText[];
  answer: number;
  explain: BilingualText;
}

export interface CameraHint {
  position: [number, number, number];
  target: [number, number, number];
}

export interface Lesson {
  schemaVersion: number;
  topic: string;
  topicKey: string;
  category: LessonCategory;
  title: BilingualText;
  summary: BilingualText;
  camera?: CameraHint;
  parts: LessonPart[];
  controls: LessonControl[];
  quiz: QuizQuestion[];
}

export interface LessonMeta {
  cached: boolean;
  model: string;
  generatedAt: string;
  source: 'text' | 'image';
  requestId: string;
}

export interface LessonResponse {
  lesson: Lesson;
  meta: LessonMeta;
}

export interface LessonSummaryItem {
  topic: string;
  topicKey: string;
  category: LessonCategory;
  title: BilingualText;
  createdAt: string;
}

export interface LessonsListResponse {
  lessons: LessonSummaryItem[];
}

export interface HealthResponse {
  status: 'ok';
  version: string;
  schemaVersion: number;
  gemini: 'configured' | 'missing';
  firestore: 'ok' | 'error';
  external: 'configured' | 'not_configured';
}

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ResultPayload {
  topicKey: string;
  topic: string;
  score: number;
  total: number;
  nickname?: string;
}

export interface TopicStat {
  topicKey: string;
  topic: string;
  attempts: number;
  totalScore: number;
  totalPossible: number;
  avgPercent: number;
  updatedAt: string;
}

export interface StatsResponse {
  topics: TopicStat[];
  generatedAt: string;
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'IMAGE_TOO_LARGE'
  | 'UNSUPPORTED_IMAGE'
  | 'TOPIC_NOT_EDUCATIONAL'
  | 'TOPIC_NOT_RECOGNIZED'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_RATE_LIMITED'
  | 'UPSTREAM_FAILED'
  | 'CONFIG_MISSING'
  | 'EXTERNAL_NOT_CONFIGURED'
  | 'EXTERNAL_FAILED'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | 'NETWORK_ERROR'
  | 'ABORTED';

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    retryAfterSeconds?: number;
  };
}

