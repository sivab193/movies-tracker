import datetime as dt
import unittest
from unittest.mock import MagicMock, patch

from flask import Flask

from routes import amc
from services.amc_cache import AMCCache


class AMCRouteTests(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(amc.amc_bp, url_prefix="/api/amc")
        self.client = app.test_client()
        self.cache_patch = patch.object(amc, "_cache", AMCCache())
        self.cache_patch.start()
        self.auth_patch = patch.object(amc, "firebase_auth")
        self.firebase_auth = self.auth_patch.start()
        self.firebase_auth.verify_id_token.return_value = {"uid": "user-1"}
        self.headers = {"Authorization": "Bearer test-token"}

    def tearDown(self):
        self.auth_patch.stop()
        self.cache_patch.stop()

    def test_near_route_requires_login(self):
        response = self.client.get("/api/amc/showtimes/near?lat=40&lon=-86")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Sign in required", response.get_json()["error"])

    def test_near_route_rejects_invalid_token(self):
        self.firebase_auth.verify_id_token.side_effect = Exception("bad token")
        response = self.client.get("/api/amc/showtimes/near?lat=40&lon=-86", headers=self.headers)
        self.assertEqual(response.status_code, 401)

    def test_sync_endpoint_is_removed(self):
        response = self.client.post("/api/amc/sync", headers=self.headers)
        self.assertEqual(response.status_code, 404)

    def test_near_route_validates_coordinates(self):
        response = self.client.get("/api/amc/showtimes/near?lat=200&lon=0", headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("valid range", response.get_json()["error"])

    def test_near_route_validates_limit(self):
        response = self.client.get("/api/amc/showtimes/near?lat=40&lon=-86&limit=many", headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "limit must be an integer")

    @patch.object(amc, "_client")
    def test_near_route_groups_and_sorts_by_distance(self, client_factory):
        api = client_factory.return_value
        api.get_showtimes_near.return_value = {"items": [
            {"id": "far", "theatreId": 2, "showDateTimeLocal": "2026-11-13T20:00:00-05:00"},
            {"id": "near", "theatreId": 1, "showDateTimeLocal": "2026-11-13T18:00:00-05:00"},
        ], "page": {}}
        api.get_theatre.side_effect = lambda theatre_id: {
            "id": theatre_id, "name": f"Theatre {theatre_id}",
            "location": {"lat": 40.5 if theatre_id == 1 else 41.5, "lon": -86.9},
        }
        date = dt.date.today().isoformat()
        response = self.client.get(f"/api/amc/showtimes/near?lat=40.4259&lon=-86.9081&date={date}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual([group["theatre"]["id"] for group in payload["groups"]], [1, 2])
        self.assertEqual(payload["attribution"], "Showtimes by AMC")
        self.assertFalse(payload["stale"])


if __name__ == "__main__":
    unittest.main()
