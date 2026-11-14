"""Deterministic AMC-to-MediaVerse movie matching."""

from __future__ import annotations

import re
import unicodedata


def normalize_title(value):
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def release_year(movie):
    value = movie.get("year") or movie.get("releaseDateUtc") or movie.get("released")
    match = re.search(r"\b(19|20)\d{2}\b", str(value or ""))
    return int(match.group(0)) if match else None


def runtime_minutes(movie):
    value = movie.get("runtimeMinutes") or movie.get("runTime") or movie.get("runtime")
    match = re.search(r"\d+", str(value or ""))
    return int(match.group(0)) if match else None


def match_amc_movie(amc_movie, candidates):
    """Return ``(candidate, confidence)`` using the approved fallback chain."""
    imdb_id = str(amc_movie.get("imdbId") or "").lower()
    if imdb_id:
        for candidate in candidates:
            if str(candidate.get("imdbId") or "").lower() == imdb_id:
                return candidate, "exact-imdb"

    title = normalize_title(amc_movie.get("name"))
    year = release_year(amc_movie)
    runtime = runtime_minutes(amc_movie)
    same_title_year = [
        candidate for candidate in candidates
        if normalize_title(candidate.get("title") or candidate.get("name")) == title
        and release_year(candidate) == year
    ]
    if runtime is not None:
        for candidate in same_title_year:
            candidate_runtime = runtime_minutes(candidate)
            if candidate_runtime is not None and abs(candidate_runtime - runtime) <= 2:
                return candidate, "title-year-runtime"
    if len(same_title_year) == 1:
        return same_title_year[0], "title-year-low"
    return None, None
