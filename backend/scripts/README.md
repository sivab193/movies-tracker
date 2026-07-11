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
