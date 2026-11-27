"""Unified global search across the MediaVerse catalog.

One grouped response powers the header command palette: movies, series,
theatres, people (derived from catalog credits, like routes/people.py),
and public user profiles. Only users with a public profile and a claimed
custom URL are returned, matching the disclosure rules of
GET /api/users/<user_id>.
"""

from __future__ import annotations

import re

from flask import Blueprint, jsonify, request

from mongo_config import db
from routes.people import credit_names, person_slug


search_bp = Blueprint("search", __name__)

GROUP_LIMIT = 5
SCAN_LIMIT = 25
PEOPLE_SCAN_LIMIT = 50


def _regex(query_text):
    # Escaped for the same reason as the movie picker search: titles with
    # characters like "(" must not become invalid regex.
    return {"$regex": re.escape(query_text), "$options": "i"}


def _empty_results(query_text):
    return {"query": query_text, "movies": [], "series": [], "theatres": [], "people": [], "users": []}


def _search_movies(query_text):
    docs = db.movies.find(
        {"title": _regex(query_text)},
        {"title": 1, "year": 1, "posterUrl": 1, "imdbId": 1},
    ).limit(SCAN_LIMIT)
    results = [{
        "id": str(doc["_id"]),
        "title": doc.get("title") or "Untitled",
        "year": doc.get("year"),
        "posterUrl": doc.get("posterUrl"),
        "imdbId": doc.get("imdbId"),
    } for doc in docs]
    results.sort(key=lambda item: item["title"].lower())
    return results[:GROUP_LIMIT]


def _search_series(query_text):
    docs = db.series.find(
        {"title": _regex(query_text)},
        {"title": 1, "year": 1, "posterUrl": 1, "imdbId": 1},
    ).limit(SCAN_LIMIT)
    results = [{
        "id": str(doc["_id"]),
        "title": doc.get("title") or "Untitled",
        "year": doc.get("year"),
        "posterUrl": doc.get("posterUrl"),
        "imdbId": doc.get("imdbId"),
    } for doc in docs]
    results.sort(key=lambda item: item["title"].lower())
    return results[:GROUP_LIMIT]


def _search_theatres(query_text):
    docs = db.theaters.find(
        {"$or": [{"name": _regex(query_text)}, {"location": _regex(query_text)}]},
        {"name": 1, "location": 1},
    ).limit(SCAN_LIMIT)
    results = [{
        "id": str(doc["_id"]),
        "name": doc.get("name") or "Untitled theatre",
        "location": doc.get("location"),
    } for doc in docs]
    results.sort(key=lambda item: item["name"].lower())
    return results[:GROUP_LIMIT]


def _search_users(query_text):
    docs = db.users.find(
        {"isPublic": True, "$or": [{"displayName": _regex(query_text)}, {"customUrl": _regex(query_text)}]},
        {"displayName": 1, "customUrl": 1, "photoURL": 1},
    ).limit(SCAN_LIMIT)
    results = [{
        "username": doc["customUrl"],
        "displayName": doc.get("displayName") or "Anonymous",
        "photoURL": doc.get("photoURL"),
    } for doc in docs if doc.get("customUrl")]
    results.sort(key=lambda item: item["displayName"].lower())
    return results[:GROUP_LIMIT]


def _credit_names_for(doc, item_type):
    if item_type == "movie":
        actors = credit_names(doc, "actors", "Actors") or credit_names(doc, "actors", "actors")
        directors = credit_names(doc, "directors", "Director") or credit_names(doc, "directors", "director")
    else:
        actors = credit_names(doc, "actors", "actors")
        directors = credit_names(doc, "directors", "director")
    return actors + directors


def _search_people(query_text):
    pattern = _regex(query_text)
    query = {"$or": [
        {"actors": pattern}, {"directors": pattern},
        {"Actors": pattern}, {"Director": pattern}, {"director": pattern},
    ]}
    projection = {"actors": 1, "directors": 1, "Actors": 1, "Director": 1, "director": 1}
    needle = query_text.lower()
    found = {}
    for collection, item_type in ((db.movies, "movie"), (db.series, "series")):
        for doc in collection.find(query, projection).limit(PEOPLE_SCAN_LIMIT):
            for name in _credit_names_for(doc, item_type):
                if needle in name.lower():
                    found.setdefault(person_slug(name), name)
    results = [{"name": name, "slug": slug} for slug, name in found.items() if slug]
    results.sort(key=lambda item: item["name"].lower())
    return results[:GROUP_LIMIT]


@search_bp.route("/", methods=["GET"])
def global_search():
    query_text = (request.args.get("q") or "").strip()
    if not query_text or db is None:
        return jsonify(_empty_results(query_text))
    results = _empty_results(query_text)
    results["movies"] = _search_movies(query_text)
    results["series"] = _search_series(query_text)
    results["theatres"] = _search_theatres(query_text)
    results["people"] = _search_people(query_text)
    results["users"] = _search_users(query_text)
    return jsonify(results)
