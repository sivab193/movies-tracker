#!/usr/bin/env python3
"""Import actor/movie relationships from a CSV and build actor watch orders.

Only the Actor and IMDb TT columns are authoritative. Movie metadata is read
from the existing MongoDB movie catalog, or fetched from OMDb when absent.

Usage:
    python3 scripts/import_actor_watch_orders.py /path/to/movies.csv --dry-run
    python3 scripts/import_actor_watch_orders.py /path/to/movies.csv --execute
"""

import argparse
import csv
import datetime
import os
import re
import sys

import requests
from bson import Binary, ObjectId
from dotenv import load_dotenv

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from mongo_config import db  # noqa: E402


def clean(value):
    return (value or '').strip()


def normalize_names(value):
    if not isinstance(value, str) or value in ('', 'N/A'):
        return []
    return list(dict.fromkeys(name.strip() for name in value.split(',') if name.strip()))


def parse_year(value):
    match = re.search(r'\d{4}', clean(value))
    return int(match.group()) if match else 0


def read_csv(path):
    groups = {}
    seen_by_actor = {}
    invalid = []

    with open(path, newline='', encoding='utf-8-sig') as handle:
        reader = csv.DictReader(handle)
        required = {'Actor', 'IMDb TT'}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV is missing required column(s): {', '.join(sorted(missing))}")

        for row_number, row in enumerate(reader, start=2):
            actor = clean(row.get('Actor'))
            imdb_id = clean(row.get('IMDb TT'))
            if not actor or not imdb_id.startswith('tt'):
                invalid.append((row_number, actor or '<empty actor>', imdb_id or '<empty IMDb TT>'))
                continue
            groups.setdefault(actor, [])
            seen_by_actor.setdefault(actor, set())
            if imdb_id in seen_by_actor[actor]:
                continue
            seen_by_actor[actor].add(imdb_id)
            groups[actor].append(imdb_id)

    return groups, invalid


def fetch_omdb(imdb_id):
    # This bulk import intentionally uses only the explicitly configured
    # environment key. Do not select or consume keys stored in MongoDB.
    api_key = os.environ.get('OMDB_API_KEY', '').strip()
    if not api_key:
        raise RuntimeError('OMDB_API_KEY is missing from backend/.env')
    response = requests.get(
        'https://www.omdbapi.com/',
        params={'i': imdb_id, 'apikey': api_key, 'plot': 'short'},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    if data.get('Error'):
        raise RuntimeError(data['Error'])
    return data


def release_date(omdb, year):
    value = clean(omdb.get('Released'))
    for fmt in ('%d %b %Y', '%Y-%m-%d', '%B %d, %Y'):
        try:
            return datetime.datetime.strptime(value, fmt).strftime('%Y-%m-%d')
        except ValueError:
            pass
    return f'{year}-01-01' if year else None


def build_movie(imdb_id, omdb):
    year = parse_year(omdb.get('Year'))
    runtime = parse_year(omdb.get('Runtime'))
    return {
        'imdbId': imdb_id,
        'title': clean(omdb.get('Title')) or imdb_id,
        'year': year,
        'imdbRating': float(omdb['imdbRating']) if clean(omdb.get('imdbRating')) not in ('', 'N/A') else None,
        'runtime': clean(omdb.get('Runtime')) or 'N/A',
        'averageTimeSeconds': runtime * 60,
        'language': clean(omdb.get('Language')) or 'English',
        'Language': clean(omdb.get('Language')) or 'English',
        'released': clean(omdb.get('Released')) or str(year),
        'releaseDate': release_date(omdb, year),
        'plot': omdb.get('Plot') if omdb.get('Plot') != 'N/A' else None,
        'genre': omdb.get('Genre') if omdb.get('Genre') != 'N/A' else None,
        'actors': normalize_names(omdb.get('Actors')),
        'directors': normalize_names(omdb.get('Director')),
        'director': clean(omdb.get('Director')) if clean(omdb.get('Director')) != 'N/A' else None,
    }


def save_poster(movie_id, poster_url):
    if not poster_url or poster_url == 'N/A':
        return
    try:
        response = requests.get(poster_url, timeout=20)
        if response.status_code == 200:
            db.movie_posters.update_one(
                {'movieId': str(movie_id)},
                {'$set': {
                    'imageData': Binary(response.content),
                    'mimeType': response.headers.get('Content-Type', 'image/jpeg').split(';')[0],
                }},
                upsert=True,
            )
            db.movies.update_one(
                {'_id': movie_id},
                {'$set': {'posterUrl': f'/api/movies/{movie_id}/poster'}},
            )
    except Exception as error:
        print(f'  Warning: poster download failed for {movie_id}: {error}')


def resolve_movies(movie_ids, execute):
    # Use one query instead of one network round-trip per movie. The latter
    # makes a dry run appear hung when Atlas is slow or temporarily unreachable.
    print(f'Checking {len(movie_ids)} movie IDs in MongoDB...')
    resolved = {
        movie['imdbId']: movie
        for movie in db.movies.find({'imdbId': {'$in': movie_ids}})
        if movie.get('imdbId')
    }
    missing = [imdb_id for imdb_id in movie_ids if imdb_id not in resolved]

    if not execute:
        return resolved, missing

    for index, imdb_id in enumerate(missing, start=1):
        print(f'  Fetching {index}/{len(missing)}: {imdb_id}')
        omdb = fetch_omdb(imdb_id)
        movie = build_movie(imdb_id, omdb)
        now = datetime.datetime.now(datetime.timezone.utc)
        movie.update({'createdAt': now, 'updatedAt': now, 'submissionCount': 0, 'posterUrl': None})
        result = db.movies.insert_one(movie)
        movie['_id'] = result.inserted_id
        resolved[imdb_id] = movie
        save_poster(result.inserted_id, omdb.get('Poster'))
    return resolved, []


def slugify(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')[:40] or 'watch-order'


def unique_slug(name, exclude_id=None):
    base = slugify(name)
    candidate, suffix = base, 2
    while True:
        query = {'slug': candidate}
        if exclude_id is not None:
            query['_id'] = {'$ne': exclude_id}
        if not db.watch_orders.find_one(query):
            return candidate
        candidate = f'{base[:40 - len(str(suffix)) - 1].strip("-")}-{suffix}'
        suffix += 1


def save_order(actor, imdb_ids, movies, execute):
    name = f'{actor} Movies'
    items = []
    for index, imdb_id in enumerate(imdb_ids, start=1):
        movie = movies.get(imdb_id)
        if not movie:
            continue
        items.append({
            '_id': ObjectId(),
            'type': 'movie',
            'itemId': imdb_id,
            'title': movie.get('title') or imdb_id,
            'year': movie.get('year') or 0,
            'notes': '',
            'orderIndex': index,
        })

    existing = db.watch_orders.find_one({'name': name})
    print(f"  {'Update' if existing else 'Create'} '{name}': {len(items)} items")
    if not execute:
        return

    now = datetime.datetime.now(datetime.timezone.utc)
    if existing:
        existing_item_ids = {
            item.get('itemId'): item.get('_id')
            for item in existing.get('items', []) if item.get('_id')
        }
        for item in items:
            if item['itemId'] in existing_item_ids:
                item['_id'] = existing_item_ids[item['itemId']]
        update = {'items': items, 'updatedAt': now}
        if not existing.get('slug'):
            update['slug'] = unique_slug(name, existing['_id'])
        db.watch_orders.update_one({'_id': existing['_id']}, {'$set': update})
    else:
        db.watch_orders.insert_one({
            'name': name,
            'slug': unique_slug(name),
            'description': f'Cumulative movies featuring {actor}, in CSV order.',
            'items': items,
            'createdAt': now,
            'updatedAt': now,
        })


def main():
    parser = argparse.ArgumentParser(description='Import actor movie lists and create watch orders.')
    parser.add_argument('csv_path')
    parser.add_argument('--execute', action='store_true', help='Write movies and watch orders to MongoDB')
    args = parser.parse_args()

    if db is None:
        raise SystemExit('Cannot connect to MongoDB. Check backend/.env')
    if not os.path.exists(args.csv_path):
        raise SystemExit(f'CSV not found: {args.csv_path}')

    groups, invalid = read_csv(args.csv_path)
    all_ids = list(dict.fromkeys(imdb_id for ids in groups.values() for imdb_id in ids))
    print(f"CSV: {sum(map(len, groups.values()))} actor/movie links, {len(all_ids)} unique movies")
    for actor, ids in groups.items():
        print(f'  {actor}: {len(ids)} movies')
    if invalid:
        print(f'  Warning: {len(invalid)} invalid row(s) skipped')

    movies, missing = resolve_movies(all_ids, args.execute)
    if missing:
        print(f'  {len(missing)} movie(s) are not in MongoDB and will be fetched during --execute.')
        print(f'  Missing IDs: {", ".join(missing)}')

    for actor, ids in groups.items():
        save_order(actor, ids, movies, args.execute)
    print('Done.' if args.execute else 'Dry run complete. Nothing was written.')


if __name__ == '__main__':
    main()
