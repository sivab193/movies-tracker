import hashlib
import unittest
from copy import deepcopy

from bson import ObjectId
from flask import Flask
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from routes import agent_movies
from routes import movies


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count


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
            elif actual != expected:
                return False
        return True

    def find_one(self, query):
        document = next((item for item in self.documents if self._matches(item, query)), None)
        return deepcopy(document) if document else None

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
        self.agent_movie_refs = MemoryCollection()
        self.agent_api_rate_limits = MemoryCollection()
        self.agent_api_config = MemoryCollection()
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
        self.original_is_admin = agent_movies.is_admin
        self.original_cache = agent_movies.save_poster_to_db
        agent_movies.db = self.database
        movies.db = self.database
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


if __name__ == '__main__':
    unittest.main()
