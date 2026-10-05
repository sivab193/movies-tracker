"""One-time backfill: assign MV #N display names to existing private users.

Every account whose profile is private (isPublic != True) gets a default
display name "MV #N", where N reflects signup order (oldest account first).
Numbers already taken (e.g. by accounts created after this feature shipped)
are skipped so there are no collisions.

Notes:
- Users that already have an mvNumber are skipped (safe to re-run).
- The userSequence counter is advanced past the highest assigned number so
  future signups continue without collisions.
- This overwrites the current displayName of private accounts, including any
  custom names they may have set. They can change it back in settings.

Usage:
    python backfill_mv_display_names.py          # dry run (counts only)
    python backfill_mv_display_names.py --apply  # perform the update
"""
import os
import sys
from dotenv import load_dotenv

# Ensure backend root is on the path for imports and .env lookup
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from mongo_config import db

PRIVATE_FILTER = {
    "isPublic": {"$ne": True},
    "mvNumber": {"$exists": False},
}


def main() -> None:
    if db is None:
        print("Database not connected. Set MONGO_URI in .env or environment.")
        exit(1)

    apply = "--apply" in sys.argv

    taken = {
        int(u["mvNumber"])
        for u in db.users.find({"mvNumber": {"$exists": True}}, {"mvNumber": 1})
        if isinstance(u.get("mvNumber"), int)
    }
    users = list(
        db.users.find(PRIVATE_FILTER, {"_id": 1, "displayName": 1}).sort("_id", 1)
    )
    print(f"Private accounts without an MV number: {len(users)}")
    anonymous = sum(1 for u in users if (u.get("displayName") or "") == "Anonymous")
    print(f"  of which still on the 'Anonymous' default: {anonymous}")
    print(f"  of which with a custom/Google name (will be overwritten): {len(users) - anonymous}")
    if taken:
        print(f"  MV numbers already taken (will be skipped): {len(taken)}")

    if not users:
        print("Nothing to do.")
        return
    if not apply:
        print("Dry run only. Re-run with --apply to perform the update.")
        return

    number = 1
    updated = 0
    for user in users:
        while number in taken:
            number += 1
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"mvNumber": number, "displayName": f"MV #{number}"}},
        )
        taken.add(number)
        number += 1
        updated += 1

    # Advance the counter past the highest assigned number.
    highest = max(taken)
    counter = db.counters.find_one({"_id": "userSequence"})
    if not counter or int(counter.get("seq", 0)) < highest:
        db.counters.update_one(
            {"_id": "userSequence"}, {"$set": {"seq": highest}}, upsert=True
        )

    print(f"Assigned MV numbers to {updated} private accounts (highest: MV #{highest}).")


if __name__ == "__main__":
    main()
