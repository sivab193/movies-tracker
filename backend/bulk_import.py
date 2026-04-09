import os
import sys
import argparse
import datetime
from dotenv import load_dotenv

# Ensure we can load from current directory modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from mongo_config import db
from routes.movies import fetch_movie_from_omdb
from gcs_config import upload_image_from_url


def import_movies(imdb_ids):
    if db is None:
        print("Database connection failed. Check MONGO_URI in .env")
        return

    print(f"Starting import for {len(imdb_ids)} movies...")

    added = 0
    skipped = 0
    errors = 0

    for imdb_id in imdb_ids:
        imdb_id = imdb_id.strip()
        if not imdb_id or not imdb_id.startswith('tt'):
            print(f"  SKIP  Invalid IMDb ID format: {imdb_id}")
            skipped += 1
            continue

        existing = db.movies.find_one({"imdbId": imdb_id})
        if existing:
            print(f"  SKIP  {imdb_id} — already exists as '{existing.get('title')}'")
            skipped += 1
            continue

        try:
            print(f"  FETCH {imdb_id} from OMDb...")
            omdb_data = fetch_movie_from_omdb(imdb_id)

            runtime_str = omdb_data.get('Runtime', 'N/A')
            average_time_seconds = 0
            if runtime_str != 'N/A':
                try:
                    minutes = int(runtime_str.split(' ')[0])
                    average_time_seconds = minutes * 60
                except (ValueError, IndexError):
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
                "imdbRating": float(omdb_data.get('imdbRating')) if str(omdb_data.get('imdbRating', '')).replace('.', '', 1).isdigit() else None,
                "runtime": runtime_str,
                "submissionCount": 0,
                "averageTimeSeconds": average_time_seconds,
                "createdAt": datetime.datetime.utcnow()
            }

            db.movies.insert_one(movie_data)
            print(f"  ADDED {movie_data['title']} ({imdb_id})")
            added += 1
        except Exception as e:
            print(f"  ERROR {imdb_id}: {e}")
            errors += 1

    print(f"\nDone! Added: {added} | Skipped: {skipped} | Errors: {errors}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk import movies by IMDb ID directly to MongoDB")
    parser.add_argument('ids', nargs='*', help="IMDb IDs (e.g. tt1234567) to import directly via command line")
    parser.add_argument('-f', '--file', type=str, help="Path to a text file containing IMDb IDs (one per line)")

    args = parser.parse_args()

    ids_to_import = []

    # Collect IDs from command line
    if args.ids:
        ids_to_import.extend(args.ids)

    # Collect IDs from file if provided
    if args.file:
        try:
            with open(args.file, 'r') as f:
                file_ids = [line.strip() for line in f if line.strip() and line.strip().startswith('tt')]
                ids_to_import.extend(file_ids)
        except Exception as e:
            print(f"Error reading file {args.file}: {e}")
            sys.exit(1)

    # Remove duplicates while preserving order
    seen = set()
    unique_ids = []
    for id in ids_to_import:
        if id not in seen:
            seen.add(id)
            unique_ids.append(id)
    ids_to_import = unique_ids

    if not ids_to_import:
        print("No valid IMDb IDs provided. Usage examples:")
        print("  python bulk_import.py tt1234567 tt7654321")
        print("  python bulk_import.py -f ids.txt")
        sys.exit(1)

    import_movies(ids_to_import)
