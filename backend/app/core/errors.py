from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger, get_request_id

logger = get_logger("prism.errors")


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status: int = 400,
        retry_after: int | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.retry_after = retry_after


def build_error_response(
    code: str,
    message: str,
    status: int,
    retry_after: int | None = None,
) -> JSONResponse:
    error_obj: dict[str, object] = {
        "code": code,
        "message": message,
    }
    headers: dict[str, str] = {"X-Request-Id": get_request_id()}
    if retry_after is not None:
        error_obj["retryAfterSeconds"] = retry_after
        headers["Retry-After"] = str(retry_after)
    return JSONResponse(
        status_code=status,
        content={"error": error_obj},
        headers=headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        return build_error_response(
            code=exc.code,
            message=exc.message,
            status=exc.status,
            retry_after=exc.retry_after,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        if any(err.get("type") == "json_invalid" for err in errors):
            msg = "Request body is not valid JSON."
        elif errors:
            first = errors[0]
            loc = ".".join(str(part) for part in first.get("loc", []) if part != "body")
            detail = first.get("msg", "Invalid value")
            msg = f"Invalid request field '{loc}': {detail}." if loc else f"Invalid request: {detail}."
        else:
            msg = "Malformed request payload."
        return build_error_response(code="BAD_REQUEST", message=msg, status=400)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(
        _request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        if exc.status_code == 404:
            return build_error_response(
                code="NOT_FOUND",
                message="The requested endpoint was not found.",
                status=404,
            )
        if exc.status_code == 405:
            return build_error_response(
                code="BAD_REQUEST",
                message="HTTP method not allowed for this endpoint.",
                status=405,
            )
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return build_error_response(
            code="BAD_REQUEST" if 400 <= exc.status_code < 500 else "INTERNAL",
            message=detail,
            status=exc.status_code,
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(
            "unhandled_exception",
            exc_info=exc,
            extra={
                "requestId": get_request_id(),
                "method": request.method,
                "route": request.url.path,
                "status": 500,
            },
        )
        return build_error_response(
            code="INTERNAL",
            message="An unexpected internal error occurred. Please try again.",
            status=500,
        )
