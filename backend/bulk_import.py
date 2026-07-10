import os
import sys
import csv
import datetime
import argparse
import requests
from dotenv import load_dotenv
from bson import ObjectId, Binary

# Load env variables from backend/.env
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mongo_config import db

OMDB_API_KEY = os.environ.get('OMDB_API_KEY')

def fetch_movie_from_omdb(imdb_id):
    if not OMDB_API_KEY:
        raise Exception("OMDB_API_KEY not found in environment.")
    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={OMDB_API_KEY}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch {imdb_id} from OMDB. Status: {response.status_code}")
    data = response.json()
    if data.get('Error'):
        raise Exception(f"OMDb Error for {imdb_id}: {data['Error']}")
    return data

def save_poster_to_db(movie_id, poster_url):
    if not poster_url or poster_url == "N/A":
        return None
    try:
        response = requests.get(poster_url)
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

def parse_release_date_to_iso(released_str, year_val=None):
    if not released_str or released_str == 'N/A':
        if year_val:
            return f"{str(year_val)[:4]}-01-01"
        return "1970-01-01"
    try:
        dt = datetime.datetime.strptime(str(released_str).strip(), "%d %b %Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        try:
            dt = datetime.datetime.strptime(str(released_str).strip(), "%b %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            try:
                if len(str(released_str)) == 10 and str(released_str)[4] == '-' and str(released_str)[7] == '-':
                    return str(released_str)
                return f"{str(released_str)[:4]}-01-01"
            except:
                if year_val:
                    return f"{str(year_val)[:4]}-01-01"
                return "1970-01-01"

def import_movies_from_csv(csv_path, year=0, min_year=0, min_rating=0.0, min_votes=0, limit=20):
    if db is None:
        print("❌ Error: MongoDB connection is not active.")
        return

    if not os.path.exists(csv_path):
        print(f"❌ Error: CSV file not found at {csv_path}")
        return

    print(f"📖 Reading movies from {csv_path}...")
    filtered_movies = []

    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse row values
            tconst = row.get('tconst')
            title = row.get('primaryTitle')
            
            try:
                start_year = int(row.get('startYear')) if row.get('startYear') else None
            except ValueError:
                start_year = None
                
            try:
                rating = float(row.get('averageRating')) if row.get('averageRating') else 0.0
            except ValueError:
                rating = 0.0
                
            try:
                votes = int(row.get('numVotes')) if row.get('numVotes') else 0
            except ValueError:
                votes = 0

            # Apply filters
            if year > 0:
                if start_year != year:
                    continue
            elif min_year > 0:
                if start_year is None or start_year < min_year:
                    continue

            if rating < min_rating:
                continue
            if votes < min_votes:
                continue

            filtered_movies.append({
                "imdbId": tconst,
                "title": title,
                "year": start_year
            })

    total_matches = len(filtered_movies)
    print(f"🎯 Found {total_matches} matching movies after applying filters.")
    if total_matches == 0:
        return

    print(f"🚀 Starting bulk import (limit: {limit} movies)...")
    imported_count = 0
    skipped_count = 0

    for idx, movie in enumerate(filtered_movies):
        if imported_count >= limit:
            print(f"\n✋ Reached the import limit of {limit} movies.")
            break

        imdb_id = movie["imdbId"]
        print(f"[{idx+1}/{total_matches}] Checking {imdb_id} ('{movie['title']}')...")

        # Check if already exists in db (Ensures NO duplicates)
        existing = db.movies.find_one({"imdbId": imdb_id})
        if existing:
            print(f"  ℹ️ Movie already exists in DB. Skipping.")
            skipped_count += 1
            continue

        try:
            omdb_data = fetch_movie_from_omdb(imdb_id)
            
            runtime_str = omdb_data.get('Runtime', 'N/A')
            average_time_seconds = 0
            if runtime_str != 'N/A':
                try:
                    minutes = int(runtime_str.split(' ')[0])
                    average_time_seconds = minutes * 60
                except Exception:
                    pass

            lang = omdb_data.get('Language', 'English')
            rel_str = omdb_data.get('Released', str(omdb_data.get('Year', '')))
            year_val = int(omdb_data.get('Year')) if str(omdb_data.get('Year', '')).isdigit() else (movie["year"] or 2026)
            rel_date = parse_release_date_to_iso(rel_str, year_val)

            movie_data = {
                "imdbId": imdb_id,
                "title": omdb_data.get('Title'),
                "year": year_val,
                "posterUrl": None,
                "imdbRating": float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating') != "N/A" else None,
                "runtime": runtime_str,
                "language": lang,
                "Language": lang,
                "released": rel_str,
                "releaseDate": rel_date,
                "submissionCount": 0,
                "averageTimeSeconds": average_time_seconds,
                "createdAt": datetime.datetime.now(datetime.timezone.utc)
            }

            result = db.movies.insert_one(movie_data)
            movie_id = str(result.inserted_id)

            # Save poster to database
            omdb_poster_url = omdb_data.get('Poster')
            if omdb_poster_url and omdb_poster_url != "N/A":
                poster_url = save_poster_to_db(movie_id, omdb_poster_url)
                if poster_url:
                    db.movies.update_one({"_id": ObjectId(movie_id)}, {"$set": {"posterUrl": poster_url}})
            
            print(f"  ✅ Successfully imported: '{movie_data['title']}' ({movie_data['year']})")
            imported_count += 1

        except Exception as e:
            print(f"  ❌ Error importing {imdb_id}: {e}")

    print(f"\n✨ Bulk import finished! Imported: {imported_count}, Skipped: {skipped_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk import movies from a CSV file using OMDb API into MongoDB.")
    parser.add_argument("--csv", type=str, default="results_with_crew.csv", help="Path to the movies CSV file (default: results_with_crew.csv)")
    parser.add_argument("--year", type=int, default=0, help="Filter movies by specific release year (e.g. 2026)")
    parser.add_argument("--min-year", type=int, default=0, help="Filter movies by minimum release year (e.g. 2020)")
    parser.add_argument("--min-rating", type=float, default=0.0, help="Filter movies by minimum IMDb rating")
    parser.add_argument("--min-votes", type=int, default=0, help="Filter movies by minimum IMDb votes")
    parser.add_argument("--limit", type=int, default=20, help="Maximum number of movies to import (default: 20)")
    
    args = parser.parse_args()

    csv_file_path = os.path.join(os.path.dirname(__file__), args.csv)
    import_movies_from_csv(
        csv_path=csv_file_path,
        year=args.year,
        min_year=args.min_year,
        min_rating=args.min_rating,
        min_votes=args.min_votes,
        limit=args.limit
    )
