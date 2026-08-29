from flask import Blueprint, request, jsonify, Response
import os
import re
import requests
import datetime
from firebase_config import auth as firebase_auth
from mongo_config import db
from bson import ObjectId, Binary
import base64
import secrets
from routes.omdb_keys import get_available_api_key, record_omdb_call

movies_bp = Blueprint('movies', __name__)

if db is not None:
    try:
        db.titlecard_rate_limits.create_index('expiresAt', expireAfterSeconds=0)
        db.watch_link_reports.create_index([('status', 1), ('createdAt', -1)])
    except Exception as e:
        print(f"Index creation error for movie support collections: {e}")

OMDB_API_KEY = os.environ.get('OMDB_API_KEY')
MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
# Admin check now uses DB only

def normalize_watch_providers(value):
    """Validate the public streaming links stored on a title."""
    if not isinstance(value, list):
        raise ValueError('watchProviders must be a list')
    providers = []
    for provider in value:
        if not isinstance(provider, dict):
            raise ValueError('Each watch provider must be an object')
        name = str(provider.get('name') or '').strip()
        url = str(provider.get('url') or '').strip()
        regions = provider.get('regions') or []
        if isinstance(regions, str):
            regions = [region.strip() for region in regions.split(',') if region.strip()]
        if not name or not url:
            raise ValueError('Each watch provider needs a name and URL')
        if not re.match(r'^https?://', url, re.I):
            raise ValueError('Watch provider URLs must start with http:// or https://')
        if not isinstance(regions, list):
            raise ValueError('Provider regions must be a list')
        providers.append({
            'name': name[:80],
            'url': url[:2000],
            'regions': list(dict.fromkeys(str(region).strip()[:80] for region in regions if str(region).strip())),
        })
    return providers

def is_admin(id_token):
    """Check if user is admin by verifying token and checking DB"""
    if not id_token:
        print("No token provided for admin check")
        return False
    try:
        # Verify Firebase token
        decoded = firebase_auth.verify_id_token(id_token)
        uid = decoded.get('uid')
        
        # Check DB for admin status
        user = db.users.find_one({"firebaseUid": uid})
        is_admin_user = user and user.get('isAdmin', False)
        
        if not is_admin_user:
            email = user.get('email') if user else 'unknown'
            print(f"Admin check failed for user {uid} ({email})")
        
        return is_admin_user
    except Exception as e:
        print(f"Error verifying admin status: {e}")
        return False

def get_authenticated_uid(req):
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        decoded = firebase_auth.verify_id_token(auth_header.split(' ')[1])
        return decoded.get('uid')
    except Exception:
        return None

def find_movie(movie_id):
    query = {"$or": [{"id": movie_id}, {"_id": movie_id}, {"imdbId": movie_id}]}
    if ObjectId.is_valid(movie_id):
        query["$or"].append({"_id": ObjectId(movie_id)})
    return db.movies.find_one(query)

def fetch_movie_from_omdb(imdb_id):
    try:
        api_key, key_id = get_available_api_key()
    except Exception:
        # Fallback to empty if no key
        return {
            "Title": f"Movie {imdb_id}",
            "Year": "2024",
            "Poster": "N/A",
            "imdbRating": "N/A",
            "Runtime": "N/A"
        }

    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={api_key}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to fetch from OMDB")
    data = response.json()
    if data.get('Error'):
        raise Exception(data['Error'])
        
    if key_id:
        record_omdb_call(key_id)
        
    return data

def save_poster_to_db(movie_id, poster_url):
    if not poster_url or poster_url == "N/A":
        return None
    try:
        response = requests.get(poster_url, timeout=15, stream=True)
        content_type = response.headers.get('Content-Type', '').split(';', 1)[0].lower()
        if response.status_code == 200 and content_type in ALLOWED_IMAGE_MIME_TYPES:
            chunks = []
            size = 0
            for chunk in response.iter_content(64 * 1024):
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    raise ValueError('Poster exceeds the 5 MB limit')
                chunks.append(chunk)
            image_data = Binary(b''.join(chunks))
            db.movie_posters.update_one(
                {"movieId": str(movie_id)},
                {"$set": {
                    "imageData": image_data,
                    "mimeType": content_type
                }},
                upsert=True
            )
            return f"/api/movies/{movie_id}/poster"
    except Exception as e:
        print(f"Error saving poster to MongoDB: {e}")
    return None

def save_poster_base64_to_db(movie_id, base64_str):
    if not base64_str or not base64_str.startswith('data:'):
        return None
    try:
        header, encoded = base64_str.split(",", 1)
        mime_type = header.split(";", 1)[0].split(":", 1)[1].lower()
        if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
            raise ValueError('Only JPEG, PNG, and WebP posters are supported')
        if len(encoded) > (MAX_IMAGE_BYTES * 4 // 3) + 4:
            raise ValueError('Poster exceeds the 5 MB limit')
        image_bytes = base64.b64decode(encoded, validate=True)
        if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError('Poster exceeds the 5 MB limit')
        image_data = Binary(image_bytes)
        db.movie_posters.update_one(
            {"movieId": str(movie_id)},
            {"$set": {
                "imageData": image_data,
                "mimeType": mime_type
            }},
            upsert=True
        )
        return f"/api/movies/{movie_id}/poster"
    except Exception as e:
        print(f"Error saving base64 poster to MongoDB: {e}")
    return None


def decode_submission_image(value):
    if not isinstance(value, str) or not value.startswith('data:'):
        raise ValueError('Screenshot must be a data URL')
    try:
        header, encoded = value.split(',', 1)
        mime_type = header.split(';', 1)[0].split(':', 1)[1].lower()
    except (IndexError, ValueError):
        raise ValueError('Invalid screenshot data URL')
    if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValueError('Only JPEG, PNG, and WebP screenshots are supported')
    if len(encoded) > (MAX_IMAGE_BYTES * 4 // 3) + 4:
        raise ValueError('Screenshot exceeds the 5 MB limit')
    try:
        image_bytes = base64.b64decode(encoded, validate=True)
    except Exception:
        raise ValueError('Invalid screenshot image data')
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError('Screenshot exceeds the 5 MB limit')
    return mime_type, Binary(image_bytes)


def anonymous_submission_allowed():
    """Allow a bounded number of anonymous writes per source each hour."""
    source = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown').split(',')[0].strip()
    device_id = (request.get_json(silent=True) or {}).get('deviceId')
    if isinstance(device_id, str) and 8 <= len(device_id) <= 128:
        source = f'{source}:{device_id}'
    now = datetime.datetime.now(datetime.timezone.utc)
    window_start = now.replace(minute=0, second=0, microsecond=0)
    db.titlecard_rate_limits.update_one(
        {'source': source, 'windowStart': window_start},
        {'$inc': {'count': 1}, '$setOnInsert': {'expiresAt': window_start + datetime.timedelta(hours=2)}},
        upsert=True,
    )
    current = db.titlecard_rate_limits.find_one({'source': source, 'windowStart': window_start})
    return not current or current.get('count', 0) <= 20

def parse_release_date_to_iso(released_str, year_val=None):
    if not released_str or released_str == 'N/A':
        if year_val:
            return f"{str(year_val)[:4]}-01-01"
        return "1970-01-01"
    try:
        # e.g. "16 Jul 2010" -> "2010-07-16"
        dt = datetime.datetime.strptime(str(released_str).strip(), "%d %b %Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        try:
            # e.g. "Jul 2010" -> "2010-07-01"
            dt = datetime.datetime.strptime(str(released_str).strip(), "%b %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            try:
                # e.g. "2010-07-16" (already ISO format)
                if len(str(released_str)) == 10 and str(released_str)[4] == '-' and str(released_str)[7] == '-':
                    return str(released_str)
                return f"{str(released_str)[:4]}-01-01"
            except:
                if year_val:
                    return f"{str(year_val)[:4]}-01-01"
                return "1970-01-01"


def normalize_credit_names(value):
    """Turn OMDb's comma-separated credit strings into searchable arrays."""
    if isinstance(value, list):
        names = value
    elif isinstance(value, str) and value.strip() not in ('', 'N/A'):
        names = value.split(',')
    else:
        return []
    return list(dict.fromkeys(name.strip() for name in names if isinstance(name, str) and name.strip()))

def ensure_movie_metadata(movie_doc):
    """Ensure a movie document has language, released, and releaseDate fields populated."""
    updates = {}
    if not movie_doc.get('language') and not movie_doc.get('Language'):
        imdb_id = movie_doc.get('imdbId') or movie_doc.get('imdbID')
        lang = 'English' # fallback
        released_str = str(movie_doc.get('year', ''))
        
        try:
            api_key, key_id = get_available_api_key()
        except Exception:
            api_key = None
            key_id = None
            
        if imdb_id and api_key:
            try:
                omdb_res = requests.get(f"http://www.omdbapi.com/?apikey={api_key}&i={imdb_id}", timeout=4).json()
                if omdb_res.get('Response') == 'True':
                    lang = omdb_res.get('Language', 'English')
                    released_str = omdb_res.get('Released', released_str)
                if key_id:
                    record_omdb_call(key_id)
            except Exception as e:
                print(f"OMDb fetch error during metadata sync for {imdb_id}: {e}")
        
        updates['language'] = lang
        updates['Language'] = lang
        if not movie_doc.get('released'):
            updates['released'] = released_str
            
    if not movie_doc.get('releaseDate'):
        rel_str = updates.get('released') or movie_doc.get('released') or str(movie_doc.get('year', ''))
        year_val = movie_doc.get('year')
        rel_date = parse_release_date_to_iso(rel_str, year_val)
        updates['releaseDate'] = rel_date
        
    if updates:
        try:
            db.movies.update_one({"_id": movie_doc["_id"]}, {"$set": updates})
            movie_doc.update(updates)
        except Exception as e:
            print(f"Error updating movie metadata: {e}")
            
    return movie_doc

@movies_bp.route('/fetch-omdb', methods=['POST', 'GET'])
def fetch_omdb_endpoint():
    if request.method == 'GET':
        imdb_id = request.args.get('imdbId')
    else:
        data = request.get_json() or {}
        imdb_id = data.get('imdbId')
        
    if not imdb_id or not imdb_id.startswith('tt'):
        return jsonify({"error": "Invalid IMDb ID format"}), 400
        
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
        
    existing = db.movies.find_one({"imdbId": imdb_id})
    if existing:
        existing['id'] = str(existing.pop('_id'))
        if existing.get('createdAt') and hasattr(existing['createdAt'], 'isoformat'):
            existing['createdAt'] = existing['createdAt'].isoformat()
        return jsonify({"exists": True, "movie": existing})
        
    try:
        omdb_data = fetch_movie_from_omdb(imdb_id)
        runtime_str = omdb_data.get('Runtime', 'N/A')
        average_time_seconds = 0
        if runtime_str != 'N/A':
            try:
                minutes = int(runtime_str.split(' ')[0])
                average_time_seconds = minutes * 60
            except:
                pass
                
        lang = omdb_data.get('Language', 'English')
        rel_str = omdb_data.get('Released', str(omdb_data.get('Year', '')))
        year_val = int(omdb_data.get('Year')) if str(omdb_data.get('Year', '')).isdigit() else 2024
        rel_date = parse_release_date_to_iso(rel_str, year_val)
        try:
            imdb_rating = float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating') not in [None, '', 'N/A'] else None
        except:
            imdb_rating = None
            
        movie_preview = {
            "imdbId": imdb_id,
            "title": omdb_data.get('Title', f"Movie {imdb_id}"),
            "year": year_val,
            "language": lang,
            "Language": lang,
            "released": rel_str,
            "releaseDate": rel_date,
            "runtime": runtime_str,
            "averageTimeSeconds": average_time_seconds,
            "imdbRating": imdb_rating,
            "actors": normalize_credit_names(omdb_data.get('Actors')),
            "director": omdb_data.get('Director') if omdb_data.get('Director') != 'N/A' else None,
            "directors": normalize_credit_names(omdb_data.get('Director')),
            "posterUrl": omdb_data.get('Poster') if omdb_data.get('Poster') != "N/A" else ""
        }
        return jsonify({"exists": False, "movie": movie_preview})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@movies_bp.route('/', methods=['POST'])
def add_movie():
    # Verify User (or allow guest)
    auth_header = request.headers.get('Authorization')
    uid = "anonymous"
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if token != "anonymous":
            try:
                decoded = firebase_auth.verify_id_token(token)
                uid = decoded.get('uid', 'anonymous')
            except Exception:
                pass

    data = request.get_json() or {}
    imdb_id = data.get('imdbId')

    if not imdb_id or not imdb_id.startswith('tt'):
         return jsonify({"error": "Invalid IMDb ID format"}), 400

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    # Check if movie exists
    existing = db.movies.find_one({"imdbId": imdb_id})
    if existing:
        existing['id'] = str(existing.pop('_id'))
        if existing.get('createdAt') and hasattr(existing['createdAt'], 'isoformat'):
            existing['createdAt'] = existing['createdAt'].isoformat()
        return jsonify({"message": "Movie already exists", "movie": existing})

    try:
        if data.get('title'):
            title_val = str(data.get('title')).strip()
            try:
                year_val = int(data.get('year', 2024))
            except:
                year_val = 2024
            lang = str(data.get('language') or data.get('Language') or 'English').strip()
            rel_str = str(data.get('released') or data.get('releaseDate') or str(year_val)).strip()
            rel_date = parse_release_date_to_iso(rel_str, year_val)
            runtime_str = str(data.get('runtime', 'N/A')).strip()
            average_time_seconds = 0
            if runtime_str != 'N/A':
                try:
                    minutes = int(runtime_str.split(' ')[0])
                    average_time_seconds = minutes * 60
                except:
                    pass
            try:
                imdb_rating = float(data.get('imdbRating')) if data.get('imdbRating') not in [None, '', 'N/A'] else None
            except:
                imdb_rating = None
            actors = normalize_credit_names(data.get('actors') or data.get('Actors'))
            directors = normalize_credit_names(data.get('directors') or data.get('director') or data.get('Director'))
            omdb_data = {}
        else:
            omdb_data = fetch_movie_from_omdb(imdb_id)
            runtime_str = omdb_data.get('Runtime', 'N/A')
            average_time_seconds = 0
            if runtime_str != 'N/A':
                try:
                    minutes = int(runtime_str.split(' ')[0])
                    average_time_seconds = minutes * 60
                except:
                    pass
            lang = omdb_data.get('Language', 'English')
            rel_str = omdb_data.get('Released', str(omdb_data.get('Year', '')))
            year_val = int(omdb_data.get('Year')) if str(omdb_data.get('Year', '')).isdigit() else 2024
            rel_date = parse_release_date_to_iso(rel_str, year_val)
            title_val = omdb_data.get('Title')
            try:
                imdb_rating = float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating') != "N/A" else None
            except:
                imdb_rating = None
            actors = normalize_credit_names(omdb_data.get('Actors'))
            directors = normalize_credit_names(omdb_data.get('Director'))

        movie_data = {
            "imdbId": imdb_id,
            "title": title_val,
            "year": year_val,
            "posterUrl": None,
            "imdbRating": imdb_rating,
            "actors": actors,
            "director": ', '.join(directors) if directors else None,
            "directors": directors,
            "runtime": runtime_str,
            "language": lang,
            "Language": lang,
            "released": rel_str,
            "releaseDate": rel_date,
            "submissionCount": 0,
            "averageTimeSeconds": average_time_seconds,
            "watchProviders": normalize_watch_providers(data.get('watchProviders', [])),
            "createdAt": datetime.datetime.now(datetime.timezone.utc)
        }

        result = db.movies.insert_one(movie_data)
        movie_id = str(result.inserted_id)
        movie_data['_id'] = movie_id
        movie_data['id'] = movie_id

        # Handle posterImage (Base64 file upload) OR posterUrl OR omdb poster
        poster_image = data.get('posterImage')
        poster_url = data.get('posterUrl')
        final_poster_url = None

        if poster_image and str(poster_image).startswith('data:'):
            saved_url = save_poster_base64_to_db(movie_id, poster_image)
            if saved_url:
                final_poster_url = saved_url
        elif poster_url and str(poster_url).strip() not in ['', 'N/A', 'null']:
            p_url = str(poster_url).strip()
            if p_url.startswith("http://") or p_url.startswith("https://"):
                saved_url = save_poster_to_db(movie_id, p_url)
                final_poster_url = saved_url or p_url
            else:
                final_poster_url = p_url
        elif omdb_data.get('Poster') and omdb_data.get('Poster') != "N/A":
            saved_url = save_poster_to_db(movie_id, omdb_data.get('Poster'))
            if saved_url:
                final_poster_url = saved_url

        if final_poster_url:
            db.movies.update_one({"_id": ObjectId(movie_id)}, {"$set": {"posterUrl": final_poster_url}})
            movie_data['posterUrl'] = final_poster_url

        if 'createdAt' in movie_data and hasattr(movie_data['createdAt'], 'isoformat'):
            movie_data['createdAt'] = movie_data['createdAt'].isoformat()
        if '_id' in movie_data:
            del movie_data['_id']

        return jsonify({"message": "Movie added successfully", "movie": movie_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@movies_bp.route('/', methods=['GET'])
def list_movies():
    if db is None:
        return jsonify({"movies": []})
    
    # Quick self-healing: ensure up to 50 movies lacking metadata get language/releaseDate populated
    try:
        missing_meta = list(db.movies.find({
            "$or": [
                {"language": {"$exists": False}},
                {"language": None},
                {"language": ""},
                {"releaseDate": {"$exists": False}},
                {"releaseDate": None},
                {"releaseDate": ""}
            ]
        }).limit(50))
        for doc in missing_meta:
            ensure_movie_metadata(doc)
    except Exception as e:
        print(f"Error during metadata backfill check: {e}")

    # Get optional limit param (default 50, max 500)
    limit = request.args.get('limit', 50, type=int)
    limit = min(limit, 500)
    
    # Get optional skip param for pagination
    skip = request.args.get('skip', 0, type=int)
    
    # Get optional search/filter params
    title_search = request.args.get('search', '') or request.args.get('title', '')
    year_filter = request.args.get('year', '')
    language_filter = request.args.get('language', '')
    missing_poster = request.args.get('missingPoster', '')
    avg_time_filter = request.args.get('avgTimeFilter', '')
    release_filter = request.args.get('releaseFilter', '')
    watch_available = request.args.get('watchAvailable', '')
    sort = request.args.get('sort', 'latest')
    
    query = {}
    if title_search:
        # Escaped: this runs on every keystroke of the movie picker, and an
        # unbalanced "(" from a title like "Alien (1979)" is an invalid regex.
        safe_search = re.escape(title_search)
        query['$or'] = [
            {'title': {'$regex': safe_search, '$options': 'i'}},
            {'imdbId': {'$regex': safe_search, '$options': 'i'}}
        ]
    if year_filter and year_filter.strip() != '' and year_filter != 'All':
        try:
            query['year'] = int(year_filter)
        except ValueError:
            pass
    if language_filter and language_filter.lower() != 'all' and language_filter.strip() != '':
        lang_cond = [
            {'language': {'$regex': language_filter, '$options': 'i'}},
            {'Language': {'$regex': language_filter, '$options': 'i'}}
        ]
        if '$or' in query:
            query = {'$and': [{'$or': query['$or']}, {'$or': lang_cond}]}
        else:
            query['$or'] = lang_cond

    if missing_poster == 'true':
        poster_cond = [
            {"posterUrl": {"$exists": False}},
            {"posterUrl": None},
            {"posterUrl": ""},
            {"posterUrl": "N/A"}
        ]
        if '$and' in query:
            query['$and'].append({'$or': poster_cond})
        elif '$or' in query:
            query = {'$and': [{'$or': query['$or']}, {'$or': poster_cond}]}
        else:
            query['$or'] = poster_cond

    if avg_time_filter == 'missing':
        time_cond = [
            {"averageTimeSeconds": {"$exists": False}},
            {"averageTimeSeconds": None},
            {"averageTimeSeconds": 0},
            {"submissionCount": {"$exists": False}},
            {"submissionCount": 0}
        ]
        if '$and' in query:
            query['$and'].append({'$or': time_cond})
        elif '$or' in query:
            query = {'$and': [{'$or': query['$or']}, {'$or': time_cond}]}
        else:
            query['$or'] = time_cond
    elif avg_time_filter == 'has':
        if '$and' in query:
            query['$and'].append({"averageTimeSeconds": {"$gt": 0}})
            query['$and'].append({"submissionCount": {"$gt": 0}})
        else:
            query['averageTimeSeconds'] = {"$gt": 0}
            query['submissionCount'] = {"$gt": 0}

    if watch_available == 'true':
        # `watchProviders.0` only exists when at least one approved OTT link
        # is present, so pagination and totals stay accurate.
        query.setdefault('$and', []).append({'watchProviders.0': {'$exists': True}})
    
    now_str = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    if release_filter == 'latest':
        date_cond = [
            {"releaseDate": {"$lte": now_str}},
            {"releaseDate": {"$exists": False}},
            {"releaseDate": None},
            {"releaseDate": ""}
        ]
        if '$and' in query:
            query['$and'].append({'$or': date_cond})
        elif '$or' in query:
            query = {'$and': [{'$or': query['$or']}, {'$or': date_cond}]}
        else:
            query['$or'] = date_cond
    elif release_filter == 'upcoming':
        if '$and' in query:
            query['$and'].append({"releaseDate": {"$gt": now_str}})
        else:
            query["releaseDate"] = {"$gt": now_str}
    
    # Get total count for pagination
    total = db.movies.count_documents(query)
        
    sort_orders = {
        'latest': [("releaseDate", -1), ("year", -1), ("createdAt", -1)],
        'oldest': [("releaseDate", 1), ("year", 1), ("title", 1)],
        'title_asc': [("title", 1), ("year", -1)],
        'title_desc': [("title", -1), ("year", -1)],
    }
    sort_order = sort_orders.get(sort, sort_orders['latest'])
    if release_filter == 'upcoming' and sort == 'latest':
        sort_order = [("releaseDate", 1), ("year", 1), ("createdAt", -1)]
        
    movies_cursor = db.movies.find(query).sort(sort_order).skip(skip).limit(limit)
    
    movies = []
    for m in movies_cursor:
        m['id'] = str(m.pop('_id')) # Rename _id to id for frontend compatibility
        if m.get('createdAt') and hasattr(m['createdAt'], 'isoformat'):
           m['createdAt'] = m['createdAt'].isoformat()
        if not m.get('language'):
           m['language'] = m.get('Language', 'English')
        if not m.get('Language'):
           m['Language'] = m.get('language', 'English')
        if not m.get('releaseDate'):
           rel_str = m.get('released') or str(m.get('year', ''))
           m['releaseDate'] = parse_release_date_to_iso(rel_str, m.get('year'))
        if not m.get('released'):
           m['released'] = m.get('releaseDate') or str(m.get('year', ''))
        m['verified'] = bool(m.get('verified', False))
        movies.append(m)
        
    return jsonify({"movies": movies, "total": total})

@movies_bp.route('/search-discover', methods=['GET'])
def search_omdb():
    query = request.args.get('s', '*')
    year = request.args.get('y')
    language_filter = request.args.get('language')
    upcoming_filter = request.args.get('upcoming')
    
    try:
        api_key, key_id = get_available_api_key()
    except Exception:
        return jsonify({"Search": [], "totalResults": "0", "Response": "True"})

    # Build OMDb URL with type=movie to exclude TV series
    url = f"https://www.omdbapi.com/?s={query}&type=movie&apikey={api_key}"
    if year:
        url += f"&y={year}"
        
    response = requests.get(url)
    data = response.json()
    if key_id and not data.get('Error'):
        record_omdb_call(key_id)
    
    if data.get('Search'):
        # Check which movies exist in DB
        imdb_ids = [m.get('imdbID') for m in data['Search'] if m.get('imdbID')]
        existing_movies = list(db.movies.find({"imdbId": {"$in": imdb_ids}}, {"imdbId": 1}))
        existing_ids = {m['imdbId'] for m in existing_movies}
        
        # Mark existing movies
        for m in data['Search']:
            if m.get('imdbID') in existing_ids:
                m['exists'] = True
            else:
                m['exists'] = False
        
        # Apply language filter if specified (requires fetching full details)
        if language_filter:
            filtered_results = []
            for m in data['Search'][:20]:  # Limit to 20 to avoid too many API calls
                details_url = f"https://www.omdbapi.com/?i={m['imdbID']}&apikey={api_key}"
                details_response = requests.get(details_url)
                details = details_response.json()
                if key_id and not details.get('Error'):
                    record_omdb_call(key_id)
                
                if details.get('Language') and language_filter.lower() in details.get('Language', '').lower():
                    m['Language'] = details.get('Language')
                    filtered_results.append(m)
            
            data['Search'] = filtered_results
        
        # Apply upcoming releases filter if specified
        if upcoming_filter:
            from datetime import datetime, timedelta
            months = int(upcoming_filter)
            future_date = datetime.now() + timedelta(days=30 * months)
            
            filtered_results = []
            for m in data['Search']:
                try:
                    # Parse year from search result or fetch full details
                    year_str = m.get('Year', '')
                    # Handle year ranges like "2024-2025"
                    if '-' in year_str:
                        year_str = year_str.split('-')[0]
                    
                    year_int = int(year_str) if year_str.isdigit() else 0
                    # If year is current or future within range, include it
                    if year_int >= datetime.now().year and year_int <= future_date.year:
                        filtered_results.append(m)
                except:
                    pass
            
            data['Search'] = filtered_results
                
    return jsonify(data)

@movies_bp.route('/<movie_id>/poster', methods=['GET'])
def get_movie_poster(movie_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    try:
        poster_doc = db.movie_posters.find_one({"movieId": movie_id})
        if not poster_doc:
            return jsonify({"error": "Poster not found"}), 404
        
        image_bytes = bytes(poster_doc['imageData'])
        return Response(image_bytes, mimetype=poster_doc.get('mimeType', 'image/jpeg'))
    except Exception as e:
        print(f"Error fetching poster: {e}")
        return jsonify({"error": "Failed to fetch poster"}), 500

@movies_bp.route('/<movie_id>/watch-link-reports', methods=['POST'])
def report_movie_watch_link(movie_id):
    """Let a signed-in viewer flag one currently published streaming link."""
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    uid = get_authenticated_uid(request)
    if not uid:
        return jsonify({"error": "Sign in to report a watch link"}), 401

    movie = find_movie(movie_id)
    if not movie:
        return jsonify({"error": "Movie not found"}), 404

    data = request.get_json(silent=True) or {}
    provider_name = str(data.get('providerName') or '').strip()
    provider_url = str(data.get('providerUrl') or '').strip()
    reason = str(data.get('reason') or 'not_working').strip().lower()
    if reason not in {'not_working', 'expired'}:
        return jsonify({"error": "Invalid report reason"}), 400

    provider = next((item for item in movie.get('watchProviders', [])
                     if item.get('name') == provider_name and item.get('url') == provider_url), None)
    if not provider:
        return jsonify({"error": "This watch link is no longer published"}), 404

    existing = db.watch_link_reports.find_one({
        "movieId": movie['_id'], "userId": uid, "providerUrl": provider_url, "status": "pending"
    })
    if existing:
        return jsonify({"message": "You already reported this link", "reportId": str(existing['_id'])}), 200

    now = datetime.datetime.now(datetime.timezone.utc)
    report = {
        "movieId": movie['_id'], "movieTitle": movie.get('title'), "movieYear": movie.get('year'),
        "providerName": provider_name, "providerUrl": provider_url, "regions": provider.get('regions', []),
        "reason": reason, "userId": uid, "status": "pending", "createdAt": now,
        "resolvedAt": None, "adminNote": None,
    }
    result = db.watch_link_reports.insert_one(report)
    return jsonify({"message": "Thanks — the admin team will check this link", "reportId": str(result.inserted_id)}), 201

@movies_bp.route('/watch-link-reports', methods=['GET'])
def get_movie_watch_link_reports():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer ') or not is_admin(auth_header.split(' ')[1]):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    status = request.args.get('status', 'pending')
    query = {} if status == 'all' else {"status": status}
    reports = []
    for report in db.watch_link_reports.find(query).sort('createdAt', -1):
        reports.append({
            "id": str(report['_id']), "movieId": str(report.get('movieId')),
            "movieTitle": report.get('movieTitle'), "movieYear": report.get('movieYear'),
            "providerName": report.get('providerName'), "providerUrl": report.get('providerUrl'),
            "regions": report.get('regions', []), "reason": report.get('reason'),
            "userId": report.get('userId'), "status": report.get('status'), "adminNote": report.get('adminNote'),
            "createdAt": report.get('createdAt').isoformat() if report.get('createdAt') else None,
            "resolvedAt": report.get('resolvedAt').isoformat() if report.get('resolvedAt') else None,
        })
    return jsonify({"reports": reports, "count": len(reports)})

@movies_bp.route('/watch-link-reports/<report_id>', methods=['PUT'])
def resolve_movie_watch_link_report(report_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer ') or not is_admin(auth_header.split(' ')[1]):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    if not ObjectId.is_valid(report_id):
        return jsonify({"error": "Invalid report ID"}), 400

    data = request.get_json(silent=True) or {}
    status = data.get('status')
    if status not in {'resolved', 'dismissed'}:
        return jsonify({"error": "Status must be resolved or dismissed"}), 400
    now = datetime.datetime.now(datetime.timezone.utc)
    result = db.watch_link_reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status": status, "adminNote": data.get('adminNote'), "resolvedAt": now}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Report not found"}), 404
    return jsonify({"message": f"Report {status}"})

@movies_bp.route('/<movie_id>', methods=['GET'])
def get_movie(movie_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        movie = find_movie(movie_id)
        
        if not movie:
            return jsonify({"error": "Movie not found"}), 404
            
        movie['id'] = str(movie.pop('_id'))
        if movie.get('createdAt'):
            movie['createdAt'] = movie['createdAt'].isoformat()
            
        return jsonify(movie)
    except Exception as e:
        print(f"Error fetching movie: {e}")
        return jsonify({"error": "Failed to fetch movie"}), 500

@movies_bp.route('/<movie_id>', methods=['PUT'])
def update_movie(movie_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json()
    
    update_fields = {}
    if 'title' in data and data['title'] is not None:
        update_fields['title'] = str(data['title']).strip()
    if 'year' in data and data['year'] is not None:
        try:
            update_fields['year'] = int(data['year'])
        except ValueError:
            pass
    if 'released' in data or 'releaseDate' in data:
        rel_val = data.get('released') or data.get('releaseDate')
        update_fields['released'] = rel_val
        update_fields['releaseDate'] = parse_release_date_to_iso(rel_val, update_fields.get('year') or data.get('year'))
    if 'language' in data or 'Language' in data:
        lang_val = data.get('language') or data.get('Language')
        update_fields['language'] = lang_val
        update_fields['Language'] = lang_val
    if 'runtime' in data and data['runtime'] is not None:
        update_fields['runtime'] = str(data['runtime']).strip()
    if 'imdbRating' in data:
        try:
            update_fields['imdbRating'] = float(data['imdbRating']) if data['imdbRating'] != '' and data['imdbRating'] is not None else None
        except ValueError:
            pass
    if 'actors' in data or 'Actors' in data:
        update_fields['actors'] = normalize_credit_names(data.get('actors') or data.get('Actors'))
    if 'directors' in data or 'director' in data or 'Director' in data:
        directors = normalize_credit_names(data.get('directors') or data.get('director') or data.get('Director'))
        update_fields['directors'] = directors
        update_fields['director'] = ', '.join(directors) if directors else None
    if 'watchProviders' in data:
        update_fields['watchProviders'] = normalize_watch_providers(data['watchProviders'])

    # Handle posterImage (Base64) or posterUrl
    poster_image = data.get('posterImage')
    if poster_image and str(poster_image).startswith('data:'):
        saved_url = save_poster_base64_to_db(movie_id, poster_image)
        if saved_url:
            update_fields['posterUrl'] = saved_url
    elif 'posterUrl' in data and data['posterUrl'] is not None:
        p_url = str(data['posterUrl']).strip()
        if p_url.startswith("http://") or p_url.startswith("https://"):
            saved_url = save_poster_to_db(movie_id, p_url)
            update_fields['posterUrl'] = saved_url or p_url
        else:
            update_fields['posterUrl'] = p_url

    if not update_fields:
        return jsonify({"error": "No valid fields provided for update"}), 400

    try:
        # Build filter by ObjectId or _id str or id or imdbId
        filter_query = {"$or": [{"id": movie_id}, {"_id": movie_id}, {"imdbId": movie_id}]}
        if ObjectId.is_valid(movie_id):
            filter_query["$or"].append({"_id": ObjectId(movie_id)})

        result = db.movies.update_one(filter_query, {"$set": update_fields})
        if result.matched_count == 0:
            return jsonify({"error": "Movie not found"}), 404

        updated_doc = db.movies.find_one(filter_query)
        if updated_doc:
            updated_doc['id'] = str(updated_doc.pop('_id'))
            if updated_doc.get('createdAt') and hasattr(updated_doc['createdAt'], 'isoformat'):
                updated_doc['createdAt'] = updated_doc['createdAt'].isoformat()
        return jsonify({"message": "Movie updated successfully", "movie": updated_doc or update_fields})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@movies_bp.route('/<movie_id>/refresh-omdb', methods=['POST'])
def refresh_movie_from_omdb(movie_id):
    """Refresh catalog metadata without touching title-card or OTT data."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    if not is_admin(auth_header.split(' ')[1]):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        query = {"$or": [{"id": movie_id}, {"_id": movie_id}, {"imdbId": movie_id}]}
        if ObjectId.is_valid(movie_id):
            query["$or"].append({"_id": ObjectId(movie_id)})
        movie = db.movies.find_one(query)
        if not movie:
            return jsonify({"error": "Movie not found"}), 404
        if not movie.get('imdbId'):
            return jsonify({"error": "This movie has no IMDb ID to refresh"}), 400

        omdb = fetch_movie_from_omdb(movie['imdbId'])
        if omdb.get('Error'):
            return jsonify({"error": omdb['Error']}), 400

        try:
            year = int(str(omdb.get('Year', ''))[:4])
        except (TypeError, ValueError):
            year = movie.get('year')
        released = omdb.get('Released') if omdb.get('Released') not in (None, '', 'N/A') else movie.get('released')
        try:
            rating = float(omdb.get('imdbRating')) if omdb.get('imdbRating') not in (None, '', 'N/A') else None
        except (TypeError, ValueError):
            rating = None
        directors = normalize_credit_names(omdb.get('Director'))
        language = omdb.get('Language') if omdb.get('Language') not in (None, '', 'N/A') else movie.get('language')
        updates = {
            'title': omdb.get('Title') or movie.get('title'),
            'year': year,
            'released': released,
            'releaseDate': parse_release_date_to_iso(released, year),
            'runtime': omdb.get('Runtime') if omdb.get('Runtime') not in (None, '', 'N/A') else movie.get('runtime'),
            'language': language,
            'Language': language,
            'imdbRating': rating,
            'actors': normalize_credit_names(omdb.get('Actors')),
            'directors': directors,
            'director': ', '.join(directors) if directors else None,
            'lastOmdbSync': datetime.datetime.now(datetime.timezone.utc),
        }
        poster_url = omdb.get('Poster')
        if poster_url and poster_url != 'N/A':
            saved_url = save_poster_to_db(str(movie['_id']), poster_url)
            updates['posterUrl'] = saved_url or poster_url

        # Intentionally exclude submissionCount, averageTimeSeconds, titlecards,
        # and watchProviders: an OMDb refresh cannot alter community data.
        db.movies.update_one({'_id': movie['_id']}, {'$set': updates})
        refreshed = db.movies.find_one({'_id': movie['_id']})
        refreshed['id'] = str(refreshed.pop('_id'))
        for field in ('createdAt', 'lastOmdbSync'):
            if refreshed.get(field) and hasattr(refreshed[field], 'isoformat'):
                refreshed[field] = refreshed[field].isoformat()
        return jsonify({"message": "Movie refreshed from OMDb", "movie": refreshed})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@movies_bp.route('/<movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    # Verify Admin
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        if not ObjectId.is_valid(movie_id):
            return jsonify({"error": "Invalid movie ID"}), 400

        result = db.movies.delete_one({"_id": ObjectId(movie_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Movie not found"}), 404
        
        # Also delete related titlecards and posters
        db.titlecards.delete_many({"movieId": movie_id})
        db.titlecard_images.delete_many({"movieId": movie_id})
        db.movie_posters.delete_one({"movieId": movie_id})
        db.watch_link_reports.delete_many({"movieId": ObjectId(movie_id)})
            
        return jsonify({"message": "Movie deleted successfully"})
    except Exception as e:
        print(f"Error deleting movie: {e}")
        return jsonify({"error": "Failed to delete movie"}), 500

@movies_bp.route('/<movie_id>/submissions', methods=['DELETE'])
def clear_submissions(movie_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401

    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        if not ObjectId.is_valid(movie_id):
            return jsonify({"error": "Invalid movie ID"}), 400

        # Delete all submissions for this movie
        db.titlecards.delete_many({"movieId": movie_id})

        # Reset movie submissionCount and averageTimeSeconds
        result = db.movies.update_one(
            {"_id": ObjectId(movie_id)},
            {"$set": {
                "submissionCount": 0,
                "averageTimeSeconds": None
            }}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Movie not found"}), 404

        return jsonify({"message": "Submissions cleared successfully"})
    except Exception as e:
        print(f"Error clearing submissions: {e}")
        return jsonify({"error": "Failed to clear submissions"}), 500

@movies_bp.route('/submissions', methods=['POST'])
def add_submission():
    # Verify User (or allow guest)
    auth_header = request.headers.get('Authorization')
    uid = "anonymous"
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if token != "anonymous":
            try:
                decoded = firebase_auth.verify_id_token(token)
                uid = decoded.get('uid', 'anonymous')
            except Exception:
                pass

    data = request.get_json(silent=True) or {}
    movie_id = data.get('movieId')
    time_in_seconds = data.get('timeInSeconds')
    raw_input = data.get('rawInput')
    comment = data.get('comment')
    screenshot_image = data.get('screenshotImage')  # Optional Base64 data URL
    
    if not movie_id or time_in_seconds is None:
        return jsonify({"error": "Missing required fields"}), 400
    if not isinstance(time_in_seconds, (int, float)) or isinstance(time_in_seconds, bool) or not 0 <= time_in_seconds <= 8 * 3600:
        return jsonify({"error": "timeInSeconds must be between 0 and 28800"}), 400
    if not isinstance(movie_id, str) or not ObjectId.is_valid(movie_id):
        return jsonify({"error": "Invalid movie ID"}), 400
    if uid == "anonymous" and not anonymous_submission_allowed():
        return jsonify({"error": "Too many anonymous submissions; please try again later"}), 429
    screenshot = None
    if screenshot_image:
        try:
            screenshot = decode_submission_image(screenshot_image)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
    try:
        submission = {
            "movieId": movie_id,
            "timeInSeconds": time_in_seconds,
            "rawInput": raw_input,
            "comment": comment,
            "screenshotUrl": None,
            "createdAt": datetime.datetime.now(datetime.timezone.utc)
        }
        
        result = db.titlecards.insert_one(submission)
        submission_id = str(result.inserted_id)
        
        # Save screenshot if provided
        if screenshot:
            try:
                mime_type, image_bytes = screenshot
                db.titlecard_images.update_one(
                    {"submissionId": submission_id},
                    {"$set": {
                        "movieId": movie_id,
                        "imageData": image_bytes,
                        "mimeType": mime_type
                    }},
                    upsert=True
                )
                screenshot_url = f"/api/movies/submissions/{submission_id}/image"
                db.titlecards.update_one({"_id": ObjectId(submission_id)}, {"$set": {"screenshotUrl": screenshot_url}})
                submission["screenshotUrl"] = screenshot_url
            except Exception as se:
                print(f"Error saving titlecard screenshot: {se}")

        # Update movie average
        all_subs = list(db.titlecards.find({"movieId": movie_id}))
        if all_subs:
            times = [s['timeInSeconds'] for s in all_subs]
            avg_time = sum(times) / len(times)
            
            db.movies.update_one(
                {"_id": ObjectId(movie_id)},
                {
                    "$set": {
                        "averageTimeSeconds": avg_time,
                        "submissionCount": len(times)
                    }
                }
            )
            
        submission["id"] = submission_id
        submission.pop("_id", None)
        return jsonify({"message": "Submission added", "submission": submission})
    except Exception as e:
        print(f"Error adding submission: {e}")
        return jsonify({"error": "Failed to add submission"}), 500

@movies_bp.route('/submissions/<submission_id>/image', methods=['GET'])
def get_submission_image(submission_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    try:
        image_doc = db.titlecard_images.find_one({"submissionId": submission_id})
        if not image_doc:
            return jsonify({"error": "Image not found"}), 404
        
        image_bytes = bytes(image_doc['imageData'])
        return Response(image_bytes, mimetype=image_doc.get('mimeType', 'image/jpeg'))
    except Exception as e:
        print(f"Error fetching submission image: {e}")
        return jsonify({"error": "Failed to fetch image"}), 500

@movies_bp.route('/submissions', methods=['GET'])
def get_submissions():
    movie_id = request.args.get('movieId')
    if not movie_id:
        return jsonify({"error": "Movie ID required"}), 400
        
    try:
        submissions_cursor = db.titlecards.find({"movieId": movie_id}).sort("createdAt", -1)
        submissions = []
        for s in submissions_cursor:
            s['id'] = str(s.pop('_id'))
            if s.get('createdAt'):
                s['createdAt'] = s['createdAt'].isoformat()
            submissions.append(s)
            
        return jsonify({"submissions": submissions})
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        return jsonify({"error": "Failed to fetch submissions"}), 500

def ensure_short_urls_index():
    try:
        if db is not None:
            db.short_urls.create_index("expiresAt", expireAfterSeconds=0)
    except Exception as e:
        print(f"Index creation error for short_urls: {e}")

@movies_bp.route('/<movie_id>/shorten', methods=['POST'])
def shorten_movie_url(movie_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    try:
        movie = db.movies.find_one({"_id": ObjectId(movie_id)})
        if not movie:
            return jsonify({"error": "Movie not found"}), 404
    except Exception:
        return jsonify({"error": "Invalid movie ID"}), 400

    ensure_short_urls_index()
    
    # Check if a valid short URL already exists for this movie
    now = datetime.datetime.now(datetime.timezone.utc)
    existing = db.short_urls.find_one({"movieId": movie_id, "expiresAt": {"$gt": now}})
    if existing and existing.get('code'):
        return jsonify({
            "code": existing['code'],
            "shortUrl": f"/m/{existing['code']}"
        })

    code = secrets.token_urlsafe(4)[:6].replace('-', 'x').replace('_', 'z')
    # Ensure code uniqueness
    while db.short_urls.find_one({"code": code}):
        code = secrets.token_urlsafe(4)[:6].replace('-', 'x').replace('_', 'z')

    expires_at = now + datetime.timedelta(days=30)
    db.short_urls.insert_one({
        "code": code,
        "movieId": movie_id,
        "createdAt": now,
        "expiresAt": expires_at
    })

    return jsonify({
        "code": code,
        "shortUrl": f"/m/{code}"
    })

@movies_bp.route('/m/<code>', methods=['GET'])
def resolve_short_movie_url(code):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    doc = db.short_urls.find_one({
        "code": code,
        "expiresAt": {"$gt": datetime.datetime.now(datetime.timezone.utc)}
    })
    if not doc or not doc.get('movieId'):
        return jsonify({"error": "Short URL not found or expired"}), 404
    return jsonify({"movieId": str(doc['movieId'])})

def clean_str(s):
    """Lowercase alphanumerics only. Accepts any type (year is stored as an int)."""
    if s is None:
        return ""
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

def movie_dedup_key(m):
    imdb = clean_str(m.get("imdbId"))
    if imdb and imdb != "na":
        return f"imdb:{imdb}"
    return f"title:{clean_str(m.get('title'))}_{clean_str(m.get('year'))}"

def find_movie_duplicate_groups():
    """Group movies by IMDb id (or title+year when there is no IMDb id).

    Returns [(key, kept_doc, [dup_docs...])] for groups with more than one doc.
    The doc with the most poster/plot detail wins.
    """
    from collections import defaultdict
    groups = defaultdict(list)
    for m in db.movies.find({}):
        key = movie_dedup_key(m)
        if key == "title:_":
            # Nothing to match on, so it can never be a duplicate of anything else.
            key = str(m["_id"])
        groups[key].append(m)

    result = []
    for key, docs in groups.items():
        if len(docs) < 2:
            continue
        docs.sort(key=lambda d: (len(str(d.get("posterUrl") or "")), len(str(d.get("plot") or ""))), reverse=True)
        result.append((key, docs[0], docs[1:]))
    return result

def serialize_movie(m):
    m = dict(m)
    m['id'] = str(m.pop('_id'))
    if m.get('createdAt') and hasattr(m['createdAt'], 'isoformat'):
        m['createdAt'] = m['createdAt'].isoformat()
    return m

def repoint_movie_references(dup_id, kept_id):
    """Move every reference to dup_id over to kept_id before the dup doc is deleted.

    Mirrors the cleanup in delete_movie, except records are re-linked instead of dropped.
    """
    db.titlecards.update_many({"movieId": dup_id}, {"$set": {"movieId": kept_id}})
    db.titlecard_images.update_many({"movieId": dup_id}, {"$set": {"movieId": kept_id}})
    db.short_urls.update_many({"movieId": dup_id}, {"$set": {"movieId": kept_id}})
    db.watch_link_reports.update_many(
        {"movieId": {"$in": [dup_id, ObjectId(dup_id)]}},
        {"$set": {"movieId": ObjectId(kept_id)}}
    )

    if db.movie_posters.find_one({"movieId": kept_id}):
        db.movie_posters.delete_one({"movieId": dup_id})
    else:
        db.movie_posters.update_one({"movieId": dup_id}, {"$set": {"movieId": kept_id}})

def recompute_movie_average(movie_id):
    times = [
        s['timeInSeconds'] for s in db.titlecards.find({"movieId": movie_id})
        if isinstance(s.get('timeInSeconds'), (int, float))
    ]
    if not times:
        return
    db.movies.update_one(
        {"_id": ObjectId(movie_id)},
        {"$set": {"averageTimeSeconds": sum(times) / len(times), "submissionCount": len(times)}}
    )

@movies_bp.route('/duplicates', methods=['GET'])
def get_movie_duplicates():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    duplicate_groups = []
    total_duplicates = 0
    for key, kept, dups in find_movie_duplicate_groups():
        total_duplicates += len(dups)
        duplicate_groups.append({
            "key": key,
            "kept": serialize_movie(kept),
            "duplicates": [serialize_movie(d) for d in dups]
        })

    return jsonify({
        "duplicateGroups": duplicate_groups,
        "totalDuplicatesCount": total_duplicates
    })

@movies_bp.route('/duplicates/merge', methods=['POST'])
def merge_movie_duplicates():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    total_merged = 0
    users_updated = set()

    for _key, kept, dups in find_movie_duplicate_groups():
        kept_id = str(kept["_id"])

        for dup in dups:
            old_id = str(dup["_id"])
            users_with_ref = db.users.find({
                "$or": [
                    {"watchHistory.movieId": old_id},
                    {"watchHistory.movieId": dup["_id"]}
                ]
            })

            for u in users_with_ref:
                wh = u.get("watchHistory", [])
                modified = False
                for entry in wh:
                    if str(entry.get("movieId")) == old_id:
                        # Stored as ObjectId by add_watch_history; delete_watch_history
                        # looks the movie up by that raw value, so keep the type.
                        entry["movieId"] = ObjectId(kept_id)
                        entry["imdbId"] = kept.get("imdbId")
                        entry["movieTitle"] = kept.get("title")
                        if kept.get("posterUrl"):
                            entry["moviePosterUrl"] = kept.get("posterUrl")
                        modified = True
                if modified:
                    db.users.update_one({"_id": u["_id"]}, {"$set": {"watchHistory": wh}})
                    users_updated.add(str(u["_id"]))

            repoint_movie_references(old_id, kept_id)
            db.movies.delete_one({"_id": dup["_id"]})
            total_merged += 1

        recompute_movie_average(kept_id)

    return jsonify({
        "message": f"Successfully merged {total_merged} duplicate movies and re-linked {len(users_updated)} watch histories!",
        "mergedCount": total_merged
    })

@movies_bp.route('/<movie_id>/verify', methods=['POST'])
def verify_movie(movie_id):
    """Mark a movie as verified (all metadata confirmed correct) or toggle it off.

    Body may contain {"verified": true|false}. When omitted, the current flag is toggled.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401

    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    if not ObjectId.is_valid(movie_id):
        return jsonify({"error": "Invalid movie ID"}), 400

    try:
        movie = db.movies.find_one({"_id": ObjectId(movie_id)})
        if not movie:
            return jsonify({"error": "Movie not found"}), 404

        data = request.get_json(silent=True) or {}
        if 'verified' in data:
            new_val = bool(data.get('verified'))
        else:
            new_val = not bool(movie.get('verified', False))

        db.movies.update_one({"_id": ObjectId(movie_id)}, {"$set": {"verified": new_val}})
        return jsonify({
            "message": "Movie verified" if new_val else "Movie marked unverified",
            "verified": new_val,
            "id": movie_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def _missing_runtime(m):
    rt = m.get('runtime')
    if rt is None:
        return True
    rt_str = str(rt).strip()
    if rt_str in ('', 'N/A', 'null', '0'):
        return True
    match = re.search(r'(\d+)', rt_str)
    return not match or int(match.group(1)) <= 0

def _missing_poster(m):
    p = m.get('posterUrl')
    return p is None or str(p).strip() in ('', 'N/A', 'null')

def _missing_titlecard(m):
    avg = m.get('averageTimeSeconds')
    subs = m.get('submissionCount')
    return not avg or avg <= 0 or not subs or subs <= 0

@movies_bp.route('/data-quality', methods=['GET'])
def movie_data_quality():
    """Report movies that are missing key data: runtime, poster, or title-card time.

    Used by the admin Data Quality panel so gaps can be found and fixed.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    limit = request.args.get('limit', 100, type=int)
    limit = min(max(limit, 1), 500)

    no_runtime, no_poster, no_titlecard = [], [], []

    def brief(m):
        return {
            "id": str(m["_id"]),
            "title": m.get("title") or "Untitled",
            "year": m.get("year"),
            "posterUrl": m.get("posterUrl"),
            "runtime": m.get("runtime"),
            "verified": bool(m.get("verified", False)),
        }

    for m in db.movies.find({}):
        if len(no_runtime) < limit and _missing_runtime(m):
            no_runtime.append(brief(m))
        if len(no_poster) < limit and _missing_poster(m):
            no_poster.append(brief(m))
        if len(no_titlecard) < limit and _missing_titlecard(m):
            no_titlecard.append(brief(m))

    return jsonify({
        "noRuntime": no_runtime,
        "noPoster": no_poster,
        "noTitleCard": no_titlecard,
        "counts": {
            "noRuntime": len(no_runtime),
            "noPoster": len(no_poster),
            "noTitleCard": len(no_titlecard),
        }
    })

@movies_bp.route('/lookup', methods=['GET'])
def lookup_movie():
    """Public: Lightweight movie lookup by IMDB ID for watch order enrichment."""
    imdb_id = request.args.get('imdbId')
    if not imdb_id:
        return jsonify({"error": "imdbId query parameter is required"}), 400
    
    try:
        movie = db.movies.find_one({"imdbId": imdb_id})
        if not movie:
            return jsonify({"error": "Movie not found"}), 404
        
        return jsonify({
            "id": str(movie['_id']),
            "imdbId": movie.get('imdbId'),
            "title": movie.get('title'),
            "year": movie.get('year'),
            "posterUrl": movie.get('posterUrl'),
            "runtime": movie.get('runtime'),
            "imdbRating": movie.get('imdbRating'),
            "averageTimeSeconds": movie.get('averageTimeSeconds'),
            "language": movie.get('language') or movie.get('Language')
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
