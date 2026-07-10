import os
import sys
import argparse
from dotenv import load_dotenv

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

try:
    from mongo_config import db
except Exception as e:
    print(f"❌ Error importing mongo_config: {e}")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Delete all theaters with location 'Chennai'.")
    parser.add_argument("--execute", action="store_true", help="Actually perform deletions (default is dry-run)")
    args = parser.parse_args()

    if not args.execute:
        print("⚠️  DRY RUN MODE: No changes will be made to the database. Pass --execute to delete.")
    else:
        print("🚀 EXECUTE MODE: Theaters with location 'Chennai' will be deleted from MongoDB.")

    # Find Chennai theaters case-insensitively
    query = {"location": {"$regex": "^chennai$", "$options": "i"}}
    chennai_theaters = list(db.theaters.find(query))
    print(f"🔍 Found {len(chennai_theaters)} theaters in Chennai.")

    if not chennai_theaters:
        print("✨ No Chennai theaters found in the database.")
        return

    deleted_count = 0
    for idx, t in enumerate(chennai_theaters, 1):
        t_id = t["_id"]
        name = t.get("name", "Unknown")
        location = t.get("location", "Unknown")

        print(f"[{idx}/{len(chennai_theaters)}] Theater: '{name}' ({location})")

        if args.execute:
            try:
                db.theaters.delete_one({"_id": t_id})
                print("   ✅ Deleted")
                deleted_count += 1
            except Exception as e:
                print(f"   ❌ Error deleting {name}: {e}")

    print("\n--- Summary ---")
    if args.execute:
        print(f"✨ Successfully deleted {deleted_count} Chennai theaters.")
    else:
        print(f"⚠️  Dry run complete. Run with --execute to perform the deletions.")

if __name__ == "__main__":
    main()
