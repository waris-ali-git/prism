import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.ratelimit import SlidingWindowRateLimiter, lesson_rate_limiter
from app.main import create_app


@pytest.fixture(autouse=True)
def _reset_limiters() -> None:
    lesson_rate_limiter.reset()


@pytest.mark.asyncio
async def test_health_and_request_id() -> None:
    app = create_app(Settings(GEMINI_API_KEY="", GEMINI_MODEL="", EXTERNAL_API_BASE_URL="", EXTERNAL_API_KEY=""))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/health", headers={"X-Request-Id": "req-abc-123"})
    assert resp.status_code == 200
    assert resp.headers.get("x-request-id") == "req-abc-123"
    body = resp.json()
    assert body["status"] == "ok"
    assert body["schemaVersion"] == 1
    assert body["gemini"] == "missing"
    assert body["external"] == "not_configured"


@pytest.mark.asyncio
async def test_malformed_json_returns_6_5_error() -> None:
    app = create_app(Settings())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/lesson",
            content=b"{not-valid-json",
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 400
    assert "x-request-id" in resp.headers
    assert resp.json() == {
        "error": {
            "code": "BAD_REQUEST",
            "message": "Request body is not valid JSON.",
        }
    }


@pytest.mark.asyncio
async def test_unknown_route_returns_not_found_6_5() -> None:
    app = create_app(Settings())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_missing_gemini_config_returns_503() -> None:
    app = create_app(Settings(GEMINI_API_KEY="", GEMINI_MODEL=""))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/lesson", json={"topic": "uncached new topic test"})
    assert resp.status_code == 503
    assert resp.json()["error"]["code"] == "CONFIG_MISSING"


@pytest.mark.asyncio
async def test_cors_preflight_allowed_origin() -> None:
    app = create_app(Settings(ALLOWED_ORIGINS="http://localhost:5173"))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.options(
            "/api/lesson",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_sliding_window_rate_limiter() -> None:
    limiter = SlidingWindowRateLimiter(window_seconds=60.0)
    limiter.check("127.0.0.1", max_requests=2)
    limiter.check("127.0.0.1", max_requests=2)
    with pytest.raises(Exception) as exc_info:
        limiter.check("127.0.0.1", max_requests=2)
    err = exc_info.value
    assert getattr(err, "code", None) == "RATE_LIMITED"
    assert getattr(err, "status", None) == 429
    assert isinstance(getattr(err, "retry_after", None), int)
    assert getattr(err, "retry_after", 0) >= 1
