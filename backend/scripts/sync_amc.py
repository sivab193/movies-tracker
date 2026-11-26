"""AMC catalog sync: match AMC movies and import AMC theatres.

Runs the same jobs as the admin maintenance tasks "amc-sync-movies" and
"amc-sync-theatres" from outside the web app, so a scheduler (cron,
GitHub Actions, a local machine) can keep AMC data fresh without any
public sync endpoint.

Usage:
    python sync_amc.py                       # dry run (counts only)
    python sync_amc.py --apply               # perform both syncs
    python sync_amc.py --apply --scope movies
    python sync_amc.py --apply --scope theatres

Requires AMC_VENDOR_KEY and MONGO_URI in the environment or backend/.env.
"""
import os
import sys
from dotenv import load_dotenv

# Ensure backend root is on the path for imports and .env lookup
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from maintenance_tasks import run_amc_sync_movies, run_amc_sync_theatres
from mongo_config import db


def main() -> None:
    if db is None:
        print("Database not connected. Set MONGO_URI in .env or environment.")
        exit(1)

    apply = "--apply" in sys.argv
    scope = "all"
    if "--scope" in sys.argv:
        scope = sys.argv[sys.argv.index("--scope") + 1]
    if scope not in {"all", "movies", "theatres"}:
        print("--scope must be movies, theatres or all")
        exit(1)

    mode = "apply" if apply else "dry run"
    if scope in {"all", "movies"}:
        print(f"AMC movie sync ({mode}):", run_amc_sync_movies(db, apply=apply))
    if scope in {"all", "theatres"}:
        print(f"AMC theatre sync ({mode}):", run_amc_sync_theatres(db, apply=apply))


if __name__ == "__main__":
    main()
