import json
import pathlib
import unittest
from unittest.mock import MagicMock

import requests

from services.amc_client import AMCClient, AMCError


FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "amc_showtimes.json"


class AMCClientTests(unittest.TestCase):
    def response(self, payload, status=200):
        response = MagicMock()
        response.status_code = status
        response.json.return_value = payload
        return response

    def test_normalizes_hal_showtimes_without_exposing_vendor_key(self):
        payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
        session = MagicMock()
        session.get.return_value = self.response(payload)

        result = AMCClient("secret-key", session).get_showtimes_near("2026-11-13", 40.42, -86.90)

        showtime = result["items"][0]
        self.assertEqual(showtime["ticketPrices"][0]["priceCents"], 1249)
        self.assertEqual(showtime["languages"]["spoken"], "Tamil")
        self.assertEqual(showtime["showDateTimeUtc"], "2026-11-13T17:30:00+00:00")
        _, kwargs = session.get.call_args
        self.assertEqual(kwargs["headers"]["X-AMC-Vendor-Key"], "secret-key")
        self.assertNotIn("secret-key", json.dumps(result))
        self.assertFalse(kwargs["allow_redirects"])

    def test_retries_one_timeout(self):
        session = MagicMock()
        session.get.side_effect = [requests.Timeout(), self.response({"_embedded": {"movies": []}})]
        result = AMCClient("secret-key", session).get_now_playing()
        self.assertEqual(result["items"], [])
        self.assertEqual(session.get.call_count, 2)

    def test_maps_no_showtimes_error(self):
        session = MagicMock()
        session.get.return_value = self.response({"code": 5217}, status=404)
        with self.assertRaises(AMCError) as raised:
            AMCClient("secret-key", session).get_showtimes_by_theatre(42, "2026-11-13")
        self.assertTrue(raised.exception.is_empty_result)
        self.assertEqual(raised.exception.status, 404)


if __name__ == "__main__":
    unittest.main()
