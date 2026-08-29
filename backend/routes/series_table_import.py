from flask import Blueprint, request, jsonify
import datetime
import re
from bson import ObjectId
from mongo_config import db
from routes.series import (
    OmdbError,
    verify_admin,
    resolve_api_key,
    fetch_series_meta,
    save_poster_to_db,
    recompute_totals,
    format_doc,
)

series_table_import_bp = Blueprint('series_table_import', __name__)


def _positive_int(value, field):
    try:
        number = int(str(value).strip())
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be a number")
    if number < 1:
        raise ValueError(f"{field} must be at least 1")
    return number


def _runtime_minutes(value):
    if value in (None, ""):
        return 0
    if isinstance(value, (int, float)):
        return max(0, int(round(value)))
    text = str(value).strip().lower()
    if not text:
        return 0
    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        return max(0, int(round(float(text))))
    clock = re.fullmatch(r"(?:(\d+):)?(\d{1,2}):(\d{2})", text)
    if clock:
        hours = int(clock.group(1) or 0)
        minutes = int(clock.group(2))
        seconds = int(clock.group(3))
        return max(0, hours * 60 + minutes + (1 if seconds >= 30 else 0))
    hours = re.search(r"(\d+(?:\.\d+)?)\s*h", text)
    minutes = re.search(r"(\d+(?:\.\d+)?)\s*m", text)
    if hours or minutes:
        total = (float(hours.group(1)) * 60 if hours else 0) + (float(minutes.group(1)) if minutes else 0)
        return max(0, int(round(total)))
    first_number = re.search(r"\d+(?:\.\d+)?", text)
    if first_number:
        return max(0, int(round(float(first_number.group(0)))))
    raise ValueError("duration/runtime must be minutes or a time such as 42 min or 00:42:00")


def _rating(value):
    if value in (None, "", "N/A"):
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        raise ValueError("rating must be a number")
    if result < 0 or result > 10:
        raise ValueError("rating must be between 0 and 10")
    return result


def _date(value):
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.datetime.strptime(text, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return text


def _url(value):
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    if not re.match(r"^https?://", text, re.IGNORECASE):
        raise ValueError("watch_url must start with http:// or https://")
    return text


def normalize_rows(rows, default_provider=None):
    if not isinstance(rows, list) or not rows:
        raise ValueError("At least one episode row is required")
    if len(rows) > 5000:
        raise ValueError("A maximum of 5000 episode rows can be imported at once")

    normalized = []
    errors = []
    seen = set()
    for index, raw in enumerate(rows):
        line = index + 1
        try:
            if not isinstance(raw, dict):
                raise ValueError("row is not an object")
            season = _positive_int(raw.get("season"), "season")
            episode = _positive_int(raw.get("episode"), "episode")
            key = (season, episode)
            if key in seen:
                raise ValueError(f"duplicate S{season}E{episode}")
            seen.add(key)
            title = str(raw.get("title") or "").strip()
            if not title:
                raise ValueError("title is required")
            episode_imdb = str(raw.get("episodeImdbId") or raw.get("episode_imdb") or "").strip() or None
            if episode_imdb and not re.fullmatch(r"tt\d+", episode_imdb):
                raise ValueError("episode_imdb must look like tt1234567")
            normalized.append({
                "seasonNumber": season,
                "episodeNumber": episode,
                "title": title,
                "imdbId": episode_imdb,
                "runtimeMinutes": _runtime_minutes(raw.get("duration", raw.get("runtime"))),
                "airDate": _date(raw.get("airDate", raw.get("air_date"))),
                "imdbRating": _rating(raw.get("rating", raw.get("imdbRating"))),
                "watchUrl": _url(raw.get("watchUrl", raw.get("watch_url"))),
                "watchProvider": str(raw.get("provider") or default_provider or "").strip() or None,
            })
        except ValueError as exc:
            errors.append({"row": line, "error": str(exc)})

    if errors:
        raise ValueError(errors)
    normalized.sort(key=lambda row: (row["seasonNumber"], row["episodeNumber"]))
    return normalized


def build_seasons(rows):
    grouped = {}
    for row in rows:
        grouped.setdefault(row["seasonNumber"], []).append({
            "episodeNumber": row["episodeNumber"],
            "title": row["title"],
            "imdbId": row["imdbId"],
            "runtimeMinutes": row["runtimeMinutes"],
            "airDate": row["airDate"],
            "imdbRating": row["imdbRating"],
            "watchUrl": row["watchUrl"],
            "watchProvider": row["watchProvider"],
            "dataSource": "table_import",
        })
    seasons = []
    for season_number, episodes in sorted(grouped.items()):
        seasons.append({
            "seasonNumber": season_number,
            "episodeCount": len(episodes),
            "seasonRuntimeMinutes": sum(ep["runtimeMinutes"] for ep in episodes),
            "runtimeSource": "table",
            "dataSource": "table_import",
            "episodes": episodes,
        })
    return seasons


def _parse_imdb_id(value):
    match = re.search(r"tt\d+", str(value or ""))
    if not match:
        raise ValueError("A valid IMDb series link or ID is required")
    return match.group(0)


@series_table_import_bp.route('/preview', methods=['POST'])
def preview_table_import():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    data = request.get_json() or {}
    try:
        imdb_id = _parse_imdb_id(data.get("imdbId"))
        rows = normalize_rows(data.get("rows"), data.get("provider"))
        api_key, key_id = resolve_api_key(data)
        meta, _, _ = fetch_series_meta(imdb_id, api_key, key_id)
        seasons = build_seasons(rows)
        return jsonify({
            "imdbId": imdb_id,
            "title": meta.get("title"),
            "year": meta.get("year"),
            "episodeCount": len(rows),
            "seasonCount": len(seasons),
            "totalRuntimeMinutes": sum(row["runtimeMinutes"] for row in rows),
            "seasons": seasons,
        })
    except ValueError as exc:
        detail = exc.args[0] if exc.args else str(exc)
        return jsonify({"error": "Invalid table data", "details": detail}), 400
    except OmdbError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@series_table_import_bp.route('/import', methods=['POST'])
def import_table_data():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    try:
        imdb_id = _parse_imdb_id(data.get("imdbId"))
        rows = normalize_rows(data.get("rows"), data.get("provider"))
        imported_seasons = build_seasons(rows)
        imported_numbers = {season["seasonNumber"] for season in imported_seasons}

        api_key, key_id = resolve_api_key(data)
        meta, poster_url, _ = fetch_series_meta(imdb_id, api_key, key_id)
        now = datetime.datetime.now(datetime.timezone.utc)
        existing = db.series.find_one({"imdbId": imdb_id})
        preserved = [
            season for season in (existing or {}).get("seasons", [])
            if season.get("seasonNumber") not in imported_numbers
        ]
        all_seasons = preserved + imported_seasons
        totals = recompute_totals({"seasons": all_seasons})

        doc = dict(meta)
        doc.pop("seriesRuntimeMinutes", None)
        doc.update(totals)
        doc["totalSeasons"] = max(
            int(meta.get("totalSeasons") or 0),
            max((season["seasonNumber"] for season in all_seasons), default=0),
        )
        doc["updatedAt"] = now
        doc["lastTableImportAt"] = now
        doc["importStatus"] = "complete" if len(totals["importedSeasons"]) >= doc["totalSeasons"] else "partial"

        if existing:
            series_id = str(existing["_id"])
            db.series.update_one({"_id": existing["_id"]}, {"$set": doc})
        else:
            doc["createdAt"] = now
            doc["lastOmdbSync"] = None
            series_id = str(db.series.insert_one(doc).inserted_id)

        if poster_url and poster_url != "N/A":
            saved_url = save_poster_to_db(series_id, poster_url)
            if saved_url:
                db.series.update_one({"_id": ObjectId(series_id)}, {"$set": {"posterUrl": saved_url}})

        result = db.series.find_one({"_id": ObjectId(series_id)})
        return jsonify({
            "message": f"Imported {len(rows)} episodes across {len(imported_seasons)} season(s)",
            "series": format_doc(result),
        })
    except ValueError as exc:
        detail = exc.args[0] if exc.args else str(exc)
        return jsonify({"error": "Invalid table data", "details": detail}), 400
    except OmdbError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
