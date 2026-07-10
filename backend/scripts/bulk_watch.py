import os
import sys
import csv
import argparse
import datetime
from bson import ObjectId
from dotenv import load_dotenv

# Ensure backend root is on the path for imports and .env lookup
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

try:
    from mongo_config import db
except Exception as e:
    print(f"❌ Error importing mongo_config: {e}")
    sys.exit(1)

DEFAULT_CSV = """imdb_id,theater_name,date,ticket_cost,currency
tt1375666,PVR Cinemas,2026-01-15,350,INR
tt0468569,INOX,2026-02-10,400,INR"""

def main():
    parser = argparse.ArgumentParser(description="Bulk add watch history entries from a CSV file.")
    parser.add_argument("--csv", default="watch_history.csv", help="Path to CSV file (default: watch_history.csv)")
    parser.add_argument("--uid", required=False, help="Firebase UID of the user to add watch entries for")
    args = parser.parse_args()

    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), args.csv)

    if not os.path.exists(file_path):
        print(f"⚠️  File '{args.csv}' not found. Creating a sample '{args.csv}'...")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(DEFAULT_CSV + "\n")
        print(f"✅ Created sample '{args.csv}'. Review it, add your entries, and run again with --uid <your_firebase_uid>.")
        return

    if not args.uid:
        print("❌ Error: --uid argument is required when importing watch history.")
        print("Usage: python3 bulk_watch.py --uid <your_firebase_uid> [--csv watch_history.csv]")
        return

    user = db.users.find_one({"firebaseUid": args.uid})
    if not user:
        print(f"❌ Error: User with Firebase UID '{args.uid}' not found in MongoDB.")
        return

    print(f"👤 Found user: {user.get('displayName', user.get('email', args.uid))}")
    print(f"📖 Reading watch history from {file_path}...")

    added_count = 0
    skipped_count = 0
    total_runtime_added = 0

    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"📦 Found {len(rows)} entries in CSV.")

    for idx, row in enumerate(rows, 1):
        imdb_id = row.get("imdb_id", "").strip()
        theater_name = row.get("theater_name", "").strip()
        date_str = row.get("date", "").strip() or datetime.datetime.now(datetime.timezone.utc).isoformat()
        ticket_cost = row.get("ticket_cost", "0").strip()
        currency = row.get("currency", "INR").strip()

        if not imdb_id:
            print(f"[{idx}/{len(rows)}] ⚠️  Skipped row without imdb_id")
            skipped_count += 1
            continue

        try:
            ticket_cost = float(ticket_cost) if ticket_cost else 0
        except ValueError:
            ticket_cost = 0

        # Look up movie
        movie = db.movies.find_one({"imdbId": imdb_id})
        if not movie:
            print(f"[{idx}/{len(rows)}] ⚠️  Skipped: Movie '{imdb_id}' not found in movies database. Import it first via bulk_import.py.")
            skipped_count += 1
            continue

        movie_id = movie["_id"]
        runtime = int(movie.get("runtime", 0) or 0)

        # Look up theater location if possible
        theater = db.theaters.find_one({"name": {"$regex": f"^{re_escape(theater_name)}$", "$options": "i"}}) if theater_name else None
        theater_location = theater["location"] if theater else ""

        entry = {
            "_id": ObjectId(),
            "movieId": movie_id,
            "imdbId": movie["imdbId"],
            "movieTitle": movie.get("title", ""),
            "moviePosterUrl": movie.get("posterUrl", ""),
            "theaterName": theater_name,
            "theaterLocation": theater_location,
            "ticketCost": ticket_cost,
            "currency": currency,
            "ticketStubUrl": None,
            "timestamp": date_str,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        try:
            db.users.update_one(
                {"firebaseUid": args.uid},
                {
                    "$push": {"watchHistory": entry},
                    "$inc": {
                        "totalMoviesWatched": 1,
                        "totalRuntimeSeconds": runtime * 60
                    }
                }
            )
            print(f"[{idx}/{len(rows)}] ✅ Added watch entry: '{movie.get('title')}' at {theater_name or 'Unknown theater'}")
            added_count += 1
            total_runtime_added += runtime * 60
        except Exception as e:
            print(f"[{idx}/{len(rows)}] ❌ Error updating watch history for '{imdb_id}': {e}")
            skipped_count += 1

    print("\n--- Summary ---")
    print(f"✨ Successfully added: {added_count} watch entries (+{total_runtime_added//60} mins to runtime).")
    print(f"⚠️  Skipped: {skipped_count} entries.")

def re_escape(s):
    import re
    return re.escape(s)

if __name__ == "__main__":
    main()
