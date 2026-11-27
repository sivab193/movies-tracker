import re
import unittest
from unittest.mock import patch

from flask import Flask

from routes import search as search_module


def _matches(doc, query):
    for key, condition in query.items():
        if key == "$or":
            if not any(_matches(doc, sub) for sub in condition):
                return False
            continue
        value = doc.get(key)
        if isinstance(condition, dict) and "$regex" in condition:
            flags = re.IGNORECASE if "i" in condition.get("$options", "") else 0
            pattern = re.compile(condition["$regex"], flags)
            values = value if isinstance(value, list) else [value]
            if not any(isinstance(item, str) and pattern.search(item) for item in values):
                return False
        elif value != condition:
            return False
    return True


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def limit(self, count):
        return FakeCursor(self._docs[:count])

    def __iter__(self):
        return iter(self._docs)


class FakeCollection:
    def __init__(self, docs):
        self._docs = docs

    def find(self, query, projection=None):
        return FakeCursor([doc for doc in self._docs if _matches(doc, query)])


class FakeDb:
    def __init__(self, movies=(), series=(), theaters=(), users=()):
        self.movies = FakeCollection(list(movies))
        self.series = FakeCollection(list(series))
        self.theaters = FakeCollection(list(theaters))
        self.users = FakeCollection(list(users))


class GlobalSearchTests(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(search_module.search_bp, url_prefix="/api/search")
        self.client = app.test_client()
        fake_db = FakeDb(
            movies=[
                {"_id": "m1", "title": "Jailer 2", "year": 2026, "posterUrl": "https://x/p2.jpg",
                 "imdbId": "tt2", "Actors": "Rajinikanth, Mohanlal", "Director": "Nelson Dilipkumar"},
                {"_id": "m2", "title": "Jailer", "year": 2023, "posterUrl": "https://x/p1.jpg",
                 "imdbId": "tt1", "Actors": "Rajinikanth", "Director": "Nelson Dilipkumar"},
                {"_id": "m3", "title": "Leo", "year": 2023, "Actors": "Vijay", "Director": "Lokesh Kanagaraj"},
            ],
            series=[
                {"_id": "s1", "title": "Jailer Diaries", "year": 2024, "posterUrl": "https://x/s1.jpg",
                 "actors": ["Series Actor"]},
            ],
            theaters=[
                {"_id": "t1", "name": "AMC Jailer Plaza", "location": "Chicago, IL"},
                {"_id": "t2", "name": "Regal", "location": "Jailer Street, IN"},
            ],
            users=[
                {"displayName": "Jai Kumar", "customUrl": "jai", "isPublic": True, "photoURL": "https://x/u.jpg"},
                {"displayName": "Jai Private", "customUrl": "jaiprivate", "isPublic": False},
                {"displayName": "Jai NoUrl", "isPublic": True},
            ],
        )
        self.db_patch = patch.object(search_module, "db", fake_db)
        self.db_patch.start()

    def tearDown(self):
        self.db_patch.stop()

    def search(self, query):
        response = self.client.get(f"/api/search/?q={query}")
        self.assertEqual(response.status_code, 200)
        return response.get_json()

    def test_groups_movies_series_and_theatres(self):
        payload = self.search("jailer")
        self.assertEqual([movie["title"] for movie in payload["movies"]], ["Jailer", "Jailer 2"])
        self.assertEqual(payload["movies"][0]["posterUrl"], "https://x/p1.jpg")
        self.assertEqual([item["title"] for item in payload["series"]], ["Jailer Diaries"])
        self.assertEqual([item["name"] for item in payload["theatres"]], ["AMC Jailer Plaza", "Regal"])
        self.assertEqual(payload["people"], [])

    def test_people_come_from_catalog_credits(self):
        payload = self.search("rajinikanth")
        self.assertEqual(payload["people"], [{"name": "Rajinikanth", "slug": "rajinikanth"}])
        payload = self.search("nelson")
        self.assertEqual(payload["people"], [{"name": "Nelson Dilipkumar", "slug": "nelson-dilipkumar"}])

    def test_users_require_public_profile_and_custom_url(self):
        payload = self.search("jai")
        self.assertEqual(payload["users"], [
            {"username": "jai", "displayName": "Jai Kumar", "photoURL": "https://x/u.jpg"},
        ])

    def test_blank_query_returns_empty_groups(self):
        payload = self.search("")
        self.assertEqual(payload, {"query": "", "movies": [], "series": [], "theatres": [], "people": [], "users": []})

    def test_regex_characters_in_query_are_escaped(self):
        payload = self.search("jailer%20(")
        self.assertEqual(payload["movies"], [])

    def test_group_limit_is_five(self):
        many = [{"_id": f"x{i}", "title": f"Hero {i}", "year": 2020} for i in range(7)]
        with patch.object(search_module, "db", FakeDb(movies=many)):
            payload = self.search("hero")
        self.assertEqual(len(payload["movies"]), 5)


if __name__ == "__main__":
    unittest.main()
