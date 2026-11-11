import base64
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import create_app


@pytest.mark.asyncio
async def test_image_validation_rejections() -> None:
    app = create_app(Settings())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid mime type
        r1 = await client.post("/api/lesson", json={
            "imageBase64": base64.b64encode(b"test").decode(),
            "mimeType": "image/gif"
        })
        assert r1.status_code == 400

        # Mismatched magic bytes (JPEG header wrong)
        r2 = await client.post("/api/lesson", json={
            "imageBase64": base64.b64encode(b"FAKE_DATA_NOT_JPEG").decode(),
            "mimeType": "image/jpeg"
        })
        assert r2.status_code == 415
        assert r2.json()["error"]["code"] == "UNSUPPORTED_IMAGE"

        # Oversized image (> 4MB)
        large_bytes = b"\xff\xd8\xff" + (b"0" * 4_100_000)
        r3 = await client.post("/api/lesson", json={
            "imageBase64": base64.b64encode(large_bytes).decode(),
            "mimeType": "image/jpeg"
        })
        assert r3.status_code == 413
        assert r3.json()["error"]["code"] == "IMAGE_TOO_LARGE"


@pytest.mark.asyncio
async def test_quiz_result_validation() -> None:
    app = create_app(Settings())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Score > total
        r1 = await client.post("/api/result", json={
            "topicKey": "solar-system",
            "topic": "The Solar System",
            "score": 10,
            "total": 5
        })
        assert r1.status_code == 400
        assert r1.json()["error"]["code"] == "BAD_REQUEST"

        # Non-existent topicKey
        r2 = await client.post("/api/result", json={
            "topicKey": "definitely-not-a-real-topic-key-12345",
            "topic": "Random",
            "score": 3,
            "total": 5
        })
        assert r2.status_code == 404
        assert r2.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_stats_endpoint_returns_json() -> None:
    app = create_app(Settings())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "topics" in data
        assert "generatedAt" in data
