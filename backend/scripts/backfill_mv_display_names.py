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

from maintenance_tasks import run_mv_display_names
from mongo_config import db


def main() -> None:
    if db is None:
        print("Database not connected. Set MONGO_URI in .env or environment.")
        exit(1)

    apply = "--apply" in sys.argv

    result = run_mv_display_names(db, apply=apply)
    print(f"Private accounts without an MV number: {result['eligibleUsers']}")
    print(f"  of which still on the 'Anonymous' default: {result['anonymousDefaults']}")
    print(f"  of which with a custom/Google name (will be overwritten): {result['namesToOverwrite']}")
    if result["numbersAlreadyTaken"]:
        print(f"  MV numbers already taken (will be skipped): {result['numbersAlreadyTaken']}")

    if not result["eligibleUsers"]:
        print("Nothing to do.")
        return
    if not apply:
        print("Dry run only. Re-run with --apply to perform the update.")
        return

    print(
        f"Assigned MV numbers to {result['modifiedUsers']} private accounts "
        f"(highest: MV #{result['highestAssignedNumber']})."
    )


if __name__ == "__main__":
    main()
