# Backend Scripts

This folder contains backend utility scripts used for batch data imports, cleanup, and migration tasks.

## Purpose
These scripts are kept in `backend/scripts/` so they are separate from the Flask API server itself.

## Usage
Run scripts from the `backend/` folder, for example:

```bash
cd backend
python3 scripts/bulk_import.py --file movies.txt
```

## Available Scripts

- `scripts/bulk_import.py`
  - Imports movie metadata from OMDb or a Kaggle CSV file into MongoDB.
  - Downloads and stores poster binary data.
  - Useful for seeding the movie catalog.

- `scripts/bulk_delete_no_poster.py`
  - Identifies movies in the database that do not have poster binaries.
  - Can run in dry mode by default, and `--execute` will remove the movies and related titlecard data.

- `scripts/bulk_theaters.py`
  - Bulk imports theaters from a text or CSV file.
  - Prevents duplicate theaters by name and location.

- `scripts/bulk_watch.py`
  - Bulk imports watch history entries into a user document from CSV.
  - Requires `--uid <firebase_user_uid>` to target the user.

- `scripts/migrate_watch_history_normalize.py`
  - Normalizes existing watch history entries.
  - Adds missing `theaterId` references and refreshes movie/theater snapshot fields.

- `scripts/seed_data.py`
  - Seeds initial test data into MongoDB.
  - Useful for local development and smoke testing.

## Environment
All scripts load environment variables from `backend/.env`.

Make sure `MONGO_URI` is set in `backend/.env` before running any backend script.

## Example

```bash
cd backend
python3 scripts/bulk_watch.py --uid <firebase_user_uid> --csv watch_history.csv
```
