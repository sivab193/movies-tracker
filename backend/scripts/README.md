# Backend Scripts

This folder contains backend utility scripts used for universal JSON movie imports, batch data operations, and database maintenance.

## Universal Movie Importer (`import_movies_from_json.py`) ⭐ **RECOMMENDED**

`import_movies_from_json.py` is the primary, universal tool for ingesting any list of movies (including upcoming releases, regional Indian cinema, or custom catalogs) into your MongoDB cluster.

### Usage
Run from the `backend/` directory passing the path to any JSON file:

```bash
cd backend
python3 scripts/import_movies_from_json.py scripts/upcoming_movies.json
```

If no path is passed, it automatically defaults to `scripts/upcoming_movies.json`.

### Features
1. **IMDb Suggest & OMDb Auto-Lookup**: Automatically searches IMDb Suggest API and OMDb API (`find_best_imdb_match`) to find the exact `tt...` ID even if you don't provide one.
2. **Guaranteed Upsert**: Even when OMDb has missing metadata or throws `Error: Movie not found!` (common for unreleased regional titles), the script uses your exact JSON fields (`title`, `year`, `language`, `releaseDate`) so that every single movie is guaranteed to be saved in MongoDB.
3. **Binary Poster Ingestion**: Automatically downloads any poster URL found and stores it as a binary document inside `db.movie_posters`.

---

### 🤖 How to ask Gemini for new movies in the future
In future chat sessions, you can simply ask Gemini:
> *"Give me a JSON array of upcoming Malayalam/Tamil/English movies for October 2026 formatted exactly for my `import_movies_from_json.py` script."*

Gemini will output JSON matching this schema:
```json
[
  {
    "title": "Movie Name",
    "year": 2026,
    "language": "Tamil",
    "released": "October 14, 2026",
    "releaseDate": "2026-10-14"
  }
]
```
You can save that to any file (e.g. `scripts/oct_2026.json`) and run `python3 scripts/import_movies_from_json.py scripts/oct_2026.json`!

---

## MCU Bulk Load + Watch Order

Two scripts turn `scripts/mcu.json` (movies + series IMDb IDs) and
`scripts/mcu_watch_order.json` (curated chronological order) into DB content.

### 1. `bulk_import_imdb_ids.py` — bulk load movies & series

```bash
cd backend
python3 scripts/bulk_import_imdb_ids.py scripts/mcu.json              # defaults to mcu.json
python3 scripts/bulk_import_imdb_ids.py scripts/mcu.json --dry-run    # preview, no writes
python3 scripts/bulk_import_imdb_ids.py scripts/mcu.json --no-episodes
```

- Reads `{"movies": [{"title","id"}...], "series": [...]}` (a plain array is treated as movies).
- Fetches full metadata from OMDb by IMDb ID and stores posters as binary in
  `db.movie_posters` / `db.series_posters`.
- **Skips anything already in `db.movies` / `db.series`** (matched by `imdbId`,
  then by case-insensitive title). Use `--force` to refresh those instead.
- Series documents mirror `routes/series.py::fetch_series_full_data`, including the
  per-season/per-episode breakdown.
- Options: `--movies-only`, `--series-only`, `--no-episodes` (series-level only —
  much faster and far fewer OMDb calls), `--force`, `--dry-run`.

`scripts/mcu_pending.json` holds whatever the last MCU run couldn't finish (series that
were never imported plus any flagged `episodesNeedBackfill`). Resume with:

```bash
python3 scripts/bulk_import_imdb_ids.py scripts/mcu_pending.json --force
python3 scripts/seed_mcu_watch_orders.py --with-release-order   # re-resolve titles from the DB
```

> ⚠️ A full series import makes one OMDb call per episode (thousands for the MCU
> TV catalog). On the free OMDb tier (1,000 requests/day) run the first pass with
> `--no-episodes`, then backfill episodes later.

### 2. `seed_mcu_watch_orders.py` — map the MCU watch order

```bash
cd backend
python3 scripts/seed_mcu_watch_orders.py                        # chronological order
python3 scripts/seed_mcu_watch_orders.py --dry-run              # preview
python3 scripts/seed_mcu_watch_orders.py --with-release-order   # also build release order
```

- Builds **"Marvel Cinematic Universe (Chronological Order)"** in `db.watch_orders`
  from `scripts/mcu_watch_order.json` (`order`, `title`, `id`, `type`, optional `note`).
- `--with-release-order` / `--release-only` additionally builds
  **"Marvel Cinematic Universe (Release Order)"** from `mcu.json`, sorted by the
  `releaseDate` stored in the DB (unreleased titles land at the end).
- Titles/years are resolved from `db.movies` / `db.series` when present, falling back
  to the JSON titles — so it can run before the bulk import.
- Re-running updates the existing order in place (same `_id`, and item `_id`s are kept
  stable for titles already in the list). `--skip-existing` leaves existing orders alone.
- Warns about drift between `mcu.json` and `mcu_watch_order.json` (titles in one but not the other).

---

## Other Active Core Scripts

- **`scripts/bulk_import.py`**
  - Legacy batch importer from OMDb or Kaggle CSV files into MongoDB.

- **`scripts/bulk_theaters.py`**
  - Bulk imports theaters from a text or CSV file, preventing duplicates by name and location.

- **`scripts/bulk_watch.py`**
  - Bulk imports watch history entries into a user document (`--uid <firebase_user_uid> --csv watch_history.csv`).

- **`scripts/search_imdb.py`**
  - Legacy batch search utility that outputs found IMDb IDs into `movies.txt`.

- **`scripts/seed_data.py`**
  - Seeds initial test data into MongoDB for local development and smoke testing.
