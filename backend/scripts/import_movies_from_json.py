#!/usr/bin/env python3
"""
🎬 Universal Movie Importer from JSON
=====================================
Usage:
    python3 scripts/import_movies_from_json.py [path_to_json_file]

If no file path is provided, defaults to 'scripts/upcoming_movies.json'.

Expected JSON format (Array of movie objects):
[
  {
    "title": "Varavu",
    "year": 2026,
    "language": "Malayalam",
    "released": "July 16, 2026",
    "releaseDate": "2026-07-16"
  },
  ...
]
"""

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

def normalize(title):
    if not title:
        return ""
    return re.sub(r'[^a-z0-9]', '', str(title).lower())

def search_suggest_api(title):
    clean_title = str(title).strip().lower()
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
    encoded_title = urllib.parse.quote(str(title))
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

def find_best_imdb_match(title, target_year=None):
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
            if target_year and item_year == target_year:
                score += 40
            elif item_year in [2025, 2026, 2027]:
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
            if target_year and item_year == target_year:
                score += 40
            elif item_year in [2025, 2026, 2027]:
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
        sys.exit(1)

    # Determine JSON file path
    json_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "upcoming_movies.json")
    
    if not os.path.exists(json_path):
        print(f"❌ Error: JSON file not found at: {json_path}")
        print("Usage: python3 scripts/import_movies_from_json.py [path_to_json_file]")
        sys.exit(1)

    print(f"📂 Loading movie data from: {json_path}")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Handle both list [...] and dict {"movies": [...]}
            movies_list = data if isinstance(data, list) else data.get("movies", data.get("data", []))
    except Exception as e:
        print(f"❌ Error parsing JSON file: {e}")
        sys.exit(1)

    if not isinstance(movies_list, list) or len(movies_list) == 0:
        print("⚠️ No movie objects found in JSON file.")
        sys.exit(0)

    print(f"🎬 Found {len(movies_list)} movies to process.")
    print("========================================================================\n")

    success_count = 0
    for idx, item in enumerate(movies_list):
        title = item.get("title") or item.get("Title")
        if not title:
            print(f"[{idx+1}/{len(movies_list)}] ⚠️ Skipping item with missing title: {item}")
            continue

        target_year = int(item.get("year") or item.get("Year") or 2026)
        lang = item.get("language") or item.get("Language") or "English"
        released_str = item.get("released") or item.get("Released") or f"{target_year}-01-01"
        release_date = item.get("releaseDate") or item.get("ReleaseDate")
        
        # If no explicit ISO releaseDate, try to guess or fallback
        if not release_date:
            if re.match(r'^\d{4}-\d{2}-\d{2}$', str(released_str)):
                release_date = released_str
            else:
                release_date = f"{target_year}-01-01"

        print(f"[{idx+1}/{len(movies_list)}] Processing: '{title}' ({lang}, {target_year})...")
        
        # 1. Search for IMDb match
        imdb_id, match_info = find_best_imdb_match(title, target_year)
        if imdb_id:
            print(f"  🔍 {match_info} -> ID: {imdb_id}")
        else:
            # Fallback custom ID if not yet indexed on IMDb suggest
            slug = normalize(title)[:15]
            imdb_id = f"tt_{target_year}_{slug}"
            print(f"  ℹ️ No exact IMDb suggest match found. Using placeholder ID: {imdb_id}")

        # 2. Check if OMDB has extra info (like Poster or exact Runtime)
        omdb_data = fetch_movie_from_omdb(imdb_id) if imdb_id.startswith("tt") and not imdb_id.startswith("tt_") else {}
        
        runtime_str = omdb_data.get('Runtime', 'N/A') if omdb_data.get('Runtime', 'N/A') != 'N/A' else item.get("runtime", "N/A")
        average_time_seconds = item.get("averageTimeSeconds", 0)
        if runtime_str != 'N/A' and average_time_seconds == 0:
            try:
                minutes = int(runtime_str.split(' ')[0])
                average_time_seconds = minutes * 60
            except Exception:
                pass

        # 3. Build movie document
        movie_doc = {
            "imdbId": imdb_id,
            "title": omdb_data.get('Title') or title,
            "year": target_year,
            "imdbRating": float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating', 'N/A') != 'N/A' else item.get("imdbRating"),
            "runtime": runtime_str,
            "language": lang,
            "Language": lang,
            "released": released_str,
            "releaseDate": release_date,
            "averageTimeSeconds": average_time_seconds
        }

        # Check existing in database by title + year or imdbId
        existing = db.movies.find_one({"$or": [{"imdbId": imdb_id}, {"title": title, "year": target_year}]})
        
        if existing:
            db.movies.update_one(
                {"_id": existing["_id"]},
                {"$set": movie_doc}
            )
            movie_id = str(existing["_id"])
            print(f"  ✅ Updated existing DB entry for '{movie_doc['title']}' (ID: {movie_id})")
        else:
            movie_doc["posterUrl"] = None
            movie_doc["submissionCount"] = item.get("submissionCount", 0)
            movie_doc["createdAt"] = datetime.datetime.now(datetime.timezone.utc)
            result = db.movies.insert_one(movie_doc)
            movie_id = str(result.inserted_id)
            print(f"  ✅ Inserted new DB entry for '{movie_doc['title']}' (ID: {movie_id})")

        # 4. Save poster if found from OMDB or JSON item
        omdb_poster_url = omdb_data.get('Poster') or item.get("posterUrl")
        if omdb_poster_url and omdb_poster_url != "N/A" and not str(omdb_poster_url).startswith("/api/"):
            poster_url = save_poster_to_db(movie_id, omdb_poster_url)
            if poster_url:
                db.movies.update_one({"_id": ObjectId(movie_id)}, {"$set": {"posterUrl": poster_url}})
                print(f"  🖼️ Saved binary poster to MongoDB")

        success_count += 1
        print("")

    print(f"✨ Import Completed! {success_count}/{len(movies_list)} movies processed successfully.")

if __name__ == "__main__":
    main()
