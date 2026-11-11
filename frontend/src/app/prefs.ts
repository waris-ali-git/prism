import type { Language, TextScale } from '../api/types';

const PREFS_KEY = 'prism_prefs_v1';

export interface UserPrefs {
  lang: Language;
  textScale: TextScale;
  nickname: string;
}

const DEFAULT_PREFS: UserPrefs = {
  lang: 'en',
  textScale: 1,
  nickname: '',
};

export function loadPrefs(): UserPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    const lang: Language = parsed.lang === 'ur' ? 'ur' : 'en';
    const textScale: TextScale =
      parsed.textScale === 2 || parsed.textScale === 3 ? parsed.textScale : 1;
    const nickname =
      typeof parsed.nickname === 'string'
        ? parsed.nickname.trim().slice(0, 24)
        : '';
    return { lang, textScale, nickname };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: UserPrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota or private mode failures
  }
}

