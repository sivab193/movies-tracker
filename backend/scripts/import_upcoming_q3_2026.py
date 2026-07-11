import os
import sys
import re
import urllib.parse
import json
import datetime
import requests
from dotenv import load_dotenv
from bson import ObjectId, Binary

# Ensure backend root is on the path for imports
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

# Load env from backend folder
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from mongo_config import db

OMDB_API_KEY = os.environ.get('OMDB_API_KEY', 'd8dd897d')

UPCOMING_MOVIES = [
    {"title": "Varavu", "year": 2026, "language": "Malayalam", "released": "July 16, 2026", "releaseDate": "2026-07-16"},
    {"title": "The Millet Diary", "year": 2026, "language": "Odia", "released": "July 16, 2026", "releaseDate": "2026-07-16"},
    {"title": "The Odyssey", "year": 2026, "language": "English", "released": "July 17, 2026", "releaseDate": "2026-07-17"},
    {"title": "G.D.N.", "year": 2026, "language": "Tamil / Hindi", "released": "July 17, 2026", "releaseDate": "2026-07-17"},
    {"title": "Arjunar Per Paththu", "year": 2026, "language": "Tamil", "released": "July 17, 2026", "releaseDate": "2026-07-17"},
    {"title": "Oh..! Sukumari", "year": 2026, "language": "Telugu", "released": "July 17, 2026", "releaseDate": "2026-07-17"},
    {"title": "Immortal", "year": 2026, "language": "Tamil", "released": "July 23, 2026", "releaseDate": "2026-07-23"},
    {"title": "Attack on Titan: The Last Attack", "year": 2026, "language": "Japanese", "released": "July 24, 2026", "releaseDate": "2026-07-24"},
    {"title": "The India Story", "year": 2026, "language": "Hindi", "released": "July 24, 2026", "releaseDate": "2026-07-24"},
    {"title": "Karavali", "year": 2026, "language": "Kannada", "released": "July 24, 2026", "releaseDate": "2026-07-24"},
    {"title": "Chennai Love Story", "year": 2026, "language": "Telugu", "released": "July 25, 2026", "releaseDate": "2026-07-25"},
    {"title": "Bhai Tera Star Hai", "year": 2026, "language": "Hindi", "released": "July 30, 2026", "releaseDate": "2026-07-30"},
    {"title": "Spider-Man: Brand New Day", "year": 2026, "language": "English", "released": "July 31, 2026", "releaseDate": "2026-07-31"},
    {"title": "Sigma", "year": 2026, "language": "Telugu", "released": "July 31, 2026", "releaseDate": "2026-07-31"},
    {"title": "Unmadham", "year": 2026, "language": "Malayalam", "released": "July 31, 2026", "releaseDate": "2026-07-31"},
    {"title": "Bhediya 2", "year": 2026, "language": "Hindi", "released": "August 14, 2026", "releaseDate": "2026-08-14"},
    {"title": "Insidious: Out of the Further", "year": 2026, "language": "English", "released": "August 21, 2026", "releaseDate": "2026-08-21"},
    {"title": "Toxic", "year": 2026, "language": "Kannada", "released": "August 26, 2026", "releaseDate": "2026-08-26"},
    {"title": "PAW Patrol: The Dino Movie", "year": 2026, "language": "English", "released": "August 28, 2026", "releaseDate": "2026-08-28"},
    {"title": "Mirzapur: The Movie", "year": 2026, "language": "Hindi", "released": "September 04, 2026", "releaseDate": "2026-09-04"},
    {"title": "Sardar 2", "year": 2026, "language": "Tamil", "released": "September 10, 2026", "releaseDate": "2026-09-10"},
    {"title": "Practical Magic 2", "year": 2026, "language": "English", "released": "September 11, 2026", "releaseDate": "2026-09-11"},
    {"title": "Resident Evil", "year": 2026, "language": "English", "released": "September 18, 2026", "releaseDate": "2026-09-18"},
    {"title": "Heart of the Beast", "year": 2026, "language": "English", "released": "September 25, 2026", "releaseDate": "2026-09-25"}
]

def normalize(title):
    return re.sub(r'[^a-z0-9]', '', title.lower())

def search_suggest_api(title):
    clean_title = title.strip().lower()
    if not clean_title:
        return []
    first_char = clean_title[0]
    encoded_title = urllib.parse.quote(clean_title)
    url = f"https://sg.media-imdb.com/suggests/{first_char}/{encoded_title}.json"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            text = response.text
            match = re.search(r'imdb\$.*?\((.*)\)', text, re.DOTALL)
            if match:
                return json.loads(match.group(1)).get('d', [])
            match_generic = re.search(r'^[a-zA-Z0-9_]+\((.*)\)$', text.strip(), re.DOTALL)
            if match_generic:
                return json.loads(match_generic.group(1)).get('d', [])
    except Exception as e:
        print(f"Error querying suggest API for {title}: {e}")
    return []

def search_omdb_api(title):
    if not OMDB_API_KEY:
        return []
    encoded_title = urllib.parse.quote(title)
    url = f"https://www.omdbapi.com/?s={encoded_title}&type=movie&apikey={OMDB_API_KEY}"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get('Response') == 'True':
                return data.get('Search', [])
    except Exception as e:
        print(f"Error querying OMDB for {title}: {e}")
    return []

def find_best_imdb_match(title):
    norm_title = normalize(title)
    suggest_results = search_suggest_api(title)
    candidates = []
    
    for item in suggest_results:
        item_id = item.get('id', '')
        if not item_id.startswith('tt'):
            continue
        item_title = item.get('l', '')
        item_year = item.get('y')
        item_type = item.get('q', '')
        
        if normalize(item_title) == norm_title or norm_title in normalize(item_title):
            score = 0
            if item_type == 'feature':
                score += 10
            if item_year in [2025, 2026, 2027]:
                score += 30
            elif item_year == 2024:
                score += 5
            candidates.append((score, item_id, item_title, item_year, "Suggest API"))
            
    omdb_results = search_omdb_api(title)
    for item in omdb_results:
        item_id = item.get('imdbID', '')
        item_title = item.get('Title', '')
        item_year_str = item.get('Year', '')
        year_match = re.search(r'\d{4}', item_year_str)
        item_year = int(year_match.group(0)) if year_match else None
        
        if normalize(item_title) == norm_title or norm_title in normalize(item_title):
            score = 5
            if item_year in [2025, 2026, 2027]:
                score += 30
            candidates.append((score, item_id, item_title, item_year, "OMDB Search"))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        best = candidates[0]
        return best[1], f"Matched '{best[2]}' ({best[3]}) via {best[4]} (Score: {best[0]})"
        
    return None, "Not Found"

def save_poster_to_db(movie_id, poster_url):
    if not poster_url or poster_url == "N/A":
        return None
    try:
        response = requests.get(poster_url, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            image_data = Binary(response.content)
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
        print(f"  ⚠️ Error saving poster to MongoDB: {e}")
    return None

def fetch_movie_from_omdb(imdb_id):
    if not OMDB_API_KEY:
        return {}
    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={OMDB_API_KEY}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('Response') == 'True':
                return data
    except Exception as e:
        pass
    return {}

def main():
    if db is None:
        print("❌ Cannot connect to MongoDB. Make sure MONGO_URI is configured properly in .env")
        return

    print("🎬 Starting import for Q3 2026 Upcoming Releases (July – September 2026)")
    print("========================================================================\n")

    success_count = 0
    for idx, item in enumerate(UPCOMING_MOVIES):
        title = item["title"]
        print(f"[{idx+1}/{len(UPCOMING_MOVIES)}] Processing: '{title}' ({item['language']})...")
        
        # 1. Search for IMDb match
        imdb_id, match_info = find_best_imdb_match(title)
        if imdb_id:
            print(f"  🔍 {match_info} -> ID: {imdb_id}")
        else:
            # Fallback custom ID if not yet indexed on IMDb suggest
            slug = normalize(title)[:15]
            imdb_id = f"tt_2026_{slug}"
            print(f"  ℹ️ No exact IMDb suggest match found. Using placeholder ID: {imdb_id}")

        # 2. Check if OMDB has extra info (like Poster or exact Runtime)
        omdb_data = fetch_movie_from_omdb(imdb_id) if imdb_id.startswith("tt") and not imdb_id.startswith("tt_") else {}
        
        runtime_str = omdb_data.get('Runtime', 'N/A') if omdb_data.get('Runtime', 'N/A') != 'N/A' else "N/A"
        average_time_seconds = 0
        if runtime_str != 'N/A':
            try:
                minutes = int(runtime_str.split(' ')[0])
                average_time_seconds = minutes * 60
            except Exception:
                pass

        # 3. Build movie document (prefer explicit table release dates so the filter works perfectly!)
        movie_doc = {
            "imdbId": imdb_id,
            "title": omdb_data.get('Title') or title,
            "year": 2026,
            "imdbRating": float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating', 'N/A') != 'N/A' else None,
            "runtime": runtime_str,
            "language": item["language"],
            "Language": item["language"],
            "released": item["released"],
            "releaseDate": item["releaseDate"],
            "averageTimeSeconds": average_time_seconds
        }

        # Check existing in database by title or imdbId
        existing = db.movies.find_one({"$or": [{"imdbId": imdb_id}, {"title": title, "year": 2026}]})
        
        if existing:
            db.movies.update_one(
                {"_id": existing["_id"]},
                {"$set": movie_doc}
            )
            movie_id = str(existing["_id"])
            print(f"  ✅ Updated existing DB entry for '{movie_doc['title']}' (ID: {movie_id})")
        else:
            movie_doc["posterUrl"] = None
            movie_doc["submissionCount"] = 0
            movie_doc["createdAt"] = datetime.datetime.now(datetime.timezone.utc)
            result = db.movies.insert_one(movie_doc)
            movie_id = str(result.inserted_id)
            print(f"  ✅ Inserted new DB entry for '{movie_doc['title']}' (ID: {movie_id})")

        # 4. Save poster if found from OMDB
        omdb_poster_url = omdb_data.get('Poster')
        if omdb_poster_url and omdb_poster_url != "N/A":
            poster_url = save_poster_to_db(movie_id, omdb_poster_url)
            if poster_url:
                db.movies.update_one({"_id": ObjectId(movie_id)}, {"$set": {"posterUrl": poster_url}})
                print(f"  🖼️ Saved binary poster to MongoDB")

        success_count += 1
        print("")

    print(f"✨ Q3 2026 Upcoming Releases Import Completed! {success_count}/{len(UPCOMING_MOVIES)} movies processed successfully.")

if __name__ == "__main__":
    main()
