import datetime as dt
import unittest

from services.amc_cache import AMCCache


class AMCCacheTests(unittest.TestCase):
    def test_reuses_fresh_value(self):
        cache = AMCCache()
        calls = []
        first = cache.get_or_fetch("key", 60, lambda: calls.append(1) or {"value": 1})
        second = cache.get_or_fetch("key", 60, lambda: calls.append(2) or {"value": 2})
        self.assertEqual(first["data"], second["data"])
        self.assertEqual(calls, [1])

    def test_serves_stale_value_when_refresh_fails(self):
        cache = AMCCache()
        cache._memory["key"] = {
            "_id": "key", "value": {"value": 1},
            "fetchedAtUtc": dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=2),
        }
        result = cache.get_or_fetch("key", 60, lambda: (_ for _ in ()).throw(RuntimeError("offline")))
        self.assertTrue(result["stale"])
        self.assertEqual(result["data"], {"value": 1})

    def test_accepts_naive_utc_timestamp_returned_by_pymongo(self):
        cache = AMCCache()
        cache._memory["key"] = {
            "_id": "key", "value": {"value": 1},
            "fetchedAtUtc": dt.datetime.now(dt.timezone.utc).replace(tzinfo=None),
        }
        result = cache.get_or_fetch("key", 60, lambda: {"value": 2})
        self.assertEqual(result["data"], {"value": 1})


if __name__ == "__main__":
    unittest.main()
