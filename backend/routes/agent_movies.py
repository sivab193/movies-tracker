"""Key-authenticated movie upserts for the Muse automation.

This route deliberately uses the same catalog and poster cache as the public
movie API.  It does not accept Firebase user tokens and exposes no delete or
user-management capability.
"""

import datetime
import hashlib
import hmac
import ipaddress
import os
import re
import secrets
import socket
import time
from urllib.parse import urlparse

from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from flask import Blueprint, g, jsonify, request

from mongo_config import db
from routes.movies import is_admin, save_poster_to_db
from routes.theaters import normalize_theater_details, normalize_theater_location


agent_movies_bp = Blueprint('agent_movies', __name__)
agent_admin_bp = Blueprint('agent_admin', __name__)

AGENT_CONFIG_ID = 'muse'
AGENT_KEY_HEADER = 'X-MediaVerse-Agent-Key'
MAX_TEXT_LENGTH = 1_000
ALLOWED_LANGUAGES = {'Tamil', 'Hindi', 'Malayalam', 'English'}
EXTERNAL_REF_PATTERN = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$')
SLUG_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


if db is not None:
    try:
        # The external-ref collection gives one idempotency key one canonical
        # movie, without preventing later anniversary refs from pointing to it.
        db.agent_movie_refs.create_index('movieId')
        db.agent_theater_refs.create_index('theaterId')
        db.agent_theater_delete_suggestions.create_index([('status', 1), ('createdAt', -1)])
        db.agent_api_call_logs.create_index('expiresAt', expireAfterSeconds=0)
        db.agent_api_call_logs.create_index([('createdAt', -1)])
        db.movies.create_index('agentSlug', unique=True, sparse=True)
    except Exception as error:
        # Startup must not take the public API down when an index already exists.
        print(f'Index creation error for agent movie support collections: {error}')


def _error(message, field=None, status=400):
    body = {'error': message}
    if field:
        body['field'] = field
    return jsonify(body), status


def _non_empty_string(value, field, max_length=MAX_TEXT_LENGTH):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(field)
    value = value.strip()
    if len(value) > max_length:
        raise ValueError(field)
    return value


def _validate_external_ref(value):
    value = _non_empty_string(value, 'externalRef', 128)
    if not EXTERNAL_REF_PATTERN.fullmatch(value):
        raise ValueError('externalRef')
    return value


def _validate_public_url(value, field):
    value = _non_empty_string(value, field, 2_000)
    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        raise ValueError(field)
    if parsed.username or parsed.password or not parsed.hostname:
        raise ValueError(field)
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(parsed.hostname, None)}
        if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
            raise ValueError(field)
    except (OSError, ValueError):
        raise ValueError(field)
    return value


def _validate_request(data):
    if not isinstance(data, dict):
        return None, ('invalid_json', None)

    try:
        external_ref = _validate_external_ref(data.get('externalRef'))

        title = _non_empty_string(data.get('title'), 'title', 300)
        language = _non_empty_string(data.get('language'), 'language', 32)
        if language not in ALLOWED_LANGUAGES:
            raise ValueError('language')

        release_date = _non_empty_string(data.get('releaseDate'), 'releaseDate', 10)
        try:
            datetime.datetime.strptime(release_date, '%Y-%m-%d')
        except ValueError:
            raise ValueError('releaseDate')

        normalized = {
            'externalRef': external_ref,
            'title': title,
            'language': language,
            'releaseDate': release_date,
        }

        if 'slug' in data and data['slug'] is not None:
            slug = _non_empty_string(data['slug'], 'slug', 100).lower()
            if not SLUG_PATTERN.fullmatch(slug):
                raise ValueError('slug')
            normalized['slug'] = slug

        if 'tmdbId' in data and data['tmdbId'] is not None:
            if isinstance(data['tmdbId'], bool) or not isinstance(data['tmdbId'], int) or data['tmdbId'] <= 0:
                raise ValueError('tmdbId')
            normalized['tmdbId'] = data['tmdbId']

        if 'runtimeMins' in data and data['runtimeMins'] is not None:
            if isinstance(data['runtimeMins'], bool) or not isinstance(data['runtimeMins'], int) or not 1 <= data['runtimeMins'] <= 1_440:
                raise ValueError('runtimeMins')
            normalized['runtimeMins'] = data['runtimeMins']

        for field, max_length in (('director', 300), ('synopsis', 2_000), ('titleCardTiming', 80)):
            if field in data and data[field] is not None:
                normalized[field] = _non_empty_string(data[field], field, max_length)

        if 'cast' in data and data['cast'] is not None:
            if not isinstance(data['cast'], list) or len(data['cast']) > 50:
                raise ValueError('cast')
            normalized['cast'] = [_non_empty_string(name, 'cast', 200) for name in data['cast']]

        if 'posterUrl' in data and data['posterUrl'] is not None:
            normalized['posterUrl'] = _validate_public_url(data['posterUrl'], 'posterUrl')

        if 'streamingLinks' in data and data['streamingLinks'] is not None:
            if not isinstance(data['streamingLinks'], list) or len(data['streamingLinks']) > 25:
                raise ValueError('streamingLinks')
            links = []
            for link in data['streamingLinks']:
                if not isinstance(link, dict):
                    raise ValueError('streamingLinks')
                platform = _non_empty_string(link.get('platform'), 'streamingLinks', 80)
                item = {'platform': platform}
                if link.get('url') is not None:
                    item['url'] = _validate_public_url(link['url'], 'streamingLinks')
                links.append(item)
            normalized['streamingLinks'] = links
    except ValueError as error:
        return None, ('invalid_field', str(error))

    return normalized, None


def _configured_key_hashes():
    """Read every active key hash without ever returning or logging a key."""
    hashes = set()

    # This provides a simple initial setup path. Production rotation should use
    # the config document below, so it does not need a deployment.
    for key in os.environ.get('MEDIA_VERSE_AGENT_KEY', '').split(','):
        key = key.strip()
        if key:
            hashes.add(hashlib.sha256(key.encode('utf-8')).hexdigest())

    if db is not None:
        config = db.agent_api_config.find_one({'_id': AGENT_CONFIG_ID}) or {}
        for key_hash in config.get('keyHashes', []):
            if isinstance(key_hash, str) and re.fullmatch(r'[a-fA-F0-9]{64}', key_hash):
                hashes.add(key_hash.lower())
        for key_record in config.get('keys', []):
            if not isinstance(key_record, dict):
                continue
            key_hash = key_record.get('hash')
            if key_record.get('active', True) and isinstance(key_hash, str) and re.fullmatch(r'[a-fA-F0-9]{64}', key_hash):
                hashes.add(key_hash.lower())
    return hashes


def _authenticate_agent():
    key = request.headers.get(AGENT_KEY_HEADER, '')
    if not key:
        return None
    candidate = hashlib.sha256(key.encode('utf-8')).hexdigest()
    valid_hashes = _configured_key_hashes()
    if not valid_hashes:
        return None
    return candidate if any(hmac.compare_digest(candidate, item) for item in valid_hashes) else None


def _agent_key_metadata(key_hash):
    config = db.agent_api_config.find_one({'_id': AGENT_CONFIG_ID}) or {}
    for record in config.get('keys', []):
        if isinstance(record, dict) and isinstance(record.get('hash'), str) and hmac.compare_digest(key_hash, record['hash'].lower()):
            return {'keyId': record.get('id'), 'keyLabel': record.get('label') or 'Muse key', 'keyLastFour': record.get('lastFour')}
    # Environment-provisioned keys are supported for first-time setup but have
    # no persisted label. Keep their identifying material out of the log.
    return {'keyId': None, 'keyLabel': 'Environment key', 'keyLastFour': None}


def _movie_response(movie, created):
    movie_id = str(movie['_id'])
    slug = movie.get('agentSlug') or _slug_for_movie(movie.get('title', ''), movie.get('releaseDate', ''))
    site_origin = os.environ.get('MEDIA_VERSE_PUBLIC_ORIGIN', 'https://www.media-verse.in').rstrip('/')
    return {
        'id': movie_id,
        'slug': slug,
        # Muse slugs are permanent. UI-created six-character links remain a
        # separate, expiring namespace that the resolver handles as a fallback.
        'pageUrl': f'{site_origin}/m/{slug}',
        'created': created,
    }


def _slug_for_movie(title, release_date):
    title_slug = re.sub(r'[^a-z0-9]+', '-', str(title).lower()).strip('-') or 'movie'
    year = str(release_date)[:4]
    return f'{title_slug}-{year}' if year.isdigit() else title_slug


def _slug_is_available(slug, movie_id=None):
    existing = db.movies.find_one({'agentSlug': slug})
    if existing and existing.get('_id') != movie_id:
        return False
    # Do not steal a currently valid UI-created short link. Expired entries can
    # safely be superseded by a permanent Muse link.
    short_link = db.short_urls.find_one({
        'code': slug,
        'expiresAt': {'$gt': datetime.datetime.now(datetime.timezone.utc)},
    })
    return not short_link


def _choose_agent_slug(payload, movie):
    if 'slug' in payload:
        slug = payload['slug']
        if not _slug_is_available(slug, movie.get('_id') if movie else None):
            raise ValueError('slug_conflict')
        return slug

    if movie and movie.get('agentSlug'):
        return movie['agentSlug']

    base_slug = _slug_for_movie(payload['title'], payload['releaseDate'])
    if _slug_is_available(base_slug):
        return base_slug

    # Collision-free, deterministic fallback for another movie with the same
    # title and year. Its external ref is already safe for use in a URL suffix.
    return f"{base_slug}-{hashlib.sha256(payload['externalRef'].encode('utf-8')).hexdigest()[:8]}"


def _find_movie_for_request(payload):
    ref = db.agent_movie_refs.find_one({'_id': payload['externalRef']})
    if ref and isinstance(ref.get('movieId'), ObjectId):
        movie = db.movies.find_one({'_id': ref['movieId']})
        if movie:
            return movie

    if 'tmdbId' in payload:
        movie = db.movies.find_one({'$or': [{'tmdbId': payload['tmdbId']}, {'agentTmdbId': payload['tmdbId']}]})
        if movie:
            return movie

    title_key = payload['title'].casefold().strip()
    return db.movies.find_one({
        '$or': [
            {'agentTitleKey': title_key, 'releaseDate': payload['releaseDate']},
            {'title': {'$regex': f'^{re.escape(payload["title"])}$', '$options': 'i'}, 'releaseDate': payload['releaseDate']},
        ]
    })


def _movie_updates(payload, slug):
    updates = {
        'title': payload['title'],
        'agentTitleKey': payload['title'].casefold().strip(),
        'agentSlug': slug,
        'language': payload['language'],
        'Language': payload['language'],
        'releaseDate': payload['releaseDate'],
        'released': payload['releaseDate'],
        'year': int(payload['releaseDate'][:4]),
        'updatedAt': datetime.datetime.now(datetime.timezone.utc),
        'lastUpdatedBy': 'muse-agent',
        'agentUpdatedAt': datetime.datetime.now(datetime.timezone.utc),
    }
    if 'tmdbId' in payload:
        updates['tmdbId'] = payload['tmdbId']
    if 'runtimeMins' in payload:
        updates['runtime'] = f"{payload['runtimeMins']} min"
    if 'director' in payload:
        updates['director'] = payload['director']
        updates['directors'] = [part.strip() for part in payload['director'].split(',') if part.strip()]
    if 'cast' in payload:
        updates['actors'] = payload['cast']
    if 'synopsis' in payload:
        updates['plot'] = payload['synopsis']
    if 'titleCardTiming' in payload:
        updates['titleCardTiming'] = payload['titleCardTiming']
    if 'streamingLinks' in payload:
        updates['watchProviders'] = [
            {'name': link['platform'], 'url': link.get('url', ''), 'regions': []}
            for link in payload['streamingLinks']
        ]
    return updates


def _validate_theater_upsert(data):
    if not isinstance(data, dict):
        return None, ('invalid_json', None)
    try:
        if 'verified' in data:
            raise ValueError('verified')
        external_ref = _validate_external_ref(data.get('externalRef'))
        name = _non_empty_string(data.get('name'), 'name', 200)
        location = _non_empty_string(data.get('location'), 'location', 200)
        normalized_location = {'name': name, 'location': location}
        normalize_theater_location(normalized_location)
        payload = {
            'externalRef': external_ref,
            'name': normalized_location['name'],
            'location': normalized_location['location'],
        }

        if 'gmapsLink' in data and data['gmapsLink'] is not None:
            payload['gmapsLink'] = _validate_public_url(data['gmapsLink'], 'gmapsLink')

        details_input = {}
        for field in ('openedYear', 'renovatedYear', 'notes', 'website', 'amenities', 'ticketPlatforms', 'screens'):
            if field in data:
                details_input[field] = data[field]
        if isinstance(details_input.get('screens'), list) and any(isinstance(screen, dict) and 'verified' in screen for screen in details_input['screens']):
            raise ValueError('screens')
        if details_input.get('website') not in (None, ''):
            details_input['website'] = _validate_public_url(details_input['website'], 'website')
        if isinstance(details_input.get('ticketPlatforms'), list):
            for platform in details_input['ticketPlatforms']:
                if isinstance(platform, dict) and platform.get('url'):
                    platform['url'] = _validate_public_url(platform['url'], 'ticketPlatforms')
        payload['details'] = normalize_theater_details(details_input)
    except ValueError as error:
        return None, ('invalid_field', str(error).split(' ', 1)[0])
    return payload, None


def _theater_response(theater, created=False):
    theater_id = str(theater['_id'])
    site_origin = os.environ.get('MEDIA_VERSE_PUBLIC_ORIGIN', 'https://www.media-verse.in').rstrip('/')
    return {
        'id': theater_id,
        'name': theater.get('name'),
        'location': theater.get('location'),
        'pageUrl': f'{site_origin}/theaters/{theater_id}',
        'created': created,
    }


def _find_theater_for_request(payload):
    ref = db.agent_theater_refs.find_one({'_id': payload['externalRef']})
    if ref and isinstance(ref.get('theaterId'), ObjectId):
        theater = db.theaters.find_one({'_id': ref['theaterId']})
        if theater:
            return theater
    return db.theaters.find_one({
        'name': {'$regex': f'^{re.escape(payload["name"])}$', '$options': 'i'},
        'location': {'$regex': f'^{re.escape(payload["location"])}$', '$options': 'i'},
    })


def _validate_delete_suggestion(data):
    if not isinstance(data, dict):
        return None, ('invalid_json', None)
    try:
        payload = {
            'externalRef': _validate_external_ref(data.get('externalRef')),
            'reason': _non_empty_string(data.get('reason'), 'reason', 1_000),
        }
        if 'theaterId' in data and data['theaterId'] is not None:
            if not isinstance(data['theaterId'], str) or not ObjectId.is_valid(data['theaterId']):
                raise ValueError('theaterId')
            payload['theaterId'] = ObjectId(data['theaterId'])
        else:
            name = _non_empty_string(data.get('name'), 'name', 200)
            location = _non_empty_string(data.get('location'), 'location', 200)
            location_data = {'name': name, 'location': location}
            normalize_theater_location(location_data)
            payload['name'] = location_data['name']
            payload['location'] = location_data['location']
        if data.get('evidenceUrl') is not None:
            payload['evidenceUrl'] = _validate_public_url(data['evidenceUrl'], 'evidenceUrl')
    except ValueError as error:
        return None, ('invalid_field', str(error))
    return payload, None


def _require_admin():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer ') or not is_admin(auth_header.split(' ', 1)[1]):
        return _error('forbidden', status=403)
    if db is None:
        return _error('internal', status=500)
    return None


def _public_key_record(record):
    return {
        'id': record.get('id'),
        'label': record.get('label') or 'Muse key',
        'active': record.get('active', True),
        'createdAt': record.get('createdAt').isoformat() if hasattr(record.get('createdAt'), 'isoformat') else record.get('createdAt'),
        'retiredAt': record.get('retiredAt').isoformat() if hasattr(record.get('retiredAt'), 'isoformat') else record.get('retiredAt'),
        'lastFour': record.get('lastFour'),
    }


@agent_admin_bp.route('/admin/keys', methods=['GET'])
def list_agent_keys():
    denied = _require_admin()
    if denied:
        return denied
    config = db.agent_api_config.find_one({'_id': AGENT_CONFIG_ID}) or {}
    keys = [_public_key_record(record) for record in config.get('keys', []) if isinstance(record, dict)]
    return jsonify({'keys': keys})


@agent_admin_bp.route('/admin/keys', methods=['POST'])
def create_agent_key():
    denied = _require_admin()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    label = str(data.get('label') or 'Muse primary').strip()
    if not label or len(label) > 80:
        return _error('invalid_field', field='label')

    raw_key = f'mv_muse_{secrets.token_urlsafe(32)}'
    now = datetime.datetime.now(datetime.timezone.utc)
    record = {
        'id': secrets.token_urlsafe(12),
        'label': label,
        'hash': hashlib.sha256(raw_key.encode('utf-8')).hexdigest(),
        'lastFour': raw_key[-4:],
        'active': True,
        'createdAt': now,
        'retiredAt': None,
    }
    db.agent_api_config.update_one(
        {'_id': AGENT_CONFIG_ID},
        {'$push': {'keys': record}, '$set': {'updatedAt': now}},
        upsert=True,
    )
    # The raw key exists only in this response. Never return it from list or
    # write it to the config collection, application logs, or audit metadata.
    return jsonify({'key': raw_key, 'record': _public_key_record(record)}), 201


@agent_admin_bp.route('/admin/keys/<key_id>', methods=['PUT'])
def update_agent_key(key_id):
    denied = _require_admin()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    if not isinstance(data.get('active'), bool):
        return _error('invalid_field', field='active')

    config = db.agent_api_config.find_one({'_id': AGENT_CONFIG_ID}) or {}
    keys = config.get('keys', [])
    matched = False
    now = datetime.datetime.now(datetime.timezone.utc)
    for record in keys:
        if isinstance(record, dict) and hmac.compare_digest(str(record.get('id', '')), key_id):
            record['active'] = data['active']
            record['retiredAt'] = None if data['active'] else now
            matched = True
            break
    if not matched:
        return _error('not_found', status=404)
    db.agent_api_config.update_one({'_id': AGENT_CONFIG_ID}, {'$set': {'keys': keys, 'updatedAt': now}})
    return jsonify({'message': 'key_updated'})


def _public_theater_delete_suggestion(suggestion):
    return {
        'id': str(suggestion['_id']),
        'theaterId': str(suggestion['theaterId']),
        'theaterName': suggestion.get('theaterName'),
        'theaterLocation': suggestion.get('theaterLocation'),
        'reason': suggestion.get('reason'),
        'evidenceUrl': suggestion.get('evidenceUrl'),
        'status': suggestion.get('status', 'pending'),
        'createdAt': suggestion.get('createdAt').isoformat() if hasattr(suggestion.get('createdAt'), 'isoformat') else suggestion.get('createdAt'),
        'reviewedAt': suggestion.get('reviewedAt').isoformat() if hasattr(suggestion.get('reviewedAt'), 'isoformat') else suggestion.get('reviewedAt'),
    }


@agent_admin_bp.route('/admin/theater-delete-suggestions', methods=['GET'])
def list_theater_delete_suggestions():
    denied = _require_admin()
    if denied:
        return denied
    status = request.args.get('status', 'pending')
    if status not in {'pending', 'dismissed', 'all'}:
        return _error('invalid_field', field='status')
    query = {} if status == 'all' else {'status': status}
    suggestions = [
        _public_theater_delete_suggestion(suggestion)
        for suggestion in db.agent_theater_delete_suggestions.find(query).sort('createdAt', -1)
    ]
    return jsonify({'suggestions': suggestions})


@agent_admin_bp.route('/admin/theater-delete-suggestions/<suggestion_id>', methods=['PUT'])
def update_theater_delete_suggestion(suggestion_id):
    denied = _require_admin()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    if data.get('status') != 'dismissed':
        return _error('invalid_field', field='status')
    result = db.agent_theater_delete_suggestions.update_one(
        {'_id': suggestion_id, 'status': 'pending'},
        {'$set': {'status': 'dismissed', 'reviewedAt': datetime.datetime.now(datetime.timezone.utc)}},
    )
    if result.matched_count == 0:
        return _error('not_found', status=404)
    return jsonify({'message': 'suggestion_dismissed'})


@agent_admin_bp.route('/admin/activity', methods=['GET'])
def list_agent_activity():
    denied = _require_admin()
    if denied:
        return denied
    try:
        days = int(request.args.get('days', 30))
    except ValueError:
        return _error('invalid_field', field='days')
    try:
        limit = int(request.args.get('limit', 100))
    except ValueError:
        return _error('invalid_field', field='limit')
    if not 1 <= days <= 365:
        return _error('invalid_field', field='days')
    if not 1 <= limit <= 500:
        return _error('invalid_field', field='limit')

    now = datetime.datetime.now(datetime.timezone.utc)
    since = now - datetime.timedelta(days=days)
    logs = list(db.agent_api_call_logs.find({'createdAt': {'$gte': since}}).sort('createdAt', -1).limit(limit))
    calls = []
    endpoint_counts = {}
    successful = 0
    for log in logs:
        endpoint = log.get('endpoint', 'unknown')
        endpoint_counts[endpoint] = endpoint_counts.get(endpoint, 0) + 1
        if int(log.get('status', 500)) < 400:
            successful += 1
        calls.append({
            'createdAt': log.get('createdAt').isoformat() if hasattr(log.get('createdAt'), 'isoformat') else log.get('createdAt'),
            'endpoint': endpoint,
            'method': log.get('method'),
            'status': log.get('status'),
            'durationMs': log.get('durationMs'),
            'externalRef': log.get('externalRef'),
            'keyLabel': log.get('keyLabel'),
            'keyLastFour': log.get('keyLastFour'),
        })
    return jsonify({
        'calls': calls,
        'summary': {
            'displayedCalls': len(calls),
            'successfulCalls': successful,
            'failedCalls': len(calls) - successful,
            'endpointCounts': endpoint_counts,
            'days': days,
        },
    })


@agent_movies_bp.before_request
def require_agent_key():
    if db is None:
        return _error('internal', status=500)
    key_hash = _authenticate_agent()
    if not key_hash:
        return _error('unauthorized', status=401)
    g.muse_agent_key = _agent_key_metadata(key_hash)
    g.muse_agent_started_at = time.perf_counter()


@agent_movies_bp.after_request
def record_agent_api_call(response):
    """Store operational telemetry for authenticated Muse calls only.

    No request body, headers, key hashes, or raw keys are written here. The
    optional externalRef is useful for tracing idempotent automation retries.
    """
    if db is None or not hasattr(g, 'muse_agent_key'):
        return response
    try:
        payload = request.get_json(silent=True) if request.is_json else None
        external_ref = payload.get('externalRef') if isinstance(payload, dict) and isinstance(payload.get('externalRef'), str) else None
        now = datetime.datetime.now(datetime.timezone.utc)
        db.agent_api_call_logs.insert_one({
            'createdAt': now,
            'expiresAt': now + datetime.timedelta(days=365),
            'endpoint': request.path,
            'method': request.method,
            'status': response.status_code,
            'durationMs': round((time.perf_counter() - g.muse_agent_started_at) * 1000),
            'externalRef': external_ref,
            **g.muse_agent_key,
        })
    except Exception as error:
        # Audit failures must never turn a successful automation call into a
        # failure, and logs must not carry request secrets.
        print(f'Agent API audit log failed: {type(error).__name__}')
    return response


@agent_movies_bp.route('/movies/upsert', methods=['POST'])
def upsert_movie():
    payload, validation_error = _validate_request(request.get_json(silent=True))
    if validation_error:
        error, field = validation_error
        return _error(error, field=field)

    try:
        # Claim the idempotency key before inserting a movie. The ObjectId is
        # chosen up front, so a concurrent retry can only race for this same
        # document rather than create a second movie for one externalRef.
        ref = db.agent_movie_refs.find_one({'_id': payload['externalRef']})
        if ref and isinstance(ref.get('movieId'), ObjectId):
            candidate_id = ref['movieId']
        else:
            candidate_id = ObjectId()
            try:
                db.agent_movie_refs.insert_one({
                    '_id': payload['externalRef'],
                    'movieId': candidate_id,
                    'createdAt': datetime.datetime.now(datetime.timezone.utc),
                })
            except DuplicateKeyError:
                ref = db.agent_movie_refs.find_one({'_id': payload['externalRef']})
                candidate_id = ref.get('movieId') if ref else None
                if not isinstance(candidate_id, ObjectId):
                    return _error('internal', status=500)

        movie = db.movies.find_one({'_id': candidate_id})
        if movie is None:
            movie = _find_movie_for_request(payload)
        created = movie is None
        try:
            slug = _choose_agent_slug(payload, movie)
        except ValueError:
            return _error('slug_conflict', field='slug')
        updates = _movie_updates(payload, slug)
        if created:
            updates.update({
                '_id': candidate_id,
                'posterUrl': None,
                'submissionCount': 0,
                'averageTimeSeconds': None,
                'createdAt': datetime.datetime.now(datetime.timezone.utc),
                'agentSource': 'muse',
            })
            try:
                db.movies.insert_one(updates)
                movie = db.movies.find_one({'_id': candidate_id})
            except DuplicateKeyError:
                # A concurrent retry claimed the same candidate id first.
                movie = db.movies.find_one({'_id': candidate_id})
                if not movie:
                    return _error('internal', status=500)
                created = False
        else:
            db.movies.update_one({'_id': movie['_id']}, {'$set': updates})
            movie.update(updates)

        if movie['_id'] != candidate_id:
            # tmdbId/title dedupe found a pre-existing catalog document. Point
            # this anniversary ref at it for future retries and later lookups.
            db.agent_movie_refs.update_one(
                {'_id': payload['externalRef'], 'movieId': candidate_id},
                {'$set': {'movieId': movie['_id']}},
            )

        if 'posterUrl' in payload:
            cached_url = save_poster_to_db(str(movie['_id']), payload['posterUrl'])
            if not cached_url:
                # Never save the supplied remote URL as the public poster URL.
                # Muse can retry the same idempotency key after a transient fetch error.
                return _error('internal', status=500)
            db.movies.update_one({'_id': movie['_id']}, {'$set': {'posterUrl': cached_url}})
            movie['posterUrl'] = cached_url

        return jsonify(_movie_response(movie, created)), 200
    except Exception as error:
        # Keep external responses deliberately opaque; no key, connection, or
        # provider details should cross this boundary.
        print(f'Agent movie upsert failed: {type(error).__name__}')
        return _error('internal', status=500)


@agent_movies_bp.route('/movies', methods=['GET'])
def lookup_movie():
    tmdb_id = request.args.get('tmdbId')
    title = request.args.get('title')
    release_date = request.args.get('releaseDate')

    if tmdb_id:
        try:
            if not tmdb_id.isdigit() or int(tmdb_id) <= 0:
                raise ValueError
            movie = db.movies.find_one({'$or': [{'tmdbId': int(tmdb_id)}, {'agentTmdbId': int(tmdb_id)}]})
        except ValueError:
            return _error('invalid_field', field='tmdbId')
    else:
        if not title:
            return _error('invalid_field', field='title')
        if not release_date:
            return _error('invalid_field', field='releaseDate')
        try:
            datetime.datetime.strptime(release_date, '%Y-%m-%d')
        except ValueError:
            return _error('invalid_field', field='releaseDate')
        movie = db.movies.find_one({
            '$or': [
                {'agentTitleKey': title.casefold().strip(), 'releaseDate': release_date},
                {'title': {'$regex': f'^{re.escape(title.strip())}$', '$options': 'i'}, 'releaseDate': release_date},
            ]
        })

    if not movie:
        return _error('not_found', status=404)
    return jsonify(_movie_response(movie, created=False)), 200


@agent_movies_bp.route('/theaters/upsert', methods=['POST'])
def upsert_theater():
    payload, validation_error = _validate_theater_upsert(request.get_json(silent=True))
    if validation_error:
        error, field = validation_error
        return _error(error, field=field)

    try:
        ref = db.agent_theater_refs.find_one({'_id': payload['externalRef']})
        if ref and isinstance(ref.get('theaterId'), ObjectId):
            candidate_id = ref['theaterId']
        else:
            candidate_id = ObjectId()
            try:
                db.agent_theater_refs.insert_one({
                    '_id': payload['externalRef'],
                    'theaterId': candidate_id,
                    'createdAt': datetime.datetime.now(datetime.timezone.utc),
                })
            except DuplicateKeyError:
                ref = db.agent_theater_refs.find_one({'_id': payload['externalRef']})
                candidate_id = ref.get('theaterId') if ref else None
                if not isinstance(candidate_id, ObjectId):
                    return _error('internal', status=500)

        theater = db.theaters.find_one({'_id': candidate_id}) or _find_theater_for_request(payload)
        created = theater is None
        updates = {
            'name': payload['name'],
            'location': payload['location'],
            'lastUpdatedBy': 'muse-agent',
            'agentUpdatedAt': datetime.datetime.now(datetime.timezone.utc),
            **payload['details'],
        }
        if 'gmapsLink' in payload:
            updates['gmapsLink'] = payload['gmapsLink']

        if created:
            updates.update({
                '_id': candidate_id,
                'createdAt': datetime.datetime.now(datetime.timezone.utc),
                'agentSource': 'muse',
                'verified': False,
            })
            try:
                db.theaters.insert_one(updates)
                theater = db.theaters.find_one({'_id': candidate_id})
            except DuplicateKeyError:
                theater = db.theaters.find_one({'_id': candidate_id})
                if not theater:
                    return _error('internal', status=500)
                created = False
        else:
            db.theaters.update_one({'_id': theater['_id']}, {'$set': updates})
            theater.update(updates)

        if theater['_id'] != candidate_id:
            db.agent_theater_refs.update_one(
                {'_id': payload['externalRef'], 'theaterId': candidate_id},
                {'$set': {'theaterId': theater['_id']}},
            )
        return jsonify(_theater_response(theater, created)), 200
    except Exception as error:
        print(f'Agent theater upsert failed: {type(error).__name__}')
        return _error('internal', status=500)


@agent_movies_bp.route('/theaters', methods=['GET'])
def lookup_theater():
    theater_id = request.args.get('id')
    name = request.args.get('name')
    location = request.args.get('location')
    if theater_id:
        if not ObjectId.is_valid(theater_id):
            return _error('invalid_field', field='id')
        theater = db.theaters.find_one({'_id': ObjectId(theater_id)})
    else:
        if not name:
            return _error('invalid_field', field='name')
        if not location:
            return _error('invalid_field', field='location')
        location_data = {'name': name.strip(), 'location': location.strip()}
        normalize_theater_location(location_data)
        theater = db.theaters.find_one({
            'name': {'$regex': f'^{re.escape(location_data["name"])}$', '$options': 'i'},
            'location': {'$regex': f'^{re.escape(location_data["location"])}$', '$options': 'i'},
        })
    if not theater:
        return _error('not_found', status=404)
    return jsonify(_theater_response(theater)), 200


@agent_movies_bp.route('/theaters/delete-suggestions', methods=['POST'])
def suggest_theater_deletion():
    payload, validation_error = _validate_delete_suggestion(request.get_json(silent=True))
    if validation_error:
        error, field = validation_error
        return _error(error, field=field)

    existing = db.agent_theater_delete_suggestions.find_one({'_id': payload['externalRef']})
    if existing:
        return jsonify({'id': str(existing['_id']), 'status': existing.get('status', 'pending'), 'created': False}), 200

    theater = db.theaters.find_one({'_id': payload['theaterId']}) if payload.get('theaterId') else db.theaters.find_one({
        'name': {'$regex': f'^{re.escape(payload["name"])}$', '$options': 'i'},
        'location': {'$regex': f'^{re.escape(payload["location"])}$', '$options': 'i'},
    })
    if not theater:
        return _error('not_found', status=404)
    suggestion = {
        '_id': payload['externalRef'],
        'theaterId': theater['_id'],
        'theaterName': theater.get('name'),
        'theaterLocation': theater.get('location'),
        'reason': payload['reason'],
        'evidenceUrl': payload.get('evidenceUrl'),
        'status': 'pending',
        'createdAt': datetime.datetime.now(datetime.timezone.utc),
        'source': 'muse-agent',
    }
    try:
        db.agent_theater_delete_suggestions.insert_one(suggestion)
    except DuplicateKeyError:
        existing = db.agent_theater_delete_suggestions.find_one({'_id': payload['externalRef']})
        return jsonify({'id': str(existing['_id']), 'status': existing.get('status', 'pending'), 'created': False}), 200
    # This is deliberately a review record, never a queued deletion job.
    return jsonify({'id': payload['externalRef'], 'status': 'pending', 'created': True}), 201
