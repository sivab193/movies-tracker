# 🐍 Movies Tracker — Python Flask Backend API

This directory contains the Python 3.10+ Flask REST API server and database administration scripts powering **Movies Tracker**.

---

## 🚀 Key Features & Responsibilities

- **Authentication Interceptor**: Intercepts Google OAuth requests and verifies Firebase ID Tokens (`@verify_token`) via `firebase-admin` SDK.
- **Movie Catalog & Poster Caching**: Fetches rich metadata from **OMDb API**, downloads binary movie posters, and caches them directly inside MongoDB.
- **Atomic Watch Stats**: Maintains user running totals (`totalMoviesWatched`, `totalRuntimeSeconds`) using high-speed MongoDB `$inc` / `$push` operators.
- **Bulk Administration CLI Tools**: High-throughput scripts for batch importing movies, theaters, and user watch logs from CSVs/text files.

---

## 🛠️ Local Setup Guide

### 1. Create Python Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables (`backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
MONGO_URI=mongodb://localhost:27017/movies_tracker
# Or Atlas URI: mongodb+srv://username:password@cluster.mongodb.net/movies_tracker

OMDB_API_KEY=your_omdb_api_key_here
FIREBASE_SERVICE_ACCOUNT_KEY=backend/serviceAccountKey.json
PORT=8000
# Optional initial Muse API key. For no-deploy rotation, use the hashed
# agent_api_config document described in ../docs/AGENT_API.md instead.
MEDIA_VERSE_AGENT_KEY=store-this-only-in-your-secret-manager
```

> ⚠️ **Service Account**: Place your downloaded Firebase `serviceAccountKey.json` inside the `backend/` folder (it is automatically ignored by git via `.gitignore`).

### 3. Run Development Server
```bash
python3 app.py
```
The server will start on `http://localhost:8000/`.

---

## 📦 CLI Administration & Bulk Tools

The backend includes several high-performance command-line utilities for database management and data seeding:

### `bulk_import.py` — Batch Import Movies from OMDb / Kaggle CSV
Reads movie IDs (`imdbId`) from a text file or CSV, queries the OMDb API, downloads binary posters, and inserts them into MongoDB.
```bash
python3 bulk_import.py --file movies.txt
# Or import from Kaggle CSV with filters:
python3 bulk_import.py --csv results_with_crew.csv --min-rating 7.5 --min-votes 50000 --limit 100
```

### `bulk_delete_no_poster.py` — Cleanup Movies Missing Posters
Scans all movies and checks whether a corresponding `movieId` exists inside `movie_posters`.
```bash
# Dry run (default - reports what would be deleted without modifying DB):
python3 bulk_delete_no_poster.py

# Execute actual deletion:
python3 bulk_delete_no_poster.py --execute
```

### `bulk_theaters.py` — Batch Add Approved Theaters
Bulk imports theaters from `theaters.txt` (format: `Name | Location`), automatically preventing duplicate entries.
```bash
python3 bulk_theaters.py --file theaters.txt
```

### `bulk_watch.py` — Batch Import User Watch History from CSV
Allows users or admins to bulk upload watch logs from a CSV file (`imdb_id, theater_name, date, ticket_cost, currency`).
```bash
python3 bulk_watch.py --uid <firebase_user_uid> --csv watch_history.csv
```

---

## 📁 Directory Structure
```
backend/
├── routes/                    # Blueprint routes by domain
│   ├── users.py               # User profiles, watch history, admin requests
│   ├── movies.py              # Movie catalog, poster serving, pagination
│   ├── theaters.py            # Approved theater management
│   ├── leaderboard.py         # Annual runtime leaderboard calculation
│   ├── stats.py               # Community statistics and insights
│   └── device_auth.py         # Device authorization flow for MCP/CLI clients
├── app.py                     # Flask application factory & CORS configuration
├── firebase_config.py         # Firebase Admin SDK & token verification
├── mongo_config.py            # PyMongo database connection pool
├── scripts/                   # CLI batch utilities and migration helpers
│   ├── bulk_import.py
│   ├── bulk_delete_no_poster.py
│   ├── bulk_theaters.py
│   ├── bulk_watch.py
│   ├── migrate_watch_history_normalize.py
│   └── seed_data.py
├── requirements.txt           # Python package dependencies
```

---

## 🔐 Device Authorization Flow (MCP/CLI Integration)

The backend includes a device authorization flow (`/api/auth/device/*`) for CLI tools and MCP servers:

**Endpoints:**
- `POST /api/auth/device/code` - Generate device code for authorization
- `POST /api/auth/device/poll` - CLI polls for user authorization
- `POST /api/auth/device/verify` - User submits code from web UI
- `POST /api/auth/refresh` - Refresh access tokens using refresh token
- `POST /api/auth/revoke` - Revoke refresh token (logout)

**Database Collections:**
- `device_codes` - Temporary authorization codes (15 min TTL)
- `refresh_tokens` - Long-lived tokens (1 year expiry)

See **[MCP Server Guide](../mcp-server/README.md)** for client implementation.

## Muse agent API

The key-authenticated movie upsert API is documented in
**[AGENT_API.md](../docs/AGENT_API.md)**. It writes into the existing MongoDB
movie catalog and poster cache, so the returned permanent `/m/<slug>` page is
immediately usable as an Instagram story link.
