import time
from collections import defaultdict
from threading import Lock
from typing import Optional
from fastapi import HTTPException, status, Request
from app.core.config import settings


class InMemorySlidingWindowRateLimiter:
    """
    Sliding window in-memory rate limiter for authentication endpoints.
    Protects against credential stuffing and brute-force attacks.
    """
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> None:
        """
        Check if key has exceeded the rate limit.
        Raises HTTP 429 Too Many Requests if rate limited.
        """
        now = time.time()
        with self._lock:
            # Retain only timestamps within the active sliding window
            valid_timestamps = [t for t in self._history[key] if now - t < self.window_seconds]
            if len(valid_timestamps) >= self.max_requests:
                self._history[key] = valid_timestamps
                retry_after = int(self.window_seconds - (now - valid_timestamps[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many attempts. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )
            valid_timestamps.append(now)
            self._history[key] = valid_timestamps

    def reset(self, key: str) -> None:
        """Clear rate limit history for key (e.g., upon successful login)."""
        with self._lock:
            self._history.pop(key, None)


auth_rate_limiter = InMemorySlidingWindowRateLimiter(
    max_requests=settings.AUTH_RATE_LIMIT_PER_MINUTE,
    window_seconds=60
)

