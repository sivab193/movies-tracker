import os
import sys
import re
import argparse
from collections import defaultdict
from bson import ObjectId

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from mongo_config import db

def clean_str(s):
    if not s:
        return ""
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

def check_theaters(dedup=False):
    print("\n=== 🏛️  CHECKING THEATER DUPLICATES ===")
    theaters = list(db.theaters.find({}))
    groups = defaultdict(list)

    for t in theaters:
        name = t.get("name", "").strip()
        loc = t.get("location", "").strip()
        # Key: cleaned name + cleaned location
        key = f"{clean_str(name)}_{clean_str(loc)}"
        if not key or key == "_":
            key = str(t["_id"])
        groups[key].append(t)

    dup_count = 0
    total_removed = 0

    for key, docs in groups.items():
        if len(docs) > 1:
            dup_count += 1
            print(f"\n⚠️  Duplicate Group ({len(docs)} docs) for '{docs[0].get('name')}' ({docs[0].get('location')}):")
            # Sort so we keep the one with most details or oldest ObjectId
            docs.sort(key=lambda d: (len(str(d.get("gmapsLink", ""))), -len(str(d["_id"]))), reverse=True)
            kept = docs[0]
            print(f"   ✅ KEEPING: ID {kept['_id']} | '{kept.get('name')}' | Location: '{kept.get('location')}'")
            
            for dup in docs[1:]:
                print(f"   ❌ DUPLICATE: ID {dup['_id']} | '{dup.get('name')}' | Location: '{dup.get('location')}'")
                
                if dedup:
                    # Update references in users.watchHistory
                    old_id = str(dup["_id"])
                    kept_id = str(kept["_id"])
                    
                    # Update users whose watchHistory has theaterId == old_id or ObjectId(old_id)
                    users_with_ref = list(db.users.find({
                        "$or": [
                            {"watchHistory.theaterId": old_id},
                            {"watchHistory.theaterId": dup["_id"]},
                            {"watchHistory.theaterName": dup.get("name")}
                        ]
                    }))
                    
                    for u in users_with_ref:
                        wh = u.get("watchHistory", [])
                        modified = False
                        for entry in wh:
                            if str(entry.get("theaterId")) == old_id or (entry.get("theaterName") == dup.get("name") and entry.get("theaterLocation") == dup.get("location")):
                                entry["theaterId"] = kept_id
                                entry["theaterName"] = kept.get("name")
                                entry["theaterLocation"] = kept.get("location")
                                if kept.get("gmapsLink"):
                                    entry["theaterGmapsLink"] = kept.get("gmapsLink")
                                modified = True
                        if modified:
                            db.users.update_one({"_id": u["_id"]}, {"$set": {"watchHistory": wh}})
                    
                    # Delete the duplicate document
                    db.theaters.delete_one({"_id": dup["_id"]})
                    total_removed += 1
                    print(f"      🗑️  Deleted duplicate theater ID {dup['_id']} and re-linked watch histories.")

    if dup_count == 0:
        print("🎉 No duplicate theaters found!")
    else:
        print(f"\nSummary: Found {dup_count} duplicate theater groups.")
        if dedup:
            print(f"✨ Successfully removed {total_removed} duplicate theater documents across all collections!")
        else:
            print("💡 To automatically merge & delete these duplicate theaters while keeping watch history links safe, run:\n   python scripts/check_duplicates.py --dedup-theaters")

def check_movies(dedup=False):
    print("\n=== 🎬 CHECKING MOVIE DUPLICATES ===")
    movies = list(db.movies.find({}))
    imdb_groups = defaultdict(list)
    title_groups = defaultdict(list)

    for m in movies:
        imdb = m.get("imdbId", "").strip()
        if imdb and imdb != "N/A":
            imdb_groups[imdb.lower()].append(m)
        else:
            t = m.get("title", "").strip()
            y = m.get("year", "").strip()
            key = f"{clean_str(t)}_{clean_str(y)}"
            title_groups[key].append(m)

    all_groups = list(imdb_groups.values()) + [g for g in title_groups.values() if len(g) > 1]
    dup_count = 0
    total_removed = 0

    for docs in all_groups:
        if len(docs) > 1:
            dup_count += 1
            print(f"\n⚠️  Duplicate Movie ({len(docs)} docs) for '{docs[0].get('title')}' ({docs[0].get('year')} | {docs[0].get('imdbId')}):")
            docs.sort(key=lambda d: (len(str(d.get("posterUrl", ""))), len(str(d.get("plot", "")))), reverse=True)
            kept = docs[0]
            print(f"   ✅ KEEPING: ID {kept['_id']} | '{kept.get('title')}' | IMDb: {kept.get('imdbId')}")
            
            for dup in docs[1:]:
                print(f"   ❌ DUPLICATE: ID {dup['_id']} | '{dup.get('title')}' | IMDb: {dup.get('imdbId')}")
                if dedup:
                    old_id = str(dup["_id"])
                    kept_id = str(kept["_id"])
                    
                    users_with_ref = list(db.users.find({
                        "$or": [
                            {"watchHistory.movieId": old_id},
                            {"watchHistory.movieId": dup["_id"]}
                        ]
                    }))
                    
                    for u in users_with_ref:
                        wh = u.get("watchHistory", [])
                        modified = False
                        for entry in wh:
                            if str(entry.get("movieId")) == old_id:
                                entry["movieId"] = kept_id
                                entry["imdbId"] = kept.get("imdbId")
                                entry["movieTitle"] = kept.get("title")
                                if kept.get("posterUrl"):
                                    entry["moviePosterUrl"] = kept.get("posterUrl")
                                modified = True
                        if modified:
                            db.users.update_one({"_id": u["_id"]}, {"$set": {"watchHistory": wh}})
                    
                    db.movies.delete_one({"_id": dup["_id"]})
                    total_removed += 1
                    print(f"      🗑️  Deleted duplicate movie ID {dup['_id']} and re-linked watch histories.")

    if dup_count == 0:
        print("🎉 No duplicate movies found!")
    else:
        print(f"\nSummary: Found {dup_count} duplicate movie groups.")
        if dedup:
            print(f"✨ Successfully removed {total_removed} duplicate movie documents across all collections!")
        else:
            print("💡 To automatically merge & delete these duplicate movies while keeping watch history links safe, run:\n   python scripts/check_duplicates.py --dedup-movies")

def check_users():
    print("\n=== 👥 CHECKING USER DUPLICATES ===")
    users = list(db.users.find({}))
    groups = defaultdict(list)
    for u in users:
        uid = u.get("firebaseUid", "").strip()
        groups[uid].append(u)
    
    dup_count = sum(1 for g in groups.values() if len(g) > 1)
    if dup_count == 0:
        print("🎉 No duplicate users found!")
    else:
        print(f"⚠️  Found {dup_count} duplicate user accounts.")

def main():
    parser = argparse.ArgumentParser(description="Check and deduplicate documents across MongoDB collections.")
    parser.add_argument("--dedup-theaters", action="store_true", help="Automatically deduplicate theaters and update references")
    parser.add_argument("--dedup-movies", action="store_true", help="Automatically deduplicate movies and update references")
    parser.add_argument("--all", action="store_true", help="Run both checks")
    args = parser.parse_args()

    if db is None:
        print("❌ Error connecting to MongoDB")
        return

    check_theaters(dedup=args.dedup_theaters)
    check_movies(dedup=args.dedup_movies)
    check_users()

if __name__ == "__main__":
    main()
