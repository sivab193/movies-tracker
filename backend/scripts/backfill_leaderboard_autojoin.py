"""One-time backfill: auto-join the leaderboard for existing users.

Applies the same rule as the new auto-join on watch-log: any user with at
least one logged movie who has not quit the leaderboard (opted out) and is
not banned gets joinedLeaderboard=True.

Usage:
    python backfill_leaderboard_autojoin.py          # dry run (counts only)
    python backfill_leaderboard_autojoin.py --apply  # perform the update
"""
import os
import sys
from dotenv import load_dotenv

# Ensure backend root is on the path for imports and .env lookup
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from maintenance_tasks import run_leaderboard_autojoin
from mongo_config import db


def main() -> None:
    if db is None:
        print("Database not connected. Set MONGO_URI in .env or environment.")
        exit(1)

    apply = "--apply" in sys.argv
    result = run_leaderboard_autojoin(db, apply=apply)
    eligible = result["eligibleUsers"]
    print(f"Users eligible for leaderboard auto-join: {eligible}")

    if eligible == 0:
        print("Nothing to do.")
        return

    if not apply:
        print("Dry run only. Re-run with --apply to perform the update.")
        return

    print(f"Auto-joined {result['modifiedUsers']} users to the leaderboard.")


if __name__ == "__main__":
    main()
