from flask import Blueprint, request, jsonify
import os
import requests
import datetime
from firebase_config import auth as firebase_auth
from mongo_config import db
from gcs_config import upload_image_from_url
from bson import ObjectId

movies_bp = Blueprint('movies', __name__)

OMDB_API_KEY = os.environ.get('OMDB_API_KEY')
# Admin check now uses DB only

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

def fetch_movie_from_omdb(imdb_id):
    if not OMDB_API_KEY:
        return {
            "Title": f"Movie {imdb_id}",
            "Year": "2024",
            "Poster": "N/A",
            "imdbRating": "N/A",
            "Runtime": "N/A"
        }

    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={OMDB_API_KEY}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to fetch from OMDB")
    data = response.json()
    if data.get('Error'):
        raise Exception(data['Error'])
    return data

@movies_bp.route('/', methods=['POST'])
def add_movie():
    # Verify Admin
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    data = request.get_json()
    imdb_id = data.get('imdbId')

    if not imdb_id or not imdb_id.startswith('tt'):
         return jsonify({"error": "Invalid IMDb ID format"}), 400

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    # Check if movie exists
    existing = db.movies.find_one({"imdbId": imdb_id})
    if existing:
        existing['_id'] = str(existing['_id'])
        return jsonify({"message": "Movie already exists", "movie": existing})

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

        # Upload poster to GCS
        omdb_poster_url = omdb_data.get('Poster')
        poster_url = None
        if omdb_poster_url and omdb_poster_url != "N/A":
            gcs_url = upload_image_from_url(omdb_poster_url, f"coverpics/{imdb_id}.jpg")
            poster_url = gcs_url if gcs_url else omdb_poster_url

        movie_data = {
            "imdbId": imdb_id,
            "title": omdb_data.get('Title'),
            "year": int(omdb_data.get('Year')) if omdb_data.get('Year', '').isdigit() else 2024,
            "posterUrl": poster_url,
            "imdbRating": float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating') != "N/A" else None,
            "runtime": runtime_str,
            "submissionCount": 0,
            "averageTimeSeconds": average_time_seconds,
            "createdAt": datetime.datetime.utcnow()
        }

        result = db.movies.insert_one(movie_data)
        movie_data['_id'] = str(result.inserted_id)
        
        return jsonify({"message": "Movie added successfully", "movie": movie_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@movies_bp.route('/', methods=['GET'])
def list_movies():
    if db is None:
        return jsonify({"movies": []})
    
    # Get optional limit param (default 50, max 500)
    limit = request.args.get('limit', 50, type=int)
    limit = min(limit, 500)
    
    # Get optional search/filter params
    title_search = request.args.get('title', '')
    year_filter = request.args.get('year', '')
    
    query = {}
    if title_search:
        query['title'] = {'$regex': title_search, '$options': 'i'}
    if year_filter:
        try:
            query['year'] = int(year_filter)
        except ValueError:
            pass
        
    # Sort by createdAt desc
    movies_cursor = db.movies.find(query).sort("createdAt", -1).limit(limit)
    
    movies = []
    for m in movies_cursor:
        m['id'] = str(m.pop('_id')) # Rename _id to id for frontend compatibility
        if m.get('createdAt'):
           m['createdAt'] = m['createdAt'].isoformat()
        movies.append(m)
        
    return jsonify({"movies": movies})

@movies_bp.route('/search-discover', methods=['GET'])
def search_omdb():
    query = request.args.get('s', '*')
    year = request.args.get('y')
    language_filter = request.args.get('language')
    upcoming_filter = request.args.get('upcoming')
    
    if not OMDB_API_KEY:
        return jsonify({"Search": [], "totalResults": "0", "Response": "True"})

    # Build OMDb URL with type=movie to exclude TV series
    url = f"https://www.omdbapi.com/?s={query}&type=movie&apikey={OMDB_API_KEY}"
    if year:
        url += f"&y={year}"
        
    response = requests.get(url)
    data = response.json()
    
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
                details_url = f"https://www.omdbapi.com/?i={m['imdbID']}&apikey={OMDB_API_KEY}"
                details_response = requests.get(details_url)
                details = details_response.json()
                
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

@movies_bp.route('/search-by-imdb', methods=['POST'])
def search_by_imdb_ids():
    """Search for movies by IMDb IDs"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    
    data = request.get_json()
    imdb_ids = data.get('imdbIds', [])
    
    if not imdb_ids:
        return jsonify({"error": "No IMDb IDs provided"}), 400
    
    if not OMDB_API_KEY:
        return jsonify({"Search": [], "Response": "True"})
    
    results = []
    for imdb_id in imdb_ids[:50]:  # Limit to 50 IDs
        if not imdb_id.startswith('tt'):
            continue
            
        url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={OMDB_API_KEY}"
        response = requests.get(url)
        movie_data = response.json()
        
        if movie_data.get('Response') == 'True':
            # Check if exists in DB
            existing = db.movies.find_one({"imdbId": imdb_id})
            movie_data['exists'] = existing is not None
            movie_data['imdbID'] = imdb_id  # Ensure uppercase ID for consistency
            results.append(movie_data)
    
    return jsonify({"Search": results, "Response": "True"})


@movies_bp.route('/bulk-add', methods=['POST'])
def bulk_add_movies():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    data = request.get_json()
    imdb_ids = data.get('imdbIds', [])

    if not imdb_ids:
        return jsonify({"error": "No IMDb IDs provided"}), 400

    results = {"added": [], "skipped": [], "errors": []}
    
    for imdb_id in imdb_ids:
        if not imdb_id or not imdb_id.startswith('tt'):
            results["errors"].append({"id": imdb_id, "error": "Invalid format"})
            continue
            
        # Check if movie exists
        existing = db.movies.find_one({"imdbId": imdb_id})
        if existing:
            results["skipped"].append(imdb_id)
            continue

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

            # Upload poster to GCS
            omdb_poster_url = omdb_data.get('Poster')
            poster_url = None
            if omdb_poster_url and omdb_poster_url != "N/A":
                gcs_url = upload_image_from_url(omdb_poster_url, f"coverpics/{imdb_id}.jpg")
                poster_url = gcs_url if gcs_url else omdb_poster_url

            movie_data = {
                "imdbId": imdb_id,
                "title": omdb_data.get('Title'),
                "year": int(omdb_data.get('Year')) if str(omdb_data.get('Year', '')).isdigit() else 2024,
                "posterUrl": poster_url,
                "imdbRating": float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating') != "N/A" else None,
                "runtime": runtime_str,
                "submissionCount": 0,
                "averageTimeSeconds": average_time_seconds,
                "createdAt": datetime.datetime.utcnow()
            }

            db.movies.insert_one(movie_data)
            results["added"].append(imdb_id)
        except Exception as e:
            results["errors"].append({"id": imdb_id, "error": str(e)})

    return jsonify(results)

@movies_bp.route('/<movie_id>', methods=['GET'])
def get_movie(movie_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        if not ObjectId.is_valid(movie_id):
            return jsonify({"error": "Invalid movie ID"}), 400

        movie = db.movies.find_one({"_id": ObjectId(movie_id)})
        
        if not movie:
            return jsonify({"error": "Movie not found"}), 404
            
        movie['id'] = str(movie.pop('_id'))
        if movie.get('createdAt'):
            movie['createdAt'] = movie['createdAt'].isoformat()
            
        return jsonify(movie)
    except Exception as e:
        print(f"Error fetching movie: {e}")
        return jsonify({"error": "Failed to fetch movie"}), 500

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
        
        # Also delete related submissions
        db.submissions.delete_many({"movieId": movie_id})
            
        return jsonify({"message": "Movie deleted successfully"})
    except Exception as e:
        print(f"Error deleting movie: {e}")
        return jsonify({"error": "Failed to delete movie"}), 500

@movies_bp.route('/submissions', methods=['POST'])
def add_submission():
    data = request.get_json()
    movie_id = data.get('movieId')
    time_in_seconds = data.get('timeInSeconds')
    raw_input = data.get('rawInput')
    comment = data.get('comment')
    
    # Rate limiting check (using IP for anonymous)
    ip_address = request.remote_addr
    # Simple check: has this IP submitted for this movie in the last hour?
    one_hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    recent_sub = db.submissions.find_one({
        "movieId": movie_id,
        "ipAddress": ip_address,
        "createdAt": {"$gt": one_hour_ago}
    })
    
    if recent_sub:
        return jsonify({"error": "You've already submitted for this movie recently."}), 429

    if not movie_id or time_in_seconds is None:
        return jsonify({"error": "Missing required fields"}), 400
        
    try:
        submission = {
            "movieId": movie_id,
            "timeInSeconds": time_in_seconds,
            "rawInput": raw_input,
            "comment": comment,
            "ipAddress": ip_address,
            "createdAt": datetime.datetime.utcnow()
        }
        
        result = db.submissions.insert_one(submission)
        
        # Update movie average
        all_subs = list(db.submissions.find({"movieId": movie_id}))
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
            
        return jsonify({"message": "Submission added", "id": str(result.inserted_id)})
    except Exception as e:
        print(f"Error adding submission: {e}")
        return jsonify({"error": "Failed to add submission"}), 500

@movies_bp.route('/submissions', methods=['GET'])
def get_submissions():
    movie_id = request.args.get('movieId')
    if not movie_id:
        return jsonify({"error": "Movie ID required"}), 400
        
    try:
        submissions_cursor = db.submissions.find({"movieId": movie_id}).sort("createdAt", -1)
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
