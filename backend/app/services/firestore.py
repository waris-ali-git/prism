from __future__ import annotations

import asyncio
import base64
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app.core.config import get_settings

logger = logging.getLogger("app.firestore")

_app_initialized = False
_init_lock = asyncio.Lock()
_firestore_client: Any = None


def _get_credentials() -> credentials.Certificate | None:
    settings = get_settings()

    # Priority 1: Base64-encoded service account (e.g. on Render)
    if settings.FIREBASE_SERVICE_ACCOUNT_B64.strip():
        try:
            raw = base64.b64decode(settings.FIREBASE_SERVICE_ACCOUNT_B64.strip()).decode("utf-8")
            data = json.loads(raw)
            return credentials.Certificate(data)
        except Exception as exc:
            logger.error("Failed to decode FIREBASE_SERVICE_ACCOUNT_B64: %s", exc)
            return None

    # Priority 2: JSON file path
    cred_path_str = settings.GOOGLE_APPLICATION_CREDENTIALS.strip()
    if cred_path_str:
        cred_path = Path(cred_path_str)
        if not cred_path.is_absolute():
            cred_path = Path.cwd() / cred_path
        if cred_path.is_file():
            try:
                return credentials.Certificate(str(cred_path))
            except Exception as exc:
                logger.error("Failed to load GOOGLE_APPLICATION_CREDENTIALS file: %s", exc)
                return None
        else:
            logger.warning("GOOGLE_APPLICATION_CREDENTIALS file not found: %s", cred_path)

    return None


def get_firestore_client() -> Any:
    global _app_initialized, _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    if not _app_initialized:
        cred = _get_credentials()
        settings = get_settings()
        options = {}
        if settings.FIREBASE_PROJECT_ID.strip():
            options["projectId"] = settings.FIREBASE_PROJECT_ID.strip()

        try:
            if cred is not None:
                firebase_admin.initialize_app(cred, options=options)
            else:
                # Attempt default app init if projectId is present
                firebase_admin.initialize_app(options=options)
            _app_initialized = True
        except ValueError:
            # Already initialized
            _app_initialized = True
        except Exception as exc:
            logger.error("Failed to initialize firebase_admin app: %s", exc)
            return None

    try:
        _firestore_client = firestore.client()
        return _firestore_client
    except Exception as exc:
        logger.error("Failed to obtain Firestore client: %s", exc)
        return None


async def check_firestore_health() -> str:
    """Returns 'ok', 'error', or 'missing'."""
    settings = get_settings()
    if not settings.firestore_credentials_present:
        return "missing"

    def _probe() -> bool:
        db = get_firestore_client()
        if db is None:
            return False
        # Lightweight probe - list collections or read a metadata doc
        try:
            list(db.collections())
            return True
        except Exception as e:
            logger.warning("Firestore health check probe failed: %s", e)
            return False

    try:
        is_ok = await asyncio.to_thread(_probe)
        return "ok" if is_ok else "error"
    except Exception:
        return "error"


async def get_cached_lesson(doc_id: str) -> dict[str, Any] | None:
    """Fetch cached lesson document from 'lessons' collection by doc_id."""
    def _read() -> dict[str, Any] | None:
        db = get_firestore_client()
        if db is None:
            return None
        try:
            doc_ref = db.collection("lessons").document(doc_id)
            snapshot = doc_ref.get()
            if snapshot.exists:
                return snapshot.to_dict()
            return None
        except Exception as exc:
            logger.warning("Firestore read failed for lesson '%s': %s", doc_id, exc)
            return None

    return await asyncio.to_thread(_read)


async def save_cached_lesson(doc_id: str, data: dict[str, Any]) -> bool:
    """Save generated lesson to 'lessons' collection."""
    def _write() -> bool:
        db = get_firestore_client()
        if db is None:
            return False
        try:
            doc_ref = db.collection("lessons").document(doc_id)
            doc_ref.set(data)
            return True
        except Exception as exc:
            logger.warning("Firestore write failed for lesson '%s': %s", doc_id, exc)
            return False

    return await asyncio.to_thread(_write)


async def list_recent_lessons(limit: int, version: str) -> list[dict[str, Any]]:
    """Query recent lessons, filter by version in Python, return up to limit."""
    def _query() -> list[dict[str, Any]]:
        db = get_firestore_client()
        if db is None:
            return []
        try:
            # Query up to 30 most recent lessons, ordered by createdAt descending
            query = (
                db.collection("lessons")
                .order_by("createdAt", direction=firestore.Query.DESCENDING)
                .limit(30)
            )
            docs = query.stream()
            results = []
            for doc in docs:
                item = doc.to_dict()
                if item.get("version") == version:
                    results.append(
                        {
                            "topic": item.get("topic", ""),
                            "topicKey": item.get("topicKey", ""),
                            "category": item.get("category", "other"),
                            "title": {
                                "en": item.get("titleEn", ""),
                                "ur": item.get("titleUr", ""),
                            },
                            "createdAt": item.get("createdAt", ""),
                        }
                    )
                    if len(results) >= limit:
                        break
            return results
        except Exception as exc:
            logger.warning("Firestore query for recent lessons failed: %s", exc)
            return []

    return await asyncio.to_thread(_query)


async def check_topic_has_lesson(topic_key: str) -> bool:
    """Check if at least one lesson document exists for this topicKey."""
    def _check() -> bool:
        db = get_firestore_client()
        if db is None:
            return False
        try:
            docs = (
                db.collection("lessons")
                .where(filter=FieldFilter("topicKey", "==", topic_key))
                .limit(1)
                .stream()
            )
            return any(True for _ in docs)
        except Exception as exc:
            logger.warning("Firestore check for topicKey '%s' failed: %s", topic_key, exc)
            return False

    return await asyncio.to_thread(_check)
