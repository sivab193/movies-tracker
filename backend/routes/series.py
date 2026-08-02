from flask import Blueprint, request, jsonify, Response
import os
import requests
import datetime
import re
from bson import ObjectId, Binary
from bson.errors import InvalidId
from mongo_config import db
from routes.movies import is_admin

series_bp = Blueprint('series', __name__)

OMDB_API_KEY = os.environ.get('OMDB_API_KEY')

def verify_admin(req):
    """Verifies if the requester is an admin using their Firebase token."""
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return is_admin(token)

def save_poster_to_db(series_id, poster_url):
    if not poster_url or poster_url == "N/A":
        return None
    try:
        response = requests.get(poster_url)
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

def fetch_series_full_data(imdb_id):
    if not OMDB_API_KEY:
        raise Exception("OMDB_API_KEY is not set")
    
    # Phase 1: Series level
    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={OMDB_API_KEY}"
    res = requests.get(url)
    if res.status_code != 200:
        raise Exception("Failed to fetch from OMDB")
    series_data = res.json()
    if series_data.get('Error'):
        raise Exception(series_data['Error'])
    if series_data.get('Type') != 'series':
        raise Exception("Not a TV series")
        
    try:
        total_seasons = int(series_data.get('totalSeasons', 0))
    except ValueError:
        total_seasons = 0
        
    try:
        imdb_rating = float(series_data.get('imdbRating', 0)) if series_data.get('imdbRating') != 'N/A' else None
    except ValueError:
        imdb_rating = None

    try:
        series_runtime = int(series_data.get('Runtime', '0').split(' ')[0]) if series_data.get('Runtime', 'N/A') != 'N/A' else 0
    except:
        series_runtime = 0

    end_year = None
    is_ongoing = False
    years = series_data.get('Year', '').split('–')
    try:
        start_year = int(years[0])
        if len(years) > 1 and years[1].strip():
            end_year = int(years[1])
        elif len(years) > 1:
            is_ongoing = True
    except:
        start_year = 2024

    seasons_array = []
    
    # Phase 2 & 3
    for s in range(1, total_seasons + 1):
        s_url = f"https://www.omdbapi.com/?i={imdb_id}&Season={s}&apikey={OMDB_API_KEY}"
        s_res = requests.get(s_url).json()
        if s_res.get('Response') == 'True':
            eps = s_res.get('Episodes', [])
            season_eps = []
            season_runtime = 0
            for ep in eps:
                ep_imdb = ep.get('imdbID')
                ep_details_url = f"https://www.omdbapi.com/?i={ep_imdb}&apikey={OMDB_API_KEY}"
                ep_details = requests.get(ep_details_url).json()
                
                try:
                    runtime = int(ep_details.get('Runtime', '0').split(' ')[0]) if ep_details.get('Runtime', 'N/A') != 'N/A' else series_runtime
                except:
                    runtime = series_runtime
                    
                season_runtime += runtime
                
                try:
                    ep_rating = float(ep_details.get('imdbRating', 0)) if ep_details.get('imdbRating') != 'N/A' else None
                except:
                    ep_rating = None
                    
                season_eps.append({
                    "episodeNumber": int(ep.get('Episode', 0)),
                    "title": ep.get('Title'),
                    "imdbId": ep_imdb,
                    "runtimeMinutes": runtime,
                    "airDate": ep_details.get('Released'),
                    "imdbRating": ep_rating
                })
            
            seasons_array.append({
                "seasonNumber": s,
                "episodeCount": len(season_eps),
                "seasonRuntimeMinutes": season_runtime,
                "episodes": season_eps
            })
            
    now = datetime.datetime.now(datetime.timezone.utc)
    doc = {
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
        "imdbRating": imdb_rating,
        "isOngoing": is_ongoing,
        "totalSeasons": total_seasons,
        "totalEpisodes": compute_total_episodes(seasons_array),
        "totalRuntimeMinutes": compute_total_runtime(seasons_array),
        "seasons": seasons_array,
        "createdAt": now,
        "updatedAt": now,
        "lastOmdbSync": now
    }
    
    return doc, series_data.get('Poster')

def format_doc(doc):
    doc['_id'] = str(doc['_id'])
    for field in ['createdAt', 'updatedAt', 'lastOmdbSync']:
        if doc.get(field) and hasattr(doc[field], 'isoformat'):
            doc[field] = doc[field].isoformat()
    return doc

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
        query = {"_id": ObjectId(series_id)} if ObjectId.is_valid(series_id) else {"imdbId": series_id}
        doc = db.series.find_one(query)
        if not doc:
            return jsonify({"error": "Series not found"}), 404
        return jsonify(format_doc(doc))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@series_bp.route('/fetch-omdb', methods=['POST'])
def fetch_omdb():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    imdb_id = data.get('imdbId')
    
    if not imdb_id or not imdb_id.startswith('tt'):
        return jsonify({"error": "Invalid IMDb ID format"}), 400
        
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
        
    existing = db.series.find_one({"imdbId": imdb_id})
    if existing:
        return jsonify({"error": "Series already exists", "series": format_doc(existing)}), 400
        
    try:
        doc, poster_url = fetch_series_full_data(imdb_id)
        result = db.series.insert_one(doc)
        series_id = str(result.inserted_id)
        
        if poster_url and poster_url != 'N/A':
            saved_url = save_poster_to_db(series_id, poster_url)
            if saved_url:
                db.series.update_one({"_id": ObjectId(series_id)}, {"$set": {"posterUrl": saved_url}})
                doc['posterUrl'] = saved_url
                
        doc['_id'] = series_id
        return jsonify(format_doc(doc))
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
        query = {"_id": ObjectId(series_id)} if ObjectId.is_valid(series_id) else {"imdbId": series_id}
        
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

@series_bp.route('/<series_id>', methods=['DELETE'])
def delete_series(series_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
        
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
        
    try:
        query = {"_id": ObjectId(series_id)} if ObjectId.is_valid(series_id) else {"imdbId": series_id}
        series = db.series.find_one(query)
        if not series:
            return jsonify({"error": "Series not found"}), 404
            
        real_id = str(series['_id'])
        db.series.delete_one({"_id": series['_id']})
        db.series_posters.delete_one({"seriesId": real_id})
        
        return jsonify({"message": "Series deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
    except Exception as e:
        return jsonify({"error": "Failed to fetch poster"}), 500

@series_bp.route('/<series_id>/refresh-omdb', methods=['POST'])
def refresh_omdb(series_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
        
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
        
    try:
        query = {"_id": ObjectId(series_id)} if ObjectId.is_valid(series_id) else {"imdbId": series_id}
        series = db.series.find_one(query)
        if not series:
            return jsonify({"error": "Series not found"}), 404
            
        imdb_id = series['imdbId']
        real_id = str(series['_id'])
        
        doc, poster_url = fetch_series_full_data(imdb_id)
        
        # Retain original createdAt
        doc['createdAt'] = series.get('createdAt', doc['createdAt'])
        
        if poster_url and poster_url != 'N/A':
            saved_url = save_poster_to_db(real_id, poster_url)
            if saved_url:
                doc['posterUrl'] = saved_url
                
        db.series.update_one({"_id": series['_id']}, {"$set": doc})
        doc['_id'] = real_id
        
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
