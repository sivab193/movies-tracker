import json
import pathlib
import unittest
from unittest.mock import MagicMock

import requests

from services.amc_client import AMCClient, AMCError, normalize_showtime


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


class NormalizeShowtimePosterTests(unittest.TestCase):
    def item(self, **overrides):
        base = {"id": 1, "movieId": 10, "movieName": "Example"}
        base.update(overrides)
        return base

    def test_imax_showtime_prefers_imax_poster(self):
        result = normalize_showtime(self.item(
            premiumFormat="IMAX with Laser",
            media={
                "posterIMAXDynamic": "https://img.example/imax.jpg",
                "posterDynamic": "https://img.example/standard.jpg",
            },
        ))
        self.assertEqual(result["moviePosterUrl"], "https://img.example/imax.jpg")

    def test_poster_falls_back_when_format_specific_is_empty(self):
        result = normalize_showtime(self.item(
            premiumFormat={"name": "Dolby Cinema"},
            media={
                "posterIMAXDynamic": "",
                "poster3DDynamic": "",
                "posterDynamic": "https://img.example/standard.jpg",
            },
        ))
        self.assertEqual(result["moviePosterUrl"], "https://img.example/standard.jpg")

        result = normalize_showtime(self.item(
            premiumFormat="RealD 3D",
            media={
                "poster3DDynamic": "",
                "posterDynamic": "https://img.example/standard.jpg",
            },
        ))
        self.assertEqual(result["moviePosterUrl"], "https://img.example/standard.jpg")

    def test_poster_is_none_when_media_missing_or_empty(self):
        self.assertIsNone(normalize_showtime(self.item())["moviePosterUrl"])
        self.assertIsNone(normalize_showtime(self.item(media={}))["moviePosterUrl"])
        self.assertIsNone(normalize_showtime(self.item(media={
            "posterDynamic": "",
            "posterStandard": "   ",
        }))["moviePosterUrl"])

    def test_movie_metadata_passes_through(self):
        result = normalize_showtime(self.item(runTime=166, mpaaRating="PG-13", genre="Sci-Fi"))
        self.assertEqual(result["runTime"], 166)
        self.assertEqual(result["mpaaRating"], "PG-13")
        self.assertEqual(result["genre"], "Sci-Fi")


if __name__ == "__main__":
    unittest.main()
