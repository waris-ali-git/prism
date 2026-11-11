import json
import logging
import re
import sys
import time
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

from starlette.types import ASGIApp, Message, Receive, Scope, Send

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

_SAFE_REQ_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def get_request_id() -> str:
    return request_id_ctx.get()


class StructuredJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "requestId": getattr(record, "requestId", get_request_id()),
            "message": record.getMessage(),
        }
        for key in ("method", "route", "status", "latencyMs"):
            val = getattr(record, key, None)
            if val is not None:
                payload[key] = val
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level_name: str = "INFO") -> None:
    level = getattr(logging, level_name.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJsonFormatter())

    root = logging.getLogger("prism")
    root.handlers.clear()
    root.setLevel(level)
    root.propagate = False
    root.addHandler(handler)


def get_logger(name: str = "prism") -> logging.Logger:
    return logging.getLogger(name)


def _extract_or_generate_request_id(headers: list[tuple[bytes, bytes]]) -> str:
    for raw_key, raw_val in headers:
        if raw_key.lower() == b"x-request-id":
            candidate = raw_val.decode("latin-1", errors="ignore").strip()
            if _SAFE_REQ_ID_RE.match(candidate):
                return candidate
            break
    return uuid.uuid4().hex[:16]


class RequestContextMiddleware:
    """Pure ASGI middleware that assigns X-Request-Id and logs request metadata safely."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.logger = get_logger("prism.http")

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        req_id = _extract_or_generate_request_id(scope.get("headers", []))
        scope.setdefault("state", {})["request_id"] = req_id
        token = request_id_ctx.set(req_id)

        start = time.perf_counter()
        status_code = 500

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers = [(k, v) for (k, v) in headers if k.lower() != b"x-request-id"]
                headers.append((b"x-request-id", req_id.encode("latin-1")))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
            self.logger.info(
                "http_request",
                extra={
                    "requestId": req_id,
                    "method": scope.get("method", ""),
                    "route": scope.get("path", ""),
                    "status": status_code,
                    "latencyMs": latency_ms,
                },
            )
            request_id_ctx.reset(token)
