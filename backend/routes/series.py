from flask import Blueprint, request, jsonify, Response
import os
import requests
import datetime
import re
from bson import ObjectId, Binary
from bson.errors import InvalidId
from mongo_config import db
from routes.movies import is_admin
from routes.omdb_keys import get_available_api_key, record_omdb_call

series_bp = Blueprint('series', __name__)

OMDB_API_KEY = os.environ.get('OMDB_API_KEY')
OMDB_URL = "https://www.omdbapi.com/"

# How long a preview payload stays reusable by the import endpoints.
PREVIEW_CACHE_TTL_SECONDS = 3600


class OmdbError(Exception):
    """Raised for any OMDb-level failure (bad key, quota, unknown title)."""
    pass


def verify_admin(req):
    """Verifies if the requester is an admin using their Firebase token."""
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return is_admin(token)


def resolve_api_key(data=None):
    """Use the admin-supplied key when present, else fall back to the DB key.

    The override lets an admin keep importing with a second key once the
    default key has burned through its daily quota. It is never persisted.
    """
    override = (data or {}).get('apiKey')
    return get_available_api_key(override_key=override)


def omdb_request(api_key, key_id=None, **params):
    params['apikey'] = api_key
    try:
        res = requests.get(OMDB_URL, params=params, timeout=15)
    except requests.RequestException as e:
        raise OmdbError(f"Could not reach OMDb: {e}")

    if res.status_code == 401:
        raise OmdbError("OMDb rejected the key (invalid key, or the daily request limit is reached)")
    if res.status_code != 200:
        raise OmdbError(f"OMDb request failed with status {res.status_code}")

    data = res.json()
    if data.get('Response') == 'False' or data.get('Error'):
        raise OmdbError(data.get('Error') or "Unknown OMDb error")
    
    if key_id is not None:
        record_omdb_call(key_id)
        
    return data


def _to_int(value, default=0):
    try:
        return int(str(value).strip().split(' ')[0])
    except (TypeError, ValueError):
        return default


def _to_float(value):
    if value in (None, '', 'N/A'):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_date(value):
    """OMDb hands back '23 Jan 2010' at episode level and '2010-01-23' at
    season level. Store one format so both paths agree."""
    if not value or value == 'N/A':
        return None
    value = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d %b %Y"):
        try:
            return datetime.datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return value


def save_poster_to_db(series_id, poster_url):
    if not poster_url or poster_url == "N/A":
        return None
    try:
        response = requests.get(poster_url, timeout=15)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            image_data = Binary(response.content)
            db.series_posters.update_one(
                {"seriesId": str(series_id)},
                {"$set": {
                    "imageData": image_data,
                    "mimeType": content_type
                }},
                upsert=True
            )
            return f"/api/series/{series_id}/poster"
    except Exception as e:
        print(f"Error saving poster to MongoDB: {e}")
    return None


def compute_total_runtime(seasons):
    return sum(
        ep.get("runtimeMinutes", 0)
        for season in seasons
        for ep in season.get("episodes", [])
    )


def compute_total_episodes(seasons):
    return sum(len(season.get("episodes", [])) for season in seasons)


# ---------------------------------------------------------------------------
# OMDb fetching
# ---------------------------------------------------------------------------

def fetch_series_meta(imdb_id, api_key, key_id=None):
    """One OMDb call. Returns (meta_doc_without_seasons, poster_url, series_runtime)."""
    series_data = omdb_request(api_key, key_id=key_id, i=imdb_id)
    if series_data.get('Type') != 'series':
        raise OmdbError("Not a TV series")

    total_seasons = _to_int(series_data.get('totalSeasons'), 0)
    series_runtime = _to_int(series_data.get('Runtime'), 0)

    end_year = None
    is_ongoing = False
    years = series_data.get('Year', '').split('–')
    try:
        start_year = int(years[0])
        if len(years) > 1 and years[1].strip():
            end_year = int(years[1])
        elif len(years) > 1:
            is_ongoing = True
    except (ValueError, IndexError):
        start_year = 2024

    meta = {
        "imdbId": imdb_id,
        "title": series_data.get('Title'),
        "year": start_year,
        "endYear": end_year,
        "posterUrl": series_data.get('Poster') if series_data.get('Poster') != 'N/A' else "",
        "plot": series_data.get('Plot'),
        "genre": series_data.get('Genre'),
        "actors": series_data.get('Actors'),
        "director": series_data.get('Director'),
        "language": series_data.get('Language'),
        "country": series_data.get('Country'),
        "imdbRating": _to_float(series_data.get('imdbRating')),
        "isOngoing": is_ongoing,
        "totalSeasons": total_seasons,
        "seriesRuntimeMinutes": series_runtime,
    }
    return meta, series_data.get('Poster'), series_runtime


def build_season(raw_season, season_number, api_key, key_id=None, precise=False,
                 fallback_runtime=0, known_runtimes=None):
    """Turn a raw OMDb season payload into a stored season document.

    The season payload already carries title, air date, rating and imdbID for
    every episode -- only Runtime is missing. `precise=True` spends one extra
    OMDb call per episode to get real runtimes; otherwise every episode
    inherits the series-level runtime.
    """
    known_runtimes = known_runtimes or {}
    episodes = []

    for ep in raw_season.get('Episodes', []):
        ep_imdb = ep.get('imdbID')
        rating = _to_float(ep.get('imdbRating'))
        air_date = _normalize_date(ep.get('Released'))
        runtime = known_runtimes.get(ep_imdb, 0)

        if precise and ep_imdb:
            try:
                details = omdb_request(api_key, key_id=key_id, i=ep_imdb)
                runtime = _to_int(details.get('Runtime'), 0)
                if rating is None:
                    rating = _to_float(details.get('imdbRating'))
                air_date = _normalize_date(details.get('Released')) or air_date
            except OmdbError:
                pass  # fall through to the series-level runtime

        if not runtime:
            runtime = fallback_runtime

        episodes.append({
            "episodeNumber": _to_int(ep.get('Episode'), 0),
            "title": ep.get('Title'),
            "imdbId": ep_imdb,
            "runtimeMinutes": runtime,
            "airDate": air_date,
            "imdbRating": rating,
        })

    episodes.sort(key=lambda e: e['episodeNumber'])
    return {
        "seasonNumber": int(season_number),
        "episodeCount": len(episodes),
        "seasonRuntimeMinutes": sum(e['runtimeMinutes'] for e in episodes),
        "runtimeSource": "episode" if precise else "series",
        "episodes": episodes,
    }


def fetch_raw_season(imdb_id, season_number, api_key, key_id=None):
    return omdb_request(api_key, key_id=key_id, i=imdb_id, Season=season_number)


# ---------------------------------------------------------------------------
# Preview cache -- lets a confirmed import reuse the calls the preview spent
# ---------------------------------------------------------------------------

def _cache_put(imdb_id, meta, poster_url, raw_seasons):
    try:
        db.series_import_cache.update_one(
            {"imdbId": imdb_id},
            {"$set": {
                "meta": meta,
                "posterUrl": poster_url,
                "rawSeasons": {str(k): v for k, v in raw_seasons.items()},
                "createdAt": datetime.datetime.now(datetime.timezone.utc),
            }},
            upsert=True
        )
    except Exception as e:
        print(f"Preview cache write failed: {e}")


def _cache_get(imdb_id):
    try:
        doc = db.series_import_cache.find_one({"imdbId": imdb_id})
    except Exception:
        return None
    if not doc:
        return None
    created = doc.get('createdAt')
    if created:
        if created.tzinfo is None:
            created = created.replace(tzinfo=datetime.timezone.utc)
        age = (datetime.datetime.now(datetime.timezone.utc) - created).total_seconds()
        if age > PREVIEW_CACHE_TTL_SECONDS:
            return None
    return doc


def _cache_drop(imdb_id):
    try:
        db.series_import_cache.delete_one({"imdbId": imdb_id})
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Storage helpers
# ---------------------------------------------------------------------------

def _series_query(series_id):
    return {"_id": ObjectId(series_id)} if ObjectId.is_valid(series_id) else {"imdbId": series_id}


def recompute_totals(series_doc):
    seasons = sorted(series_doc.get('seasons', []), key=lambda s: s['seasonNumber'])
    return {
        "seasons": seasons,
        "totalEpisodes": compute_total_episodes(seasons),
        "totalRuntimeMinutes": compute_total_runtime(seasons),
        "importedSeasons": [s['seasonNumber'] for s in seasons],
    }


def existing_runtime_map(series_doc):
    """imdbId -> runtime for episodes already stored with a real runtime, so a
    fast refresh does not throw away previously fetched precise runtimes."""
    out = {}
    for season in (series_doc or {}).get('seasons', []):
        if season.get('runtimeSource') != 'episode':
            continue
        for ep in season.get('episodes', []):
            if ep.get('imdbId') and ep.get('runtimeMinutes'):
                out[ep['imdbId']] = ep['runtimeMinutes']
    return out


def format_doc(doc):
    doc['_id'] = str(doc['_id'])
    for field in ['createdAt', 'updatedAt', 'lastOmdbSync']:
        if doc.get(field) and hasattr(doc[field], 'isoformat'):
            doc[field] = doc[field].isoformat()
    return doc


# ---------------------------------------------------------------------------
# Public reads
# ---------------------------------------------------------------------------

@series_bp.route('/', methods=['GET'])
def list_series():
    if db is None:
        return jsonify({"series": []})

    query = {}
    search = request.args.get('search', '')
    if search:
        safe_search = re.escape(search)
        query['title'] = {'$regex': safe_search, '$options': 'i'}

    cursor = db.series.find(query, {"seasons": 0}).sort("title", 1)
    series_list = []
    for doc in cursor:
        series_list.append(format_doc(doc))

    return jsonify(series_list)


@series_bp.route('/<series_id>', methods=['GET'])
def get_series(series_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        doc = db.series.find_one(_series_query(series_id))
        if not doc:
            return jsonify({"error": "Series not found"}), 404
        return jsonify(format_doc(doc))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/lookup', methods=['GET'])
def lookup_series():
    imdb_id = request.args.get('imdbId')
    if not imdb_id:
        return jsonify({"error": "imdbId parameter is required"}), 400

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    doc = db.series.find_one({"imdbId": imdb_id}, {
        "_id": 1, "imdbId": 1, "title": 1, "year": 1, "endYear": 1,
        "posterUrl": 1, "totalSeasons": 1, "totalEpisodes": 1,
        "totalRuntimeMinutes": 1, "imdbRating": 1, "isOngoing": 1
    })

    if not doc:
        return jsonify({"error": "Series not found"}), 404

    doc['id'] = str(doc.pop('_id'))
    return jsonify(doc)


@series_bp.route('/<series_id>/poster', methods=['GET'])
def get_series_poster(series_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    try:
        poster_doc = db.series_posters.find_one({"seriesId": series_id})
        if not poster_doc:
            return jsonify({"error": "Poster not found"}), 404

        image_bytes = bytes(poster_doc['imageData'])
        return Response(image_bytes, mimetype=poster_doc.get('mimeType', 'image/jpeg'))
    except Exception:
        return jsonify({"error": "Failed to fetch poster"}), 500


# ---------------------------------------------------------------------------
# Admin: preview + chunked import
# ---------------------------------------------------------------------------

@series_bp.route('/preview', methods=['POST'])
def preview_series():
    """Costs 1 + totalSeasons OMDb calls. Returns the season breakdown plus
    what a full import would additionally cost, and caches the payload so the
    subsequent import spends nothing extra in fast mode."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    imdb_id = (data.get('imdbId') or '').strip()
    if not imdb_id.startswith('tt'):
        return jsonify({"error": "Invalid IMDb ID format"}), 400

    try:
        api_key, key_id = resolve_api_key(data)
        meta, poster_url, series_runtime = fetch_series_meta(imdb_id, api_key, key_id)

        calls_used = 1
        seasons = []
        raw_seasons = {}
        for s in range(1, meta['totalSeasons'] + 1):
            try:
                raw = fetch_raw_season(imdb_id, s, api_key, key_id)
                calls_used += 1
            except OmdbError as e:
                seasons.append({
                    "seasonNumber": s,
                    "episodeCount": 0,
                    "available": False,
                    "error": str(e),
                })
                calls_used += 1
                continue
            raw_seasons[s] = raw
            seasons.append({
                "seasonNumber": s,
                "episodeCount": len(raw.get('Episodes', [])),
                "available": True,
            })

        _cache_put(imdb_id, meta, poster_url, raw_seasons)

        existing = db.series.find_one({"imdbId": imdb_id}, {"seasons.seasonNumber": 1, "importStatus": 1})
        existing_seasons = [s['seasonNumber'] for s in (existing or {}).get('seasons', [])]

        total_episodes = sum(s['episodeCount'] for s in seasons)
        return jsonify({
            "imdbId": imdb_id,
            "title": meta['title'],
            "year": meta['year'],
            "endYear": meta['endYear'],
            "posterUrl": meta['posterUrl'],
            "imdbRating": meta['imdbRating'],
            "isOngoing": meta['isOngoing'],
            "totalSeasons": meta['totalSeasons'],
            "totalEpisodes": total_episodes,
            "seriesRuntimeMinutes": series_runtime,
            "seasons": seasons,
            "previewCallsUsed": calls_used,
            "cached": True,
            "exists": existing is not None,
            "existingSeasons": existing_seasons,
        })
    except OmdbError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/import/start', methods=['POST'])
def import_start():
    """Creates or updates the series shell document. Free when a preview was
    just run, otherwise costs 1 OMDb call."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    imdb_id = (data.get('imdbId') or '').strip()
    if not imdb_id.startswith('tt'):
        return jsonify({"error": "Invalid IMDb ID format"}), 400

    replace = bool(data.get('replace'))

    try:
        api_key, key_id = resolve_api_key(data)
        calls_used = 0
        cache = _cache_get(imdb_id)
        if cache:
            meta = cache['meta']
            poster_url = cache.get('posterUrl')
        else:
            meta, poster_url, _ = fetch_series_meta(imdb_id, api_key, key_id)
            calls_used = 1

        now = datetime.datetime.now(datetime.timezone.utc)
        existing = db.series.find_one({"imdbId": imdb_id})

        doc = dict(meta)
        doc.pop('seriesRuntimeMinutes', None)
        doc['updatedAt'] = now
        doc['importStatus'] = "in_progress"

        if existing:
            series_id = str(existing['_id'])
            if replace:
                doc['seasons'] = []
                doc['totalEpisodes'] = 0
                doc['totalRuntimeMinutes'] = 0
                doc['importedSeasons'] = []
            db.series.update_one({"_id": existing['_id']}, {"$set": doc})
        else:
            doc['createdAt'] = now
            doc['seasons'] = []
            doc['totalEpisodes'] = 0
            doc['totalRuntimeMinutes'] = 0
            doc['importedSeasons'] = []
            doc['lastOmdbSync'] = None
            series_id = str(db.series.insert_one(doc).inserted_id)

        if poster_url and poster_url != 'N/A':
            saved_url = save_poster_to_db(series_id, poster_url)
            if saved_url:
                db.series.update_one({"_id": ObjectId(series_id)}, {"$set": {"posterUrl": saved_url}})

        return jsonify({
            "seriesId": series_id,
            "imdbId": imdb_id,
            "title": meta['title'],
            "callsUsed": calls_used,
            "usedCache": cache is not None,
        })
    except OmdbError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/import/season', methods=['POST'])
def import_season():
    """Imports exactly one season, so each request stays well inside the
    serverless timeout and a failure is resumable."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    imdb_id = (data.get('imdbId') or '').strip()
    season_number = data.get('seasonNumber')
    precise = bool(data.get('precise'))

    if not imdb_id.startswith('tt'):
        return jsonify({"error": "Invalid IMDb ID format"}), 400
    if not isinstance(season_number, int) or season_number < 1:
        return jsonify({"error": "seasonNumber must be a positive integer"}), 400

    try:
        api_key, key_id = resolve_api_key(data)
        series_doc = db.series.find_one({"imdbId": imdb_id})
        if not series_doc:
            return jsonify({"error": "Series shell not found -- call import/start first"}), 404

        calls_used = 0
        cache = _cache_get(imdb_id)
        raw = (cache or {}).get('rawSeasons', {}).get(str(season_number))
        if raw is None:
            raw = fetch_raw_season(imdb_id, season_number, api_key, key_id)
            calls_used += 1

        fallback_runtime = (cache or {}).get('meta', {}).get('seriesRuntimeMinutes', 0)
        if not fallback_runtime:
            fallback_runtime = _to_int(series_doc.get('seriesRuntimeMinutes'), 0)

        known = existing_runtime_map(series_doc) if not precise else {}
        season = build_season(
            raw, season_number, api_key, key_id=key_id,
            precise=precise,
            fallback_runtime=fallback_runtime,
            known_runtimes=known,
        )
        if precise:
            calls_used += season['episodeCount']

        seasons = [s for s in series_doc.get('seasons', []) if s.get('seasonNumber') != season_number]
        seasons.append(season)
        series_doc['seasons'] = seasons

        update = recompute_totals(series_doc)
        update['updatedAt'] = datetime.datetime.now(datetime.timezone.utc)
        db.series.update_one({"_id": series_doc['_id']}, {"$set": update})

        return jsonify({
            "seasonNumber": season_number,
            "episodeCount": season['episodeCount'],
            "seasonRuntimeMinutes": season['seasonRuntimeMinutes'],
            "runtimeSource": season['runtimeSource'],
            "callsUsed": calls_used,
            "importedSeasons": update['importedSeasons'],
            "totalEpisodes": update['totalEpisodes'],
            "totalRuntimeMinutes": update['totalRuntimeMinutes'],
        })
    except OmdbError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/import/finish', methods=['POST'])
def import_finish():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    imdb_id = (data.get('imdbId') or '').strip()

    series_doc = db.series.find_one({"imdbId": imdb_id})
    if not series_doc:
        return jsonify({"error": "Series not found"}), 404

    now = datetime.datetime.now(datetime.timezone.utc)
    imported = [s['seasonNumber'] for s in series_doc.get('seasons', [])]
    status = "complete" if len(imported) >= series_doc.get('totalSeasons', 0) else "partial"

    db.series.update_one({"_id": series_doc['_id']}, {"$set": {
        "importStatus": status,
        "lastOmdbSync": now,
        "updatedAt": now,
    }})
    _cache_drop(imdb_id)

    series_doc = db.series.find_one({"_id": series_doc['_id']})
    return jsonify(format_doc(series_doc))


# ---------------------------------------------------------------------------
# Admin: legacy one-shot add + refresh + edit + delete
# ---------------------------------------------------------------------------

@series_bp.route('/fetch-omdb', methods=['POST'])
def fetch_omdb():
    """One-shot import. Fine for small shows; prefer the preview + chunked
    import flow for anything large, which cannot hit the request timeout."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    imdb_id = (data.get('imdbId') or '').strip()
    precise = bool(data.get('precise'))
    only_seasons = data.get('seasons')

    if not imdb_id.startswith('tt'):
        return jsonify({"error": "Invalid IMDb ID format"}), 400

    existing = db.series.find_one({"imdbId": imdb_id})
    if existing:
        return jsonify({"error": "Series already exists", "series": format_doc(existing)}), 400

    try:
        api_key, key_id = resolve_api_key(data)
        meta, poster_url, series_runtime = fetch_series_meta(imdb_id, api_key, key_id)

        wanted = range(1, meta['totalSeasons'] + 1)
        if isinstance(only_seasons, list) and only_seasons:
            wanted = [s for s in only_seasons if isinstance(s, int)]

        seasons_array = []
        for s in wanted:
            try:
                raw = fetch_raw_season(imdb_id, s, api_key, key_id)
            except OmdbError:
                continue
            seasons_array.append(build_season(
                raw, s, api_key, key_id=key_id, precise=precise, fallback_runtime=series_runtime
            ))

        now = datetime.datetime.now(datetime.timezone.utc)
        doc = dict(meta)
        doc.pop('seriesRuntimeMinutes', None)
        doc.update(recompute_totals({"seasons": seasons_array}))
        doc.update({
            "createdAt": now,
            "updatedAt": now,
            "lastOmdbSync": now,
            "importStatus": "complete" if len(seasons_array) >= meta['totalSeasons'] else "partial",
        })

        series_id = str(db.series.insert_one(doc).inserted_id)

        if poster_url and poster_url != 'N/A':
            saved_url = save_poster_to_db(series_id, poster_url)
            if saved_url:
                db.series.update_one({"_id": ObjectId(series_id)}, {"$set": {"posterUrl": saved_url}})
                doc['posterUrl'] = saved_url

        doc['_id'] = series_id
        return jsonify(format_doc(doc))
    except OmdbError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/<series_id>/refresh-omdb', methods=['POST'])
def refresh_omdb(series_id):
    """Re-pulls metadata and seasons. Defaults to fast mode (1 + seasons calls)
    and keeps any precise episode runtimes already stored."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json(silent=True) or {}
    precise = bool(data.get('precise'))

    try:
        series = db.series.find_one(_series_query(series_id))
        if not series:
            return jsonify({"error": "Series not found"}), 404

        imdb_id = series['imdbId']
        real_id = str(series['_id'])

        api_key, key_id = resolve_api_key(data)
        meta, poster_url, series_runtime = fetch_series_meta(imdb_id, api_key, key_id)
        known = existing_runtime_map(series) if not precise else {}

        seasons_array = []
        for s in range(1, meta['totalSeasons'] + 1):
            try:
                raw = fetch_raw_season(imdb_id, s, api_key, key_id)
            except OmdbError:
                continue
            seasons_array.append(build_season(
                raw, s, api_key, key_id=key_id, precise=precise,
                fallback_runtime=series_runtime, known_runtimes=known
            ))

        now = datetime.datetime.now(datetime.timezone.utc)
        doc = dict(meta)
        doc.pop('seriesRuntimeMinutes', None)
        doc.update(recompute_totals({"seasons": seasons_array}))
        doc.update({
            "updatedAt": now,
            "lastOmdbSync": now,
            "importStatus": "complete" if len(seasons_array) >= meta['totalSeasons'] else "partial",
        })

        if poster_url and poster_url != 'N/A':
            saved_url = save_poster_to_db(real_id, poster_url)
            if saved_url:
                doc['posterUrl'] = saved_url

        db.series.update_one({"_id": series['_id']}, {"$set": doc})
        _cache_drop(imdb_id)

        doc['_id'] = real_id
        doc['createdAt'] = series.get('createdAt')
        return jsonify(format_doc(doc))
    except OmdbError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/<series_id>', methods=['PUT'])
def update_series(series_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    try:
        query = _series_query(series_id)

        # Protect internal fields
        update_data = {k: v for k, v in data.items() if k not in ['_id', 'createdAt', 'lastOmdbSync']}
        update_data['updatedAt'] = datetime.datetime.now(datetime.timezone.utc)

        result = db.series.update_one(query, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"error": "Series not found"}), 404

        updated_doc = db.series.find_one(query)
        return jsonify(format_doc(updated_doc))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/<series_id>/verify', methods=['POST'])
def verify_series(series_id):
    """Mark a series as verified (all metadata confirmed correct) or toggle it off.

    Body may contain {"verified": true|false}. When omitted, the current flag is toggled.
    """
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        query = _series_query(series_id)
        series = db.series.find_one(query)
        if not series:
            return jsonify({"error": "Series not found"}), 404

        data = request.get_json(silent=True) or {}
        if 'verified' in data:
            new_val = bool(data.get('verified'))
        else:
            new_val = not bool(series.get('verified', False))

        db.series.update_one({"_id": series["_id"]}, {"$set": {"verified": new_val}})
        return jsonify({
            "message": "Series verified" if new_val else "Series marked unverified",
            "verified": new_val,
            "id": str(series["_id"])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@series_bp.route('/<series_id>', methods=['DELETE'])
def delete_series(series_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        series = db.series.find_one(_series_query(series_id))
        if not series:
            return jsonify({"error": "Series not found"}), 404

        real_id = str(series['_id'])
        db.series.delete_one({"_id": series['_id']})
        db.series_posters.delete_one({"seriesId": real_id})
        _cache_drop(series.get('imdbId'))

        return jsonify({"message": "Series deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
