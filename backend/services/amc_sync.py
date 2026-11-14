"""Explicit synchronization jobs for AMC catalog data."""

from __future__ import annotations

import datetime as dt

from services.amc_matching import match_amc_movie


def sync_movie_catalog(database, client):
    now = dt.datetime.now(dt.timezone.utc)
    amc_movies = client.get_now_playing().get("items", []) + client.get_coming_soon().get("items", [])
    deduped = {str(movie.get("id")): movie for movie in amc_movies if movie.get("id")}
    matched = queued = 0
    for amc_movie in deduped.values():
        candidate_queries = [{"title": {"$regex": f"^{_regex_escape(amc_movie.get('name'))}$", "$options": "i"}}]
        if amc_movie.get("imdbId"):
            candidate_queries.insert(0, {"imdbId": amc_movie["imdbId"]})
        candidates = list(database.movies.find({"$or": candidate_queries}))
        movie, confidence = match_amc_movie(amc_movie, candidates)
        if movie and confidence != "title-year-low":
            database.movies.update_one({"_id": movie["_id"]}, {"$set": {
                "amcMovieId": amc_movie.get("id"),
                "amcSlug": amc_movie.get("slug"),
                "amcScore": amc_movie.get("score"),
                "theatricalStatus": "in-theatres" if amc_movie.get("hasScheduledShowtimes") else "coming-soon",
                "firstShowingUtc": amc_movie.get("earliestShowingUtc"),
                "amcLastSyncedUtc": now,
                "amcMatchConfidence": confidence,
            }})
            matched += 1
        else:
            database.amc_match_queue.update_one(
                {"amcMovieId": amc_movie.get("id")},
                {"$set": {
                    "movie": amc_movie,
                    "status": "pending",
                    "lastSeenUtc": now,
                    "suggestedMovieId": movie.get("_id") if movie else None,
                    "suggestedConfidence": confidence,
                }, "$setOnInsert": {"createdAtUtc": now}},
                upsert=True,
            )
            queued += 1
    return {"seen": len(deduped), "matched": matched, "queued": queued}


def sync_theatres(database, client):
    now = dt.datetime.now(dt.timezone.utc)
    page = 1
    synced = 0
    while True:
        response = client.get_theatres(**{"page-number": page, "page-size": 100})
        items = response.get("items", [])
        for theatre in items:
            if not theatre.get("id") or not theatre.get("name"):
                continue
            database.theaters.update_one(
                {"chain": "AMC", "amcTheatreId": theatre["id"]},
                {"$set": {**theatre, "amcTheatreId": theatre["id"], "amcLastSyncedUtc": now}},
                upsert=True,
            )
            synced += 1
        page_info = response.get("page") or {}
        total_pages = page_info.get("totalPages") or page_info.get("total_pages")
        if not items or (total_pages and page >= int(total_pages)) or len(items) < 100:
            break
        page += 1
    return {"synced": synced}


def _regex_escape(value):
    import re
    return re.escape(str(value or ""))
