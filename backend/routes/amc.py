from __future__ import annotations

import datetime as dt
import hashlib
import json
import math

from flask import Blueprint, jsonify, request

from firebase_config import auth as firebase_auth
from mongo_config import db
from services.amc_cache import AMCCache
from services.amc_client import AMCClient, AMCError
from services.amc_matching import match_amc_movie


amc_bp = Blueprint("amc", __name__)
movie_showtimes_bp = Blueprint("movie_showtimes", __name__)
_cache = AMCCache(db)


def _authenticated_uid():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        decoded = firebase_auth.verify_id_token(auth_header.split(" ")[1])
        return decoded.get("uid")
    except Exception:
        return None


def _require_login():
    if _authenticated_uid() is None:
        return jsonify({"error": "Sign in required to use AMC showtimes"}), 401
    return None


amc_bp.before_request(_require_login)
movie_showtimes_bp.before_request(_require_login)

if db is not None:
    try:
        db.amc_api_cache.create_index("fetchedAtUtc", expireAfterSeconds=86400)
        db.amc_match_queue.create_index([("status", 1), ("lastSeenUtc", -1)])
    except Exception as error:
        print(f"Index creation error for AMC collections: {error}")


def _client():
    return AMCClient()


def _date_arg():
    value = request.args.get("date") or dt.date.today().isoformat()
    try:
        parsed = dt.date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("date must use YYYY-MM-DD") from exc
    today = dt.date.today()
    if parsed < today or parsed > today + dt.timedelta(days=7):
        raise ValueError("date must be between today and seven days from today")
    return value


def _coordinates():
    try:
        lat = float(request.args["lat"])
        lon = float(request.args["lon"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("lat and lon are required numbers") from exc
    if not -90 <= lat <= 90 or not -180 <= lon <= 180:
        raise ValueError("lat or lon is outside its valid range")
    return lat, lon


def _cache_key(name, **values):
    encoded = json.dumps(values, sort_keys=True, separators=(",", ":"))
    return f"{name}:{hashlib.sha256(encoded.encode()).hexdigest()}"


def _cached(name, ttl, fetch, **values):
    try:
        return _cache.get_or_fetch(_cache_key(name, **values), ttl, fetch)
    except AMCError as exc:
        if exc.is_empty_result:
            now = dt.datetime.now(dt.timezone.utc).isoformat()
            return {"data": {"items": [], "page": {}}, "fetchedAtUtc": now, "stale": False}
        raise


def _haversine_miles(lat1, lon1, lat2, lon2):
    if None in (lat2, lon2):
        return None
    radius = 3958.8
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return round(2 * radius * math.asin(math.sqrt(a)), 1)


def _group_showtimes(items, lat, lon):
    client = _client()
    groups = {}
    for showtime in items:
        theatre_id = showtime.get("theatreId")
        if theatre_id is None:
            continue
        key = str(theatre_id)
        if key not in groups:
            try:
                cached = _cached("theatre", 7 * 86400, lambda theatre_id=theatre_id: client.get_theatre(theatre_id), theatreId=key)
                theatre = cached["data"]
            except AMCError:
                theatre = {"id": theatre_id, "name": f"AMC Theatre {theatre_id}", "location": {}}
            location = theatre.get("location") or {}
            groups[key] = {
                "theatre": theatre,
                "distanceMiles": _haversine_miles(lat, lon, location.get("lat"), location.get("lon")),
                "showtimes": [],
            }
        groups[key]["showtimes"].append(showtime)
    result = list(groups.values())
    for group in result:
        group["showtimes"].sort(key=lambda item: item.get("showDateTimeLocal") or "")
    result.sort(key=lambda group: group["distanceMiles"] if group["distanceMiles"] is not None else float("inf"))
    return result


@amc_bp.errorhandler(ValueError)
def _validation_error(error):
    return jsonify({"error": str(error)}), 400


@amc_bp.errorhandler(AMCError)
def _amc_error(error):
    return jsonify({"error": str(error), "code": error.code}), error.status


@movie_showtimes_bp.errorhandler(ValueError)
def _movie_validation_error(error):
    return jsonify({"error": str(error)}), 400


@movie_showtimes_bp.errorhandler(AMCError)
def _movie_amc_error(error):
    return jsonify({"error": str(error), "code": error.code}), error.status


@amc_bp.route("/showtimes/near", methods=["GET"])
def showtimes_near():
    lat, lon = _coordinates()
    date = _date_arg()
    movie_id = request.args.get("movieId")
    raw_limit = request.args.get("limit")
    try:
        limit = int(raw_limit) if raw_limit is not None else 100
    except ValueError as exc:
        raise ValueError("limit must be an integer") from exc
    params = {"page-size": min(max(limit, 1), 200)}
    cached = _cached(
        "showtimes-near", 1800,
        lambda: _client().get_showtimes_near(date, lat, lon, **params),
        date=date, lat=round(lat, 3), lon=round(lon, 3), **params,
    )
    items = cached["data"].get("items", [])
    if movie_id:
        items = [item for item in items if str(item.get("movieId")) == str(movie_id)]
    return jsonify({
        "groups": _group_showtimes(items, lat, lon),
        "fetchedAtUtc": cached["fetchedAtUtc"],
        "stale": cached["stale"],
        "attribution": "Showtimes by AMC",
    })


@amc_bp.route("/showtimes/theatre/<theatre_id>", methods=["GET"])
def theatre_showtimes(theatre_id):
    date = _date_arg()
    cached = _cached("theatre-showtimes", 1800, lambda: _client().get_showtimes_by_theatre(theatre_id, date), theatreId=theatre_id, date=date)
    return jsonify({**cached["data"], "fetchedAtUtc": cached["fetchedAtUtc"], "stale": cached["stale"], "attribution": "Showtimes by AMC"})


@amc_bp.route("/movies/<view>", methods=["GET"])
def movie_view(view):
    methods = {"now-playing": "get_now_playing", "coming-soon": "get_coming_soon", "special-events": "get_special_events"}
    if view not in methods:
        return jsonify({"error": "Unknown AMC movie view"}), 404
    cached = _cached(f"movies-{view}", 21600, lambda: getattr(_client(), methods[view])(), view=view)
    return jsonify({**cached["data"], "fetchedAtUtc": cached["fetchedAtUtc"], "stale": cached["stale"], "attribution": "Data by AMC"})


@amc_bp.route("/theatres", methods=["GET"])
def theatres():
    params = {key: value for key in ("city", "state", "market", "brand") if (value := request.args.get(key))}
    cached = _cached("theatres", 86400, lambda: _client().get_theatres(**params), **params)
    return jsonify({**cached["data"], "fetchedAtUtc": cached["fetchedAtUtc"], "stale": cached["stale"], "attribution": "Data by AMC"})


@amc_bp.route("/theatres/<theatre_id>", methods=["GET"])
def theatre(theatre_id):
    cached = _cached("theatre", 86400, lambda: _client().get_theatre(theatre_id), theatreId=theatre_id)
    return jsonify({"theatre": cached["data"], "fetchedAtUtc": cached["fetchedAtUtc"], "stale": cached["stale"], "attribution": "Data by AMC"})


def _resolve_amc_movie(movie):
    if movie.get("amcMovieId"):
        return movie.get("amcMovieId")
    cached = _cached("movie-name", 21600, lambda: _client().get_movie_by_name(movie.get("title") or ""), name=movie.get("title") or "")
    match, confidence = match_amc_movie({
        "name": movie.get("title"), "imdbId": movie.get("imdbId"), "year": movie.get("year"), "runtime": movie.get("runtime")
    }, cached["data"].get("items", []))
    if match and confidence == "exact-imdb":
        return match.get("id")
    return None


@movie_showtimes_bp.route("/<movie_id>/showtimes", methods=["GET"])
def movie_showtimes(movie_id):
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    lat, lon = _coordinates()
    date = _date_arg()
    from routes.movies import find_movie
    movie = find_movie(movie_id)
    if not movie:
        return jsonify({"error": "Movie not found"}), 404
    amc_movie_id = _resolve_amc_movie(movie)
    if amc_movie_id is None:
        return jsonify({"groups": [], "matched": False, "attribution": "Showtimes by AMC"})
    cached = _cached("showtimes-near", 1800, lambda: _client().get_showtimes_near(date, lat, lon, **{"page-size": 200}), date=date, lat=round(lat, 3), lon=round(lon, 3), **{"page-size": 200})
    items = [item for item in cached["data"].get("items", []) if str(item.get("movieId")) == str(amc_movie_id)]
    return jsonify({
        "groups": _group_showtimes(items, lat, lon), "matched": True, "amcMovieId": amc_movie_id,
        "fetchedAtUtc": cached["fetchedAtUtc"], "stale": cached["stale"], "attribution": "Showtimes by AMC",
    })
