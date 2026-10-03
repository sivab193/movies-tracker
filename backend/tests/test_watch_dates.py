import sys
import types
import unittest
from unittest.mock import MagicMock


sys.modules.setdefault('firebase_config', types.SimpleNamespace(auth=MagicMock()))
sys.modules.setdefault('mongo_config', types.SimpleNamespace(db=MagicMock()))

from routes.users import normalize_watch_date, parse_watch_payload


class WatchDateTests(unittest.TestCase):
    def valid_payload(self, **overrides):
        payload = {
            'currency': 'USD',
            'ticketCost': 0,
            'foodCost': 0,
            'watchDate': '2026-06-30',
            'showTime': '19:30',
        }
        payload.update(overrides)
        return payload

    def test_keeps_literal_calendar_date(self):
        self.assertEqual(parse_watch_payload(self.valid_payload()), '2026-06-30')

    def test_reads_legacy_iso_timestamp_without_timezone_conversion(self):
        payload = self.valid_payload()
        payload.pop('watchDate')
        payload['timestamp'] = '2026-06-30T00:00:00.000Z'
        self.assertEqual(parse_watch_payload(payload), '2026-06-30')

    def test_rejects_invalid_calendar_date(self):
        with self.assertRaisesRegex(ValueError, 'valid calendar date'):
            normalize_watch_date('2026-02-30')

    def test_rejects_timezone_bearing_watch_date(self):
        with self.assertRaisesRegex(ValueError, 'YYYY-MM-DD'):
            normalize_watch_date('2026-06-30T00:00:00Z')

    def test_rejects_non_24_hour_show_time(self):
        with self.assertRaisesRegex(ValueError, '24-hour HH:mm'):
            parse_watch_payload(self.valid_payload(showTime='7:30 PM'))


if __name__ == '__main__':
    unittest.main()
