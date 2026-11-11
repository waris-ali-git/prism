from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.logging import get_request_id

logger = logging.getLogger("prism.external")


class ExternalApiService:
    """Client adapter for external simulation services (e.g. AgentRouter)."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings

    def _get_settings(self) -> Settings:
        return self._settings or get_settings()

    async def generate_simulation(
        self,
        topic: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        cfg = self._get_settings()
        if not cfg.external_configured:
            raise AppError(
                code="EXTERNAL_NOT_CONFIGURED",
                message="The external simulation API is not configured.",
                status=503,
            )

        headers = {
            cfg.EXTERNAL_API_AUTH_HEADER: f"{cfg.EXTERNAL_API_AUTH_SCHEME} {cfg.EXTERNAL_API_KEY}".strip(),
            "Content-Type": "application/json",
        }
        payload = {
            "topic": topic,
            "params": params or {},
        }

        try:
            async with httpx.AsyncClient(timeout=cfg.EXTERNAL_API_TIMEOUT_SECONDS) as client:
                resp = await client.post(
                    cfg.EXTERNAL_API_BASE_URL,
                    json=payload,
                    headers=headers,
                )
                if resp.status_code == 401 or resp.status_code == 403:
                    logger.warning(
                        "external_auth_failed status=%d body=%s",
                        resp.status_code,
                        resp.text[:200],
                        extra={"requestId": get_request_id()},
                    )
                    raise AppError(
                        code="EXTERNAL_FAILED",
                        message="External simulation service authentication failed.",
                        status=502,
                    )
                if resp.status_code >= 400:
                    logger.warning(
                        "external_request_failed status=%d body=%s",
                        resp.status_code,
                        resp.text[:200],
                        extra={"requestId": get_request_id()},
                    )
                    raise AppError(
                        code="EXTERNAL_FAILED",
                        message="External simulation service returned an error.",
                        status=502,
                    )
                return resp.json()
        except httpx.TimeoutException:
            raise AppError(
                code="EXTERNAL_FAILED",
                message="External simulation service timed out.",
                status=504,
            )
        except httpx.RequestError as exc:
            logger.error("external_network_error: %s", exc, extra={"requestId": get_request_id()})
            raise AppError(
                code="EXTERNAL_FAILED",
                message="Could not reach the external simulation service.",
                status=502,
            )


external_service = ExternalApiService()
