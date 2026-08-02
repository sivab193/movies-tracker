#!/usr/bin/env python3
"""
🎬 Bulk Importer for JSON files containing IMDb IDs (movies + series)
====================================================================
Usage:
    python3 scripts/bulk_import_imdb_ids.py [path_to_json_file] [options]

If no file path is provided, defaults to 'scripts/mcu.json'.

Expected JSON format:
{
  "movies": [ { "title": "Iron Man", "id": "tt0371746" }, ... ],
  "series": [ { "title": "Loki",     "id": "tt9140554" }, ... ]
}
(A plain array is also accepted and treated as movies.)

Options:
    --movies-only     Only import the "movies" section
    --series-only     Only import the "series" section
    --no-episodes     For series, store series-level data only (skips the
                      per-episode OMDb calls, which are slow). Seasons array
                      will be empty.
    --force           Re-fetch and update entries that already exist in the DB
                      (default behaviour is to skip anything already present).
    --dry-run         Show what would happen without writing to MongoDB.

Existing entries are matched by imdbId first, then by title (case-insensitive)
+ year, so re-running the script is safe.
"""

import os
import re
import sys
import json
import time
import argparse
import datetime

import requests
from dotenv import load_dotenv
from bson import ObjectId, Binary

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from mongo_config import db  # noqa: E402

OMDB_API_KEY = os.environ.get('OMDB_API_KEY')
OMDB_URL = "https://www.omdbapi.com/"


# ---------------------------------------------------------------- OMDb helpers

QUOTA_HIT = False  # set once OMDb reports the daily request limit is exhausted


def omdb_get(params):
    """Single OMDb request with light retry handling."""
    global QUOTA_HIT
    params = dict(params)
    params['apikey'] = OMDB_API_KEY
    for attempt in range(3):
        try:
            res = requests.get(OMDB_URL, params=params, timeout=10)
            if res.status_code == 401 or 'Request limit reached' in res.text:
                QUOTA_HIT = True
                return {}
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"    ⚠️ OMDb request failed ({e}), retrying...")
        time.sleep(1 + attempt)
    return {}


def to_int(value, default=None):
    try:
        return int(str(value).strip().split(' ')[0])
    except Exception:
        return default


def to_float(value, default=None):
    try:
        if value in (None, '', 'N/A'):
            return default
        return float(value)
    except Exception:
        return default


def parse_release_date(released, year):
    """'02 May 2008' -> '2008-05-02'. Falls back to Jan 1st of the year."""
    if released and released != 'N/A':
        for fmt in ('%d %b %Y', '%Y-%m-%d', '%B %d, %Y'):
            try:
                return datetime.datetime.strptime(released, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
    return f"{year}-01-01" if year else None


def save_poster(collection, id_field, owner_id, poster_url):
    """Download a poster and store it as binary in the *_posters collection."""
    if not poster_url or poster_url == 'N/A':
        return None
    try:
        response = requests.get(poster_url, timeout=15)
        if response.status_code == 200:
            db[collection].update_one(
                {id_field: str(owner_id)},
                {"$set": {
                    "imageData": Binary(response.content),
                    "mimeType": response.headers.get('Content-Type', 'image/jpeg')
                }},
                upsert=True
            )
            return True
    except Exception as e:
        print(f"    ⚠️ Could not save poster: {e}")
    return False


# ------------------------------------------------------------- document builds

def build_movie_doc(imdb_id, fallback_title, omdb):
    year = to_int(omdb.get('Year'), 0)
    released = omdb.get('Released', 'N/A')
    runtime = omdb.get('Runtime', 'N/A')
    language = omdb.get('Language') or 'English'
    average_time_seconds = (to_int(runtime, 0) or 0) * 60

    return {
        "imdbId": imdb_id,
        "title": omdb.get('Title') or fallback_title,
        "year": year,
        "imdbRating": to_float(omdb.get('imdbRating')),
        "runtime": runtime,
        "language": language,
        "Language": language,
        "released": released if released != 'N/A' else str(year or ''),
        "releaseDate": parse_release_date(released, year),
        "plot": omdb.get('Plot') if omdb.get('Plot') != 'N/A' else None,
        "genre": omdb.get('Genre') if omdb.get('Genre') != 'N/A' else None,
        "actors": omdb.get('Actors') if omdb.get('Actors') != 'N/A' else None,
        "director": omdb.get('Director') if omdb.get('Director') != 'N/A' else None,
        "averageTimeSeconds": average_time_seconds,
    }


def build_series_doc(imdb_id, fallback_title, omdb, with_episodes=True):
    """Mirrors routes/series.py::fetch_series_full_data so both paths agree.

    Returns (doc, episodes_complete). episodes_complete is False when a season or
    episode lookup failed (e.g. the OMDb daily limit ran out) — the caller then
    avoids writing a half-built seasons array over good data.
    """
    total_seasons = to_int(omdb.get('totalSeasons'), 0) or 0
    series_runtime = to_int(omdb.get('Runtime'), 0) or 0

    start_year, end_year, is_ongoing = 0, None, False
    years = str(omdb.get('Year', '')).split('–')  # OMDb uses an en dash
    if years and years[0].strip():
        start_year = to_int(years[0], 0) or 0
        if len(years) > 1:
            if years[1].strip():
                end_year = to_int(years[1])
            else:
                is_ongoing = True

    seasons = []
    episodes_complete = True
    if with_episodes:
        for season_number in range(1, total_seasons + 1):
            season_data = omdb_get({"i": imdb_id, "Season": season_number})
            if season_data.get('Response') != 'True':
                episodes_complete = False
                print(f"    ⚠️ Season {season_number} lookup failed"
                      f"{' (OMDb daily limit reached)' if QUOTA_HIT else ''}.")
                if QUOTA_HIT:
                    break
                continue
            episodes, season_runtime = [], 0
            for ep in season_data.get('Episodes', []):
                ep_imdb = ep.get('imdbID')
                details = omdb_get({"i": ep_imdb}) if ep_imdb else {}
                if not details:
                    episodes_complete = False
                runtime = to_int(details.get('Runtime'), series_runtime) or series_runtime
                season_runtime += runtime
                episodes.append({
                    "episodeNumber": to_int(ep.get('Episode'), 0) or 0,
                    "title": ep.get('Title'),
                    "imdbId": ep_imdb,
                    "runtimeMinutes": runtime,
                    "airDate": details.get('Released') if details.get('Released') != 'N/A' else None,
                    "imdbRating": to_float(details.get('imdbRating')),
                })
            seasons.append({
                "seasonNumber": season_number,
                "episodeCount": len(episodes),
                "seasonRuntimeMinutes": season_runtime,
                "episodes": episodes,
            })
            print(f"    📺 Season {season_number}: {len(episodes)} episodes ({season_runtime} min)")
            if QUOTA_HIT:
                break

    total_episodes = sum(len(s["episodes"]) for s in seasons)
    total_runtime = sum(ep["runtimeMinutes"] for s in seasons for ep in s["episodes"])

    return {
        "imdbId": imdb_id,
        "title": omdb.get('Title') or fallback_title,
        "year": start_year,
        "endYear": end_year,
        "plot": omdb.get('Plot') if omdb.get('Plot') != 'N/A' else None,
        "genre": omdb.get('Genre') if omdb.get('Genre') != 'N/A' else None,
        "actors": omdb.get('Actors') if omdb.get('Actors') != 'N/A' else None,
        "director": omdb.get('Director') if omdb.get('Director') != 'N/A' else None,
        "language": omdb.get('Language') if omdb.get('Language') != 'N/A' else None,
        "country": omdb.get('Country') if omdb.get('Country') != 'N/A' else None,
        "imdbRating": to_float(omdb.get('imdbRating')),
        "isOngoing": is_ongoing,
        "totalSeasons": total_seasons,
        "totalEpisodes": total_episodes,
        "totalRuntimeMinutes": total_runtime,
        "seasons": seasons,
    }, episodes_complete


# -------------------------------------------------------------------- importer

def find_existing(collection, imdb_id, title):
    existing = db[collection].find_one({"imdbId": imdb_id})
    if existing:
        return existing, "imdbId"
    if title:
        existing = db[collection].find_one({
            "title": {"$regex": f"^{re.escape(title.strip())}$", "$options": "i"}
        })
        if existing:
            return existing, "title"
    return None, None


def import_entry(kind, entry, args, index, total):
    collection = 'movies' if kind == 'movie' else 'series'
    poster_collection = 'movie_posters' if kind == 'movie' else 'series_posters'
    poster_id_field = 'movieId' if kind == 'movie' else 'seriesId'

    imdb_id = (entry.get('id') or entry.get('imdbId') or '').strip()
    title = (entry.get('title') or '').strip()
    label = f"[{index}/{total}] {title or imdb_id}"

    if not imdb_id.startswith('tt'):
        print(f"{label} ⚠️ Skipped — missing/invalid IMDb ID.")
        return 'skipped'

    existing, matched_by = find_existing(collection, imdb_id, title)
    if existing and not args.force:
        print(f"{label} ⏭️  Already in db.{collection} (matched by {matched_by}) — skipping.")
        return 'existing'

    omdb = omdb_get({"i": imdb_id, "plot": "short"})
    if omdb.get('Response') != 'True':
        reason = omdb.get('Error', 'no response from OMDb')
        print(f"{label} ⚠️ OMDb lookup failed ({reason}) — storing title/ID only.")
        omdb = {}

    if kind == 'movie':
        doc = build_movie_doc(imdb_id, title, omdb)
    else:
        # Episode fetching is many OMDb calls per series — never worth it on a dry run.
        with_episodes = not args.no_episodes and not args.dry_run
        doc, episodes_complete = build_series_doc(imdb_id, title, omdb, with_episodes=with_episodes)
        if with_episodes and not episodes_complete:
            # Don't overwrite existing episode data with a partial fetch; leave the
            # series-level fields to update and flag it for a later backfill.
            print(f"{label} ⚠️ Episode data incomplete — keeping series-level fields only. "
                  f"Re-run with --force once quota resets.")
            for field in ('seasons', 'totalEpisodes', 'totalRuntimeMinutes'):
                doc.pop(field, None)
            doc['episodesNeedBackfill'] = True
        elif with_episodes:
            doc['episodesNeedBackfill'] = False

    now = datetime.datetime.now(datetime.timezone.utc)
    doc["updatedAt"] = now
    if kind == 'series':
        doc["lastOmdbSync"] = now

    if args.dry_run:
        action = "update" if existing else "insert"
        print(f"{label} 🧪 Dry run — would {action} ({doc.get('year')}).")
        return 'updated' if existing else 'inserted'

    if existing:
        db[collection].update_one({"_id": existing["_id"]}, {"$set": doc})
        owner_id = existing["_id"]
        result = 'updated'
    else:
        doc["posterUrl"] = None
        doc["createdAt"] = now
        if kind == 'movie':
            doc["submissionCount"] = entry.get("submissionCount", 0)
        else:
            # A new series document always needs these fields present, even when a
            # partial episode fetch stripped them above.
            doc.setdefault("seasons", [])
            doc.setdefault("totalEpisodes", 0)
            doc.setdefault("totalRuntimeMinutes", 0)
        owner_id = db[collection].insert_one(doc).inserted_id
        result = 'inserted'

    poster_url = omdb.get('Poster')
    if poster_url and poster_url != 'N/A':
        if save_poster(poster_collection, poster_id_field, owner_id, poster_url):
            db[collection].update_one(
                {"_id": owner_id},
                {"$set": {"posterUrl": f"/api/{collection}/{owner_id}/poster"}}
            )

    print(f"{label} ✅ {result.capitalize()} ({doc.get('year')}) — {owner_id}")
    return result


def main():
    parser = argparse.ArgumentParser(description="Bulk import movies/series from a JSON file of IMDb IDs.")
    parser.add_argument('json_path', nargs='?', default=os.path.join(os.path.dirname(__file__), 'mcu.json'))
    parser.add_argument('--movies-only', action='store_true')
    parser.add_argument('--series-only', action='store_true')
    parser.add_argument('--no-episodes', action='store_true', help='Skip per-episode OMDb calls for series')
    parser.add_argument('--force', action='store_true', help='Refresh entries that already exist')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    if db is None:
        print("❌ Cannot connect to MongoDB. Check MONGO_URI in backend/.env")
        sys.exit(1)
    if not OMDB_API_KEY:
        print("❌ OMDB_API_KEY is not set in backend/.env")
        sys.exit(1)
    if not os.path.exists(args.json_path):
        print(f"❌ JSON file not found: {args.json_path}")
        sys.exit(1)

    with open(args.json_path, encoding='utf-8') as f:
        data = json.load(f)

    if isinstance(data, list):
        movies, series = data, []
    else:
        movies = data.get('movies', [])
        series = data.get('series', [])

    if args.movies_only:
        series = []
    if args.series_only:
        movies = []

    print(f"📂 {args.json_path}: {len(movies)} movies, {len(series)} series")
    if args.dry_run:
        print("🧪 DRY RUN — nothing will be written.")
    print("=" * 72)

    stats = {'inserted': 0, 'updated': 0, 'existing': 0, 'skipped': 0}

    if movies:
        print(f"\n🎬 MOVIES ({len(movies)})\n" + "-" * 72)
        for i, entry in enumerate(movies, 1):
            stats[import_entry('movie', entry, args, i, len(movies))] += 1
            if QUOTA_HIT:
                print(f"\n🛑 OMDb daily request limit reached — stopping after {i}/{len(movies)} movies.")
                break

    if series and not QUOTA_HIT:
        print(f"\n📺 SERIES ({len(series)})\n" + "-" * 72)
        for i, entry in enumerate(series, 1):
            stats[import_entry('series', entry, args, i, len(series))] += 1
            if QUOTA_HIT:
                print(f"\n🛑 OMDb daily request limit reached — stopping after {i}/{len(series)} series.")
                break

    print("\n" + "=" * 72)
    print(f"✨ Done — {stats['inserted']} inserted, {stats['updated']} updated, "
          f"{stats['existing']} already present, {stats['skipped']} skipped.")
    if QUOTA_HIT:
        print("   OMDb quota exhausted. Re-run the same command tomorrow — everything "
              "already stored is skipped, and --force refills incomplete series.")


if __name__ == '__main__':
    main()
