from fastapi import FastAPI

from app.core.versions import APP_NAME, APP_VERSION
from app.routers.health import router as health_router


def create_app() -> FastAPI:
    application = FastAPI(title=APP_NAME, version=APP_VERSION)
    application.include_router(health_router)
    return application


app = create_app()
