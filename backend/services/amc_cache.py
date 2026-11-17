"""Cache-first AMC access with stale-on-error behavior."""

from __future__ import annotations

import datetime as dt
import threading
from typing import Any, Callable, Dict, Optional


class AMCCache:
    def __init__(self, database=None):
        self.database = database
        self._memory: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def _read(self, key: str) -> Optional[Dict[str, Any]]:
        if self.database is not None:
            return self.database.amc_api_cache.find_one({"_id": key})
        return self._memory.get(key)

    def _write(self, key: str, value: Any, now: dt.datetime) -> None:
        document = {"_id": key, "value": value, "fetchedAtUtc": now}
        if self.database is not None:
            self.database.amc_api_cache.replace_one({"_id": key}, document, upsert=True)
        else:
            self._memory[key] = document

    def get_or_fetch(self, key: str, ttl_seconds: int, fetch: Callable[[], Any]) -> Dict[str, Any]:
        now = dt.datetime.now(dt.timezone.utc)
        cached = self._read(key)
        if cached and (now - _as_utc(cached["fetchedAtUtc"])).total_seconds() < ttl_seconds:
            return {"data": cached["value"], "fetchedAtUtc": _as_utc(cached["fetchedAtUtc"]).isoformat(), "stale": False}
        with self._lock:
            cached = self._read(key)
            if cached and (now - _as_utc(cached["fetchedAtUtc"])).total_seconds() < ttl_seconds:
                return {"data": cached["value"], "fetchedAtUtc": _as_utc(cached["fetchedAtUtc"]).isoformat(), "stale": False}
            try:
                value = fetch()
            except Exception:
                if cached:
                    return {"data": cached["value"], "fetchedAtUtc": _as_utc(cached["fetchedAtUtc"]).isoformat(), "stale": True}
                raise
            self._write(key, value, now)
            return {"data": value, "fetchedAtUtc": now.isoformat(), "stale": False}


def _as_utc(value: dt.datetime) -> dt.datetime:
    """PyMongo returns naive UTC datetimes unless tz_aware is enabled."""
    if value.tzinfo is None:
        return value.replace(tzinfo=dt.timezone.utc)
    return value.astimezone(dt.timezone.utc)
