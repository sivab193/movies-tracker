from flask import Blueprint, jsonify
from mongo_config import db
import re
import unicodedata

people_bp = Blueprint('people', __name__)


def person_slug(name):
    """Stable URL key for a credit name supplied by OMDb."""
    normalized = unicodedata.normalize('NFKD', str(name or ''))
    ascii_name = normalized.encode('ascii', 'ignore').decode('ascii').lower()
    return re.sub(r'[^a-z0-9]+', '-', ascii_name).strip('-')


def credit_names(item, array_field, string_field):
    names = item.get(array_field)
    if isinstance(names, list):
        return [name.strip() for name in names if isinstance(name, str) and name.strip()]
    value = item.get(string_field)
    if not isinstance(value, str) or value.strip() in ('', 'N/A'):
        return []
    return [name.strip() for name in value.split(',') if name.strip()]


def catalog_item(item, item_type, roles):
    return {
        'id': str(item['_id']),
        'imdbId': item.get('imdbId'),
        'type': item_type,
        'title': item.get('title') or 'Untitled',
        'year': item.get('year'),
        'endYear': item.get('endYear'),
        'posterUrl': item.get('posterUrl'),
        'runtime': item.get('runtime'),
        'totalSeasons': item.get('totalSeasons'),
        'roles': sorted(roles),
    }


@people_bp.route('/<slug>', methods=['GET'])
def get_person(slug):
    """Return the catalog filmography for an actor or director name slug."""
    if db is None:
        return jsonify({'error': 'Database not connected'}), 500
    requested_slug = person_slug(slug)
    if not requested_slug:
        return jsonify({'error': 'Person not found'}), 404

    credits = []
    canonical_names = set()

    for item in db.movies.find({}, {
        'imdbId': 1, 'title': 1, 'year': 1, 'posterUrl': 1, 'runtime': 1,
        'actors': 1, 'directors': 1, 'Actors': 1, 'Director': 1, 'director': 1,
    }):
        roles = set()
        actor_names = credit_names(item, 'actors', 'Actors') or credit_names(item, 'actors', 'actors')
        for name in actor_names:
            if person_slug(name) == requested_slug:
                roles.add('actor')
                canonical_names.add(name)
        for name in credit_names(item, 'directors', 'Director') or credit_names(item, 'directors', 'director'):
            if person_slug(name) == requested_slug:
                roles.add('director')
                canonical_names.add(name)
        if roles:
            credits.append(catalog_item(item, 'movie', roles))

    for item in db.series.find({}, {
        'imdbId': 1, 'title': 1, 'year': 1, 'endYear': 1, 'posterUrl': 1,
        'totalSeasons': 1, 'actors': 1, 'directors': 1, 'director': 1,
    }):
        roles = set()
        for name in credit_names(item, 'actors', 'actors'):
            if person_slug(name) == requested_slug:
                roles.add('actor')
                canonical_names.add(name)
        for name in credit_names(item, 'directors', 'director'):
            if person_slug(name) == requested_slug:
                roles.add('director')
                canonical_names.add(name)
        if roles:
            credits.append(catalog_item(item, 'series', roles))

    if not credits:
        return jsonify({'error': 'Person not found'}), 404

    credits.sort(key=lambda item: (item.get('year') or 0, item['title'].lower()), reverse=True)
    return jsonify({
        'slug': requested_slug,
        'name': sorted(canonical_names, key=lambda name: (len(name), name))[0],
        'credits': credits,
        'movieCount': sum(credit['type'] == 'movie' for credit in credits),
        'seriesCount': sum(credit['type'] == 'series' for credit in credits),
    })
