import math
import time
from collections import deque

from fastapi import Request

from app.core.errors import AppError


def extract_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


class SlidingWindowRateLimiter:
    """In-memory per-IP sliding window rate limiter."""

    def __init__(self, window_seconds: float = 60.0) -> None:
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._ops_since_prune = 0

    def check(self, key: str, max_requests: int) -> None:
        if max_requests <= 0:
            raise AppError(
                code="RATE_LIMITED",
                message="Rate limit exceeded. Please try again shortly.",
                status=429,
                retry_after=int(self.window_seconds),
            )

        now = time.monotonic()
        cutoff = now - self.window_seconds

        bucket = self._hits.get(key)
        if bucket is None:
            bucket = deque()
            self._hits[key] = bucket

        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= max_requests:
            retry_after = max(1, math.ceil(self.window_seconds - (now - bucket[0])))
            raise AppError(
                code="RATE_LIMITED",
                message="Too many requests right now. Please wait a few seconds and try again.",
                status=429,
                retry_after=retry_after,
            )

        bucket.append(now)
        self._ops_since_prune += 1
        if self._ops_since_prune >= 256:
            self._prune(cutoff)
            self._ops_since_prune = 0

    def reset(self) -> None:
        self._hits.clear()
        self._ops_since_prune = 0

    def _prune(self, cutoff: float) -> None:
        empty_keys = [
            k for k, dq in self._hits.items() if not dq or dq[-1] <= cutoff
        ]
        for k in empty_keys:
            self._hits.pop(k, None)


lesson_rate_limiter = SlidingWindowRateLimiter(window_seconds=60.0)
result_rate_limiter = SlidingWindowRateLimiter(window_seconds=60.0)
