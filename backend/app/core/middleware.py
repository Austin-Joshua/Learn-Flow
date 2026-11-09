from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends OWASP-recommended HTTP security headers to all API responses.
    """
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' data: https:; "
                "font-src 'self' https: data:; "
                "style-src 'self' 'unsafe-inline'; "
                "script-src 'self'; "
                "frame-ancestors 'none';"
            )
        return response


class RequestBodyLimitMiddleware(BaseHTTPMiddleware):
    """
    Rejects requests whose payload exceeds the configured maximum body size (default 15 MB)
    to protect against denial-of-service via memory exhaustion.
    """
    def __init__(self, app, max_bytes: int = settings.MAX_REQUEST_BODY_BYTES):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Payload too large. Maximum permitted request body is {self.max_bytes // (1024 * 1024)} MB."
                        }
                    )
            except ValueError:
                pass
        return await call_next(request)

