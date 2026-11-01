import re
import unittest
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import patch

from bson import ObjectId
from flask import Flask

from routes import theaters


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class MemoryTheaters:
    def __init__(self):
        self.documents = []

    def find_one(self, query):
        for document in self.documents:
            matches = True
            for field, expected in query.items():
                value = document.get(field)
                if isinstance(expected, dict) and '$regex' in expected:
                    flags = re.I if expected.get('$options') == 'i' else 0
                    if not isinstance(value, str) or not re.match(expected['$regex'], value, flags):
                        matches = False
                        break
                elif value != expected:
                    matches = False
                    break
            if matches:
                return deepcopy(document)
        return None

    def insert_one(self, document):
        saved = deepcopy(document)
        saved.setdefault('_id', ObjectId())
        self.documents.append(saved)
        return InsertResult(saved['_id'])


class TheaterJsonImportTests(unittest.TestCase):
    def setUp(self):
        self.database = SimpleNamespace(theaters=MemoryTheaters())
        self.original_db = theaters.db
        theaters.db = self.database
        app = Flask(__name__)
        app.register_blueprint(theaters.theaters_bp, url_prefix='/api/theaters')
        self.client = app.test_client()

    def tearDown(self):
        theaters.db = self.original_db

    @staticmethod
    def entries():
        return [{
            'externalRef': 'sf-theaters-20261031-amc-metreon-16',
            'name': 'AMC Metreon 16',
            'location': 'San Francisco',
            'gmapsLink': 'https://www.google.com/maps/search/?api=1&query=AMC+Metreon+16',
            'website': 'https://www.amctheatres.com/movie-theatres/san-francisco/amc-metreon-16',
            'ticketPlatforms': [{'name': 'www.amctheatres.com', 'url': 'https://www.amctheatres.com/movie-theatres/san-francisco/amc-metreon-16'}],
            'notes': '16 screens; IMAX and Dolby Cinema.',
        }]

    def post(self, payload):
        return self.client.post('/api/theaters/import', headers={'Authorization': 'Bearer admin-token'}, json=payload)

    def test_import_requires_admin(self):
        response = self.client.post('/api/theaters/import', json={'theaters': self.entries()})
        self.assertEqual(response.status_code, 401)

    @patch('routes.theaters.is_admin', return_value=False)
    def test_import_rejects_non_admin(self, _is_admin):
        response = self.post({'theaters': self.entries()})
        self.assertEqual(response.status_code, 403)

    @patch('routes.theaters.is_admin', return_value=True)
    def test_import_preserves_structured_theater_details(self, _is_admin):
        response = self.post({'theaters': self.entries()})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()['created']), 1)
        saved = self.database.theaters.documents[0]
        self.assertEqual(saved['externalRef'], 'sf-theaters-20261031-amc-metreon-16')
        self.assertEqual(saved['website'], self.entries()[0]['website'])
        self.assertEqual(saved['ticketPlatforms'][0]['name'], 'www.amctheatres.com')
        self.assertEqual(saved['notes'], '16 screens; IMAX and Dolby Cinema.')

    @patch('routes.theaters.is_admin', return_value=True)
    def test_import_validates_every_row_before_writing(self, _is_admin):
        invalid = self.entries() + [{'name': 'Missing location'}]
        response = self.post({'theaters': invalid})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['invalid'][0]['index'], 2)
        self.assertEqual(self.database.theaters.documents, [])

    @patch('routes.theaters.is_admin', return_value=True)
    def test_import_skips_existing_name_and_location(self, _is_admin):
        self.database.theaters.insert_one({'name': 'AMC Metreon 16', 'location': 'San Francisco'})
        response = self.post({'theaters': self.entries()})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['created'], [])
        self.assertEqual(response.get_json()['skipped'][0]['reason'], 'Already exists')


if __name__ == '__main__':
    unittest.main()
