import hashlib
import struct
from sqlalchemy import text
from sqlalchemy.orm import Session


def derive_advisory_key_64(*parts: str) -> int:
    """
    Derives a deterministic 64-bit signed integer advisory lock key
    from domain parts using SHA-256 truncation to 8 bytes.

    Mathematical & Collision Characteristics:
    - 64-bit key space provides 2^64 (~1.84 * 10^19) unique values.
    - 50% collision probability threshold (birthday bound) requires ~2^32 (~4.29 billion) distinct keys.
    - Avoids PostgreSQL's 32-bit hashtext() collision bottleneck (~65,536 keys).
    - Big-endian signed 64-bit integer (struct format '>q') directly matches PostgreSQL's `bigint` domain
      (-9,223,372,036,854,775,808 to +9,223,372,036,854,775,807).
    """
    hasher = hashlib.sha256()
    for p in parts:
        hasher.update(p.encode("utf-8"))
        hasher.update(b"\x00")
    digest = hasher.digest()[:8]
    (key_int64,) = struct.unpack(">q", digest)
    return key_int64


def acquire_advisory_xact_lock(db: Session, *parts: str) -> int:
    """
    Acquires a transaction-level 64-bit advisory lock in PostgreSQL using `pg_advisory_xact_lock(bigint)`.
    The lock is strictly bound to the current PostgreSQL transaction and automatically released
    upon commit or rollback without manual cleanup.
    In SQLite (development/offline testing fallback), whole-file locking is handled natively.
    """
    key = derive_advisory_key_64(*parts)
    bind = db.get_bind()
    if bind and bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(:lock_key);"), {"lock_key": key})
    return key

