import type {
  ApiErrorCode,
  ApiErrorEnvelope,
  HealthResponse,
  ImageMimeType,
  LessonResponse,
  LessonsListResponse,
  ResultPayload,
  StatsResponse,
} from './types';

const RAW_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000';

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    status = 0,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, timeoutMs = 15_000, signal } = options;

  const controller = new AbortController();
  let timedOut = false;

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      window.clearTimeout(timer);
      throw new ApiError('ABORTED', 'Request cancelled.', 0);
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let parsed: ApiErrorEnvelope | null = null;
      try {
        parsed = (await response.json()) as ApiErrorEnvelope;
      } catch {
        parsed = null;
      }

      if (parsed?.error?.code) {
        throw new ApiError(
          parsed.error.code,
          parsed.error.message || 'Request failed.',
          response.status,
          parsed.error.retryAfterSeconds,
        );
      }

      if (response.status === 429) {
        throw new ApiError('RATE_LIMITED', 'Rate limited.', 429);
      }
      if (response.status === 503) {
        throw new ApiError('CONFIG_MISSING', 'Service unavailable.', 503);
      }
      throw new ApiError('UPSTREAM_FAILED', 'Server returned an error.', response.status);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (timedOut) {
        throw new ApiError('UPSTREAM_FAILED', 'Request timed out.', 504);
      }
      throw new ApiError('ABORTED', 'Request aborted.', 0);
    }
    throw new ApiError(
      'NETWORK_ERROR',
      "Can't reach the server. Check your connection and try again.",
      0,
    );
  } finally {
    window.clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health', { timeoutMs: 15_000, signal });
}

export function listLessons(
  limit = 10,
  signal?: AbortSignal,
): Promise<LessonsListResponse> {
  return request<LessonsListResponse>(`/api/lessons?limit=${limit}`, {
    timeoutMs: 15_000,
    signal,
  });
}

export function createLessonFromTopic(
  topic: string,
  signal?: AbortSignal,
): Promise<LessonResponse> {
  return request<LessonResponse>('/api/lesson', {
    method: 'POST',
    body: { topic: topic.trim() },
    timeoutMs: 70_000,
    signal,
  });
}

export function createLessonFromImage(
  imageBase64: string,
  mimeType: ImageMimeType,
  signal?: AbortSignal,
): Promise<LessonResponse> {
  return request<LessonResponse>('/api/lesson', {
    method: 'POST',
    body: { imageBase64, mimeType },
    timeoutMs: 70_000,
    signal,
  });
}

export function postResult(
  payload: ResultPayload,
  signal?: AbortSignal,
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/result', {
    method: 'POST',
    body: payload,
    timeoutMs: 15_000,
    signal,
  });
}

export function getStats(signal?: AbortSignal): Promise<StatsResponse> {
  return request<StatsResponse>('/api/stats', { timeoutMs: 15_000, signal });
}

