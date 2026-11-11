from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import RequestContextMiddleware, configure_logging
from app.core.versions import APP_NAME, APP_VERSION
from app.routers.external import router as external_router
from app.routers.health import router as health_router
from app.routers.lesson import router as lesson_router
from app.services.gemini import gemini_service


def create_app(settings_override: Settings | None = None) -> FastAPI:
    settings = settings_override or get_settings()
    configure_logging(settings.LOG_LEVEL)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        gemini_service.init_client(settings)
        yield

    application = FastAPI(title=APP_NAME, version=APP_VERSION, lifespan=lifespan)
    register_exception_handlers(application)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-Id", "Retry-After"],
        max_age=600,
    )
    application.add_middleware(RequestContextMiddleware)

    application.include_router(health_router)
    application.include_router(lesson_router)
    application.include_router(external_router)
    return application


app = create_app()
