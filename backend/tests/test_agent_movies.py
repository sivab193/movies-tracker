import hashlib
import unittest
from copy import deepcopy

from bson import ObjectId
from flask import Flask
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from routes import agent_movies
from routes import movies
from routes import theaters


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count


class MemoryCursor(list):
    def sort(self, field, direction):
        reverse = direction < 0
        return MemoryCursor(sorted(self, key=lambda document: document.get(field), reverse=reverse))

    def limit(self, count):
        return MemoryCursor(self[:count])


class MemoryCollection:
    def __init__(self):
        self.documents = []

    def create_index(self, *args, **kwargs):
        return None

    def _matches(self, document, query):
        for field, expected in query.items():
            if field == '$or':
                if not any(self._matches(document, part) for part in expected):
                    return False
                continue
            actual = document.get(field)
            if isinstance(expected, dict) and '$regex' in expected:
                import re
                if not isinstance(actual, str) or not re.match(expected['$regex'], actual, re.I if expected.get('$options') == 'i' else 0):
                    return False
            elif isinstance(expected, dict) and '$gte' in expected:
                if actual is None or actual < expected['$gte']:
                    return False
            elif isinstance(expected, dict) and '$lt' in expected:
                if actual is None or actual >= expected['$lt']:
                    return False
            elif actual != expected:
                return False
        return True

    def find_one(self, query):
        document = next((item for item in self.documents if self._matches(item, query)), None)
        return deepcopy(document) if document else None

    def find(self, query):
        return MemoryCursor([deepcopy(item) for item in self.documents if self._matches(item, query)])

    def insert_one(self, document):
        if any(item.get('_id') == document.get('_id') for item in self.documents):
            raise DuplicateKeyError('duplicate _id')
        saved = deepcopy(document)
        saved.setdefault('_id', ObjectId())
        self.documents.append(saved)
        return InsertResult(saved['_id'])

    def update_one(self, query, update, upsert=False):
        target = next((item for item in self.documents if self._matches(item, query)), None)
        if target is None and upsert:
            target = {key: value for key, value in query.items() if not key.startswith('$')}
            self.documents.append(target)
        if target is None:
            return UpdateResult(0)
        for key, value in update.get('$setOnInsert', {}).items():
            target.setdefault(key, value)
        for key, value in update.get('$set', {}).items():
            target[key] = value
        for key, value in update.get('$inc', {}).items():
            target[key] = target.get(key, 0) + value
        for key, value in update.get('$push', {}).items():
            target.setdefault(key, []).append(value)
        return UpdateResult(1)

    def find_one_and_update(self, query, update, upsert=False, return_document=None):
        self.update_one(query, update, upsert=upsert)
        return self.find_one(query)


class MemoryDatabase:
    def __init__(self, key):
        self.movies = MemoryCollection()
        self.theaters = MemoryCollection()
        self.agent_movie_refs = MemoryCollection()
        self.agent_theater_refs = MemoryCollection()
        self.agent_theater_delete_suggestions = MemoryCollection()
        self.agent_api_rate_limits = MemoryCollection()
        self.agent_api_config = MemoryCollection()
        self.agent_api_call_logs = MemoryCollection()
        self.short_urls = MemoryCollection()
        self.agent_api_config.insert_one({
            '_id': 'muse',
            'keyHashes': [hashlib.sha256(key.encode('utf-8')).hexdigest()],
        })


class AgentMoviesApiTest(unittest.TestCase):
    key = 'test-agent-key'

    def setUp(self):
        self.database = MemoryDatabase(self.key)
        self.original_db = agent_movies.db
        self.original_movies_db = movies.db
        self.original_theaters_db = theaters.db
        self.original_is_admin = agent_movies.is_admin
        self.original_cache = agent_movies.save_poster_to_db
        agent_movies.db = self.database
        movies.db = self.database
        theaters.db = self.database
        agent_movies.is_admin = lambda token: token == 'admin-token'
        self.cached_urls = []
        agent_movies.save_poster_to_db = self.cache_poster
        app = Flask(__name__)
        app.register_blueprint(agent_movies.agent_movies_bp, url_prefix='/api/agent')
        app.register_blueprint(agent_movies.agent_admin_bp, url_prefix='/api/agent')
        app.register_blueprint(movies.movies_bp, url_prefix='/api/movies')
        self.client = app.test_client()

    def tearDown(self):
        agent_movies.db = self.original_db
        movies.db = self.original_movies_db
        theaters.db = self.original_theaters_db
        agent_movies.is_admin = self.original_is_admin
        agent_movies.save_poster_to_db = self.original_cache

    def cache_poster(self, movie_id, source_url):
        self.cached_urls.append((movie_id, source_url))
        return f'/api/movies/{movie_id}/poster'

    def headers(self):
        return {'X-MediaVerse-Agent-Key': self.key}

    def body(self):
        return {
            'externalRef': 'anniv-2026-10-10',
            'tmdbId': 24,
            'title': 'Kill Bill: Vol. 1',
            'language': 'English',
            'releaseDate': '2003-10-10',
            'runtimeMins': 110,
            'slug': 'kill-bill-vol-1-2003',
            'posterUrl': 'https://8.8.8.8/kill-bill.jpg',
            'streamingLinks': [{'platform': 'Netflix'}],
        }

    def test_upsert_retry_lookup_and_cached_poster(self):
        first = self.client.post('/api/agent/movies/upsert', headers=self.headers(), json=self.body())
        self.assertEqual(first.status_code, 200)
        first_data = first.get_json()
        self.assertTrue(first_data['created'])
        self.assertEqual(first_data['pageUrl'], 'https://www.media-verse.in/m/kill-bill-vol-1-2003')
        self.assertEqual(len(self.database.movies.documents), 1)
        self.assertEqual(len(self.cached_urls), 1)
        self.assertEqual(self.database.movies.documents[0]['posterUrl'], f"/api/movies/{first_data['id']}/poster")
        self.assertEqual(self.database.movies.documents[0]['watchProviders'][0]['url'], '')
        first_log = self.database.agent_api_call_logs.documents[0]
        self.assertEqual(first_log['endpoint'], '/api/agent/movies/upsert')
        self.assertEqual(first_log['externalRef'], 'anniv-2026-10-10')
        self.assertNotIn(self.key, str(first_log))

        permanent_link = self.client.get('/api/movies/m/kill-bill-vol-1-2003')
        self.assertEqual(permanent_link.status_code, 200)
        self.assertEqual(permanent_link.get_json()['movieId'], first_data['id'])
        self.assertTrue(permanent_link.get_json()['permanent'])

        retry_body = self.body()
        retry_body['synopsis'] = 'A spoiler-free revenge story.'
        retry = self.client.post('/api/agent/movies/upsert', headers=self.headers(), json=retry_body)
        self.assertEqual(retry.status_code, 200)
        self.assertFalse(retry.get_json()['created'])
        self.assertEqual(retry.get_json()['pageUrl'], first_data['pageUrl'])
        self.assertEqual(len(self.database.movies.documents), 1)
        self.assertEqual(self.database.movies.documents[0]['plot'], 'A spoiler-free revenge story.')

        lookup = self.client.get('/api/agent/movies?title=Kill%20Bill%3A%20Vol.%201&releaseDate=2003-10-10', headers=self.headers())
        self.assertEqual(lookup.status_code, 200)
        self.assertEqual(lookup.get_json()['pageUrl'], first_data['pageUrl'])

        activity = self.client.get('/api/agent/admin/activity?days=7', headers={'Authorization': 'Bearer admin-token'})
        self.assertEqual(activity.status_code, 200)
        self.assertGreaterEqual(activity.get_json()['summary']['displayedCalls'], 3)
        self.assertNotIn('key', activity.get_json()['calls'][0])

    def test_rejects_invalid_key_and_date(self):
        self.assertEqual(self.client.post('/api/agent/movies/upsert', json=self.body()).status_code, 401)
        invalid = self.body()
        invalid['releaseDate'] = '10-10-2003'
        response = self.client.post('/api/agent/movies/upsert', headers=self.headers(), json=invalid)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['field'], 'releaseDate')

    def test_admin_can_generate_a_one_time_key_without_listing_its_secret(self):
        headers = {'Authorization': 'Bearer admin-token'}
        created = self.client.post('/api/agent/admin/keys', headers=headers, json={'label': 'Muse vault'})
        self.assertEqual(created.status_code, 201)
        raw_key = created.get_json()['key']
        self.assertTrue(raw_key.startswith('mv_muse_'))
        self.assertNotIn(raw_key, str(self.database.agent_api_config.documents))

        listed = self.client.get('/api/agent/admin/keys', headers=headers)
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.get_json()['keys'][0]['label'], 'Muse vault')
        self.assertNotIn('key', listed.get_json()['keys'][0])

        request_body = self.body()
        request_body['externalRef'] = 'anniv-2026-10-11'
        response = self.client.post('/api/agent/movies/upsert', headers={'X-MediaVerse-Agent-Key': raw_key}, json=request_body)
        self.assertEqual(response.status_code, 200)

    def test_upserts_theater_specs_and_only_suggests_deletion(self):
        theater_body = {
            'externalRef': 'theater-2026-10-10',
            'name': 'MediaVerse Cinema',
            'location': 'Bloomington, Indiana',
            'gmapsLink': 'https://8.8.8.8/maps',
            'amenities': ['Parking', 'Recliners'],
            'screens': [{
                'name': 'Auditorium 1', 'format': 'IMAX', 'sound': 'Dolby Atmos', 'seating': 'Recliner', 'capacity': 180,
            }],
        }
        created = self.client.post('/api/agent/theaters/upsert', headers=self.headers(), json=theater_body)
        self.assertEqual(created.status_code, 200)
        created_data = created.get_json()
        self.assertTrue(created_data['created'])
        self.assertEqual(len(self.database.theaters.documents), 1)
        theater = self.database.theaters.documents[0]
        self.assertFalse(theater['verified'])
        self.assertEqual(theater['screens'][0]['format'], 'IMAX')

        retry = dict(theater_body)
        retry.pop('amenities')
        retry.pop('screens')
        retry['gmapsLink'] = 'https://8.8.8.8/new-maps'
        updated = self.client.post('/api/agent/theaters/upsert', headers=self.headers(), json=retry)
        self.assertEqual(updated.status_code, 200)
        self.assertFalse(updated.get_json()['created'])
        self.assertEqual(len(self.database.theaters.documents), 1)
        self.assertEqual(self.database.theaters.documents[0]['screens'][0]['capacity'], 180)

        lookup = self.client.get('/api/agent/theaters?name=MediaVerse%20Cinema&location=Bloomington', headers=self.headers())
        self.assertEqual(lookup.status_code, 200)
        self.assertEqual(lookup.get_json()['id'], created_data['id'])

        suggestion = self.client.post('/api/agent/theaters/delete-suggestions', headers=self.headers(), json={
            'externalRef': 'delete-suggest-2026-10-10', 'theaterId': created_data['id'], 'reason': 'Venue has permanently closed.',
        })
        self.assertEqual(suggestion.status_code, 201)
        self.assertEqual(suggestion.get_json()['status'], 'pending')
        self.assertEqual(len(self.database.theaters.documents), 1)
        self.assertEqual(len(self.database.agent_theater_delete_suggestions.documents), 1)


if __name__ == '__main__':
    unittest.main()
