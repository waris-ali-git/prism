from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Gemini ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = ""
    GEMINI_TIMEOUT_SECONDS: float = 45.0
    GEMINI_MAX_CONCURRENCY: int = 2
    GEMINI_THINKING_BUDGET: int | None = None
    QUIZ_VERIFY_ENABLED: bool = False

    # --- Firebase / Firestore ---
    FIREBASE_PROJECT_ID: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    FIREBASE_SERVICE_ACCOUNT_B64: str = ""
    COLLECTION_PREFIX: str = "dev_"

    # --- Second API ---
    EXTERNAL_API_BASE_URL: str = ""
    EXTERNAL_API_KEY: str = ""
    EXTERNAL_API_AUTH_HEADER: str = "Authorization"
    EXTERNAL_API_AUTH_SCHEME: str = "Bearer"
    EXTERNAL_API_TIMEOUT_SECONDS: float = 20.0

    # --- App ---
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    RATE_LIMIT_LESSON_PER_MIN: int = 6
    RATE_LIMIT_RESULT_PER_MIN: int = 30
    MAX_IMAGE_BYTES: int = 4_000_000

    @field_validator("GEMINI_THINKING_BUDGET", mode="before")
    @classmethod
    def _empty_str_to_none(cls, value: Any) -> Any:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY.strip() and self.GEMINI_MODEL.strip())

    @property
    def external_configured(self) -> bool:
        return bool(self.EXTERNAL_API_BASE_URL.strip() and self.EXTERNAL_API_KEY.strip())

    @property
    def firestore_credentials_present(self) -> bool:
        if self.FIREBASE_SERVICE_ACCOUNT_B64.strip():
            return True
        cred_path = self.GOOGLE_APPLICATION_CREDENTIALS.strip()
        if not cred_path:
            return False
        path = Path(cred_path)
        if not path.is_absolute():
            path = _BACKEND_DIR / path
        return path.is_file()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
