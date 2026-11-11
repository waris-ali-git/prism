import type {
  ApiErrorCode,
  HealthResponse,
  ImageMimeType,
  Language,
  Lesson,
  LessonMeta,
  LessonSummaryItem,
  TextScale,
} from '../api/types';
import { loadPrefs, savePrefs } from './prefs';
import { readCurrentRoute, type AppRoute } from './router';

export type ExplorerState = 'idle' | 'loading' | 'ready' | 'error';
export type SheetSnap = 'peek' | 'half' | 'full';
export type PanelTab = 'explore' | 'quiz';

export interface PhotoDraft {
  previewUrl: string;
  imageBase64: string;
  mimeType: ImageMimeType;
  fileName: string;
}

export interface LastSubmission {
  kind: 'topic' | 'image';
  topic?: string;
  imageBase64?: string;
  mimeType?: ImageMimeType;
}

export interface AppState {
  route: AppRoute;
  explorerState: ExplorerState;
  lang: Language;
  textScale: TextScale;
  nickname: string;
  topicInput: string;
  slowLoading: boolean;
  errorCode: ApiErrorCode | null;
  retryAfterSeconds: number | null;
  lastSubmission: LastSubmission | null;
  lesson: Lesson | null;
  lessonMeta: LessonMeta | null;
  selectedPartId: string | null;
  panelTab: PanelTab;
  sheetSnap: SheetSnap;
  insideCell: boolean;
  controlValues: Record<string, number>;
  recentLessons: LessonSummaryItem[];
  health: HealthResponse | null;
  photoModalOpen: boolean;
  photoDraft: PhotoDraft | null;
  liveAnnouncement: string;
}

type Listener = (state: AppState, prev: AppState) => void;

const initialPrefs = loadPrefs();

const initialState: AppState = {
  route: readCurrentRoute(),
  explorerState: 'idle',
  lang: initialPrefs.lang,
  textScale: initialPrefs.textScale,
  nickname: initialPrefs.nickname,
  topicInput: '',
  slowLoading: false,
  errorCode: null,
  retryAfterSeconds: null,
  lastSubmission: null,
  lesson: null,
  lessonMeta: null,
  selectedPartId: null,
  panelTab: 'explore',
  sheetSnap: 'peek',
  insideCell: false,
  controlValues: {},
  recentLessons: [],
  health: null,
  photoModalOpen: false,
  photoDraft: null,
  liveAnnouncement: '',
};

class Store {
  private state: AppState = initialState;
  private listeners = new Set<Listener>();

  getState(): AppState {
    return this.state;
  }

  setState(patch: Partial<AppState>): void {
    const prev = this.state;
    const next: AppState = { ...prev, ...patch };
    this.state = next;

    if (
      next.lang !== prev.lang ||
      next.textScale !== prev.textScale ||
      next.nickname !== prev.nickname
    ) {
      savePrefs({
        lang: next.lang,
        textScale: next.textScale,
        nickname: next.nickname,
      });
    }

    for (const listener of this.listeners) {
      listener(next, prev);
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const store = new Store();

