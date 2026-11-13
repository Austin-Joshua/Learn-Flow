import time
import hashlib
import logging
from collections import defaultdict
from threading import Lock
from typing import Optional, Dict, List
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger("learnflow.rate_limit")

# Atomic Lua script for Redis sliding-window rate limiting
SLIDING_WINDOW_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local clear_before = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clear_before)
local current_requests = redis.call('ZCARD', key)

if current_requests >= max_requests then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = 1
    if #oldest >= 2 then
        retry_after = math.ceil(tonumber(oldest[2]) + window - now)
        if retry_after < 1 then retry_after = 1 end
    end
    return {0, retry_after}
else
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, math.ceil(window) + 10)
    return {1, 0}
end
"""


class DistributedSlidingWindowRateLimiter:
    """
    Atomic, distributed sliding-window rate limiter.
    Uses Redis when configured (multi-pod / production), with an automatic
    conservative in-memory fallback for local development or transient Redis outages.

    Security Controls:
    - Never stores raw emails, IP addresses, or sensitive text in key names (SHA-256 hashed).
    - Uses atomic Redis Lua execution to eliminate concurrency bypasses.
    - Automatic TTL expiration prevents key accumulation.
    """

    def __init__(self, max_requests: int = 10, window_seconds: int = 60, redis_url: Optional[str] = None):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.redis_url = redis_url or settings.REDIS_URL
        self.backend = getattr(settings, "RATE_LIMIT_BACKEND", "redis").lower()
        self._redis_client = None
        self._lua_script = None

        # Thread-safe in-memory state
        self._memory_history: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()

        if self.backend == "redis":
            self._init_redis()
        else:
            logger.info("Initialized single-instance in-memory rate limiter (RATE_LIMIT_BACKEND=memory).")

    @property
    def _history(self) -> Dict[str, List[float]]:
        """Compatibility property for legacy test fixtures."""
        return self._memory_history

    def _init_redis(self) -> None:
        if self.redis_url:
            try:
                import redis
                self._redis_client = redis.Redis.from_url(
                    self.redis_url,
                    socket_connect_timeout=1.5,
                    socket_timeout=1.5,
                    decode_responses=True
                )
                self._lua_script = self._redis_client.register_script(SLIDING_WINDOW_LUA)
                # Ping test
                self._redis_client.ping()
                logger.info("Connected to distributed Redis rate-limiting backend.")
            except Exception as e:
                logger.warning(f"Could not connect to Redis at {self.redis_url}: {e}. Falling back to in-memory limiter.")
                self._redis_client = None

    def _hash_key(self, raw_key: str) -> str:
        """Hash key with SHA-256 to ensure no PII or credentials are stored in cache stores."""
        digest = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:24]
        return f"learnflow:rl:{digest}"

    def _prune_expired_keys(self, now: float) -> None:
        """Evicts expired keys from in-memory history to prevent unbounded memory growth."""
        keys_to_delete = [
            k for k, timestamps in self._memory_history.items()
            if not timestamps or (now - timestamps[-1] >= self.window_seconds)
        ]
        for k in keys_to_delete:
            self._memory_history.pop(k, None)

    def check(self, key: str) -> None:
        """
        Evaluates whether key has exceeded max requests in the sliding window.
        Raises HTTP 429 Too Many Requests if rate limited.
        """
        now = time.time()
        safe_key = self._hash_key(key)

        # 1. Distributed Redis backend
        if self.backend == "redis":
            if self._redis_client:
                try:
                    allowed, retry_after = self._lua_script(
                        keys=[safe_key],
                        args=[now, self.window_seconds, self.max_requests]
                    )
                    if not allowed:
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                            headers={"Retry-After": str(retry_after)}
                        )
                    return
                except HTTPException:
                    raise
                except Exception as e:
                    if settings.ENVIRONMENT.lower() == "production":
                        logger.critical(f"CRITICAL OPERATIONAL ALERT: Redis rate-limiter failure in production: {e}. Enforcing fail-closed policy.")
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Rate limiting service temporarily unavailable. Please retry shortly.",
                            headers={"Retry-After": "30"}
                        )
                    logger.warning(f"Redis rate-limit query failed: {e}. Executing in-memory conservative fallback.")

            # In production when Redis was explicitly configured, enforce fail-closed
            if settings.ENVIRONMENT.lower() == "production" and not self._redis_client:
                logger.critical("CRITICAL OPERATIONAL ALERT: Distributed Redis client is uninitialized in production with RATE_LIMIT_BACKEND=redis. Enforcing fail-closed policy.")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Rate limiting service temporarily unavailable. Please retry shortly.",
                    headers={"Retry-After": "30"}
                )

        # 2. Thread-safe in-memory sliding window (RATE_LIMIT_BACKEND=memory or dev/testing fallback)
        with self._lock:
            # Periodic memory cleanup
            if len(self._memory_history) > 1000:
                self._prune_expired_keys(now)

            valid_timestamps = [t for t in self._memory_history[safe_key] if now - t < self.window_seconds]
            if len(valid_timestamps) >= self.max_requests:
                self._memory_history[safe_key] = valid_timestamps
                retry_after = int(self.window_seconds - (now - valid_timestamps[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )
            valid_timestamps.append(now)
            self._memory_history[safe_key] = valid_timestamps

    def reset(self, key: str) -> None:
        """Resets rate limit counter for a specific key (e.g. after successful login)."""
        safe_key = self._hash_key(key)
        if self._redis_client:
            try:
                self._redis_client.delete(safe_key)
            except Exception:
                pass
        with self._lock:
            self._memory_history.pop(safe_key, None)

    def reset_all(self) -> None:
        """Resets all rate limit state (testing hook)."""
        if self._redis_client:
            try:
                keys = self._redis_client.keys("learnflow:rl:*")
                if keys:
                    self._redis_client.delete(*keys)
            except Exception:
                pass
        with self._lock:
            self._memory_history.clear()


# Shared singletons
auth_rate_limiter = DistributedSlidingWindowRateLimiter(
    max_requests=settings.AUTH_RATE_LIMIT_PER_MINUTE,
    window_seconds=60
)

ai_rate_limiter = DistributedSlidingWindowRateLimiter(
    max_requests=25,
    window_seconds=60
)
