import os
import sys
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

def main():
    parser = argparse.ArgumentParser(description="Bulk delete movies that don't have posters.")
    parser.add_argument("--execute", action="store_true", help="Actually perform deletions (default is dry-run)")
    args = parser.parse_args()

    if not args.execute:
        print("⚠️  DRY RUN MODE: No changes will be made to the database. Pass --execute to delete.")
    else:
        print("🚀 EXECUTE MODE: Movies without posters will be deleted from MongoDB.")

    print("\n🔍 Scanning movies collection...")
    all_movies = list(db.movies.find({}))
    print(f"📦 Total movies found: {len(all_movies)}")

    to_delete = []
    for m in all_movies:
        movie_id_str = str(m["_id"])
        # Check if poster exists in movie_posters collection
        poster = db.movie_posters.find_one({"movieId": movie_id_str})
        if not poster:
            to_delete.append(m)

    print(f"🗑️  Movies without posters: {len(to_delete)}")

    if not to_delete:
        print("✨ All movies have posters! Nothing to clean up.")
        return

    deleted_count = 0
    for idx, m in enumerate(to_delete, 1):
        m_id = m["_id"]
        title = m.get("title", "Unknown")
        year = m.get("year", "Unknown")
        m_id_str = str(m_id)

        print(f"[{idx}/{len(to_delete)}] Movie without poster: '{title}' ({year}) [ID: {m_id_str}]")

        if args.execute:
            try:
                # Delete movie
                db.movies.delete_one({"_id": m_id})
                # Delete related titlecards
                tc_res = db.titlecards.delete_many({"movieId": m_id_str})
                # Delete related titlecard_images
                tci_res = db.titlecard_images.delete_many({"movieId": m_id_str})
                print(f"   ✅ Deleted movie and related ({tc_res.deleted_count} titlecards, {tci_res.deleted_count} images)")
                deleted_count += 1
            except Exception as e:
                print(f"   ❌ Error deleting {m_id_str}: {e}")
        else:
            # Count potential related deletions
            tc_count = db.titlecards.count_documents({"movieId": m_id_str})
            tci_count = db.titlecard_images.count_documents({"movieId": m_id_str})
            print(f"   ⚠️  Would delete movie + {tc_count} titlecards + {tci_count} titlecard images")

    print("\n--- Summary ---")
    if args.execute:
        print(f"✨ Successfully deleted {deleted_count} out of {len(to_delete)} movies without posters.")
    else:
        print(f"⚠️  Dry run complete. {len(to_delete)} movies identified for deletion. Run with --execute to delete.")

if __name__ == "__main__":
    main()
