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
    def test_near_route_accepts_date_thirty_days_out(self, client_factory):
        client_factory.return_value.get_showtimes_near.return_value = {"items": [], "page": {}}
        date = (dt.date.today() + dt.timedelta(days=30)).isoformat()
        response = self.client.get(f"/api/amc/showtimes/near?lat=40&lon=-86&date={date}", headers=self.headers)
        self.assertEqual(response.status_code, 200)

    def test_near_route_rejects_date_beyond_thirty_days(self):
        date = (dt.date.today() + dt.timedelta(days=31)).isoformat()
        response = self.client.get(f"/api/amc/showtimes/near?lat=40&lon=-86&date={date}", headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("thirty days", response.get_json()["error"])

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


class AMCMovieShowtimesRouteTests(unittest.TestCase):
    """Regression coverage for GET /api/movies/<movie_id>/showtimes.

    The name-lookup path used to raise ``TypeError: _cached() got multiple
    values for argument 'name'`` for every movie without a preset
    ``amcMovieId``, which Flask rendered as an HTML 500 page.
    """

    MOVIE = {
        "_id": "mv1",
        "title": "Jailer 2",
        "year": "2026",
        "runtime": "168 min",
        "imdbId": "tt9999999",
    }

    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(amc.movie_showtimes_bp, url_prefix="/api/movies")
        self.client = app.test_client()
        self.cache_patch = patch.object(amc, "_cache", AMCCache())
        self.cache_patch.start()
        self.auth_patch = patch.object(amc, "firebase_auth")
        self.firebase_auth = self.auth_patch.start()
        self.firebase_auth.verify_id_token.return_value = {"uid": "user-1"}
        self.db_patch = patch.object(amc, "db", MagicMock())
        self.db_patch.start()
        self.headers = {"Authorization": "Bearer test-token"}
        self.date = dt.date.today().isoformat()
        self.url = f"/api/movies/mv1/showtimes?lat=40.4259&lon=-86.9081&date={self.date}"

    def tearDown(self):
        self.db_patch.stop()
        self.auth_patch.stop()
        self.cache_patch.stop()

    def _api_client(self, client_factory):
        api = client_factory.return_value
        api.get_movie_by_name.return_value = {"items": [
            {"id": 9001, "name": "Jailer 2", "imdbId": "tt9999999", "runTime": 170,
             "releaseDateUtc": "2026-08-14T00:00:00+00:00"},
        ], "page": {}}
        api.get_showtimes_near.return_value = {"items": [
            {"id": "match", "movieId": 9001, "movieName": "Jailer 2", "theatreId": 1,
             "showDateTimeLocal": "2026-11-26T12:30:00-05:00"},
            {"id": "other", "movieId": 777, "movieName": "Other Film", "theatreId": 1,
             "showDateTimeLocal": "2026-11-26T15:00:00-05:00"},
        ], "page": {}}
        api.get_theatre.return_value = {
            "id": 1, "name": "AMC Test 1", "location": {"lat": 40.5, "lon": -86.9},
        }
        return api

    def test_movie_showtimes_requires_login(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Sign in required", response.get_json()["error"])

    @patch("routes.movies.find_movie", return_value=None)
    def test_movie_showtimes_missing_movie_is_json_404(self, _find_movie):
        response = self.client.get(self.url, headers=self.headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"], "Movie not found")

    @patch.object(amc, "_client")
    @patch("routes.movies.find_movie")
    def test_movie_showtimes_resolves_amc_movie_by_name(self, find_movie, client_factory):
        find_movie.return_value = dict(self.MOVIE)
        self._api_client(client_factory)
        response = self.client.get(self.url, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.content_type.startswith("application/json"))
        payload = response.get_json()
        self.assertTrue(payload["matched"])
        self.assertEqual(payload["amcMovieId"], 9001)
        self.assertEqual(len(payload["groups"]), 1)
        showtime_ids = [item["id"] for item in payload["groups"][0]["showtimes"]]
        self.assertEqual(showtime_ids, ["match"])

    @patch.object(amc, "_client")
    @patch("routes.movies.find_movie")
    def test_movie_showtimes_unmatched_movie_returns_empty_groups(self, find_movie, client_factory):
        find_movie.return_value = dict(self.MOVIE)
        client_factory.return_value.get_movie_by_name.return_value = {"items": [], "page": {}}
        response = self.client.get(self.url, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertFalse(payload["matched"])
        self.assertEqual(payload["groups"], [])

    @patch.object(amc, "_client")
    @patch("routes.movies.find_movie")
    def test_movie_showtimes_with_preset_amc_id_skips_name_lookup(self, find_movie, client_factory):
        find_movie.return_value = {**self.MOVIE, "amcMovieId": 9001}
        api = self._api_client(client_factory)
        response = self.client.get(self.url, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["matched"])
        api.get_movie_by_name.assert_not_called()


if __name__ == "__main__":
    unittest.main()
