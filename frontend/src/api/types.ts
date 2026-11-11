export type Lang = "en" | "ur";

export interface BilingualText {
  en: string;
  ur: string;
}

export type Category =
  | "biology"
  | "physics"
  | "chemistry"
  | "earth_science"
  | "astronomy"
  | "math"
  | "geography"
  | "other";

export type PartShape = "sphere" | "capsule" | "disc" | "tube" | "torus" | "box";

export type PartMaterial =
  | "membrane"
  | "organelle"
  | "glass"
  | "matte"
  | "metal"
  | "liquid"
  | "emissive";

export type MotionType =
  | "none"
  | "drift"
  | "pulse"
  | "spin"
  | "orbit"
  | "flow"
  | "swing"
  | "bob";

export type ControlEffect =
  | "scale"
  | "speed"
  | "glow"
  | "spread"
  | "amplitude"
  | "opacity";

export interface MotionSpec {
  type: MotionType;
  speed?: number;
  amplitude?: number;
  pivot?: [number, number, number];
}

export interface CameraHint {
  position: [number, number, number];
  target: [number, number, number];
}

export interface Part {
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
  motion?: MotionSpec | null;
  explain: BilingualText;
}

export interface Control {
  id: string;
  label: BilingualText;
  min: number;
  max: number;
  default: number;
  step?: number | null;
  unit?: string | null;
  effect: ControlEffect;
  affects: string[];
}

export interface Question {
  q: BilingualText;
  options: BilingualText[];
  answer: number;
  explain: BilingualText;
}

export interface Lesson {
  schemaVersion: number;
  topic: string;
  topicKey: string;
  category: Category;
  title: BilingualText;
  summary: BilingualText;
  camera?: CameraHint | null;
  parts: Part[];
  controls: Control[];
  quiz: Question[];
}

export interface LessonMeta {
  cached: boolean;
  model: string;
  generatedAt: string;
  source: "text" | "image";
  requestId: string;
}

export interface LessonResponse {
  lesson: Lesson;
  meta: LessonMeta;
}

export interface RecentLessonItem {
  topic: string;
  topicKey: string;
  category: Category | string;
  title: BilingualText;
  createdAt: string;
}

export interface RecentLessonsResponse {
  lessons: RecentLessonItem[];
}

export interface ResultPayload {
  topicKey: string;
  topic: string;
  score: number;
  total: number;
  nickname?: string;
}

export interface TopicStatItem {
  topicKey: string;
  topic: string;
  attempts: number;
  totalScore: number;
  totalPossible: number;
  avgPercent: number;
  updatedAt: string;
}

export interface StatsResponse {
  topics: TopicStatItem[];
  generatedAt: string;
}

export interface HealthResponse {
  status: "ok";
  version: string;
  schemaVersion: number;
  gemini: "configured" | "missing";
  firestore: "ok" | "error";
  external: "configured" | "not_configured";
}

export type ErrorCode =
  | "BAD_REQUEST"
  | "IMAGE_TOO_LARGE"
  | "UNSUPPORTED_IMAGE"
  | "TOPIC_NOT_EDUCATIONAL"
  | "TOPIC_NOT_RECOGNIZED"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "UPSTREAM_RATE_LIMITED"
  | "UPSTREAM_FAILED"
  | "CONFIG_MISSING"
  | "EXTERNAL_NOT_CONFIGURED"
  | "EXTERNAL_FAILED"
  | "NOT_FOUND"
  | "INTERNAL"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "ABORTED";
