"""Populate actor/director credits for legacy movie catalog entries from OMDb.

Run from backend/: python scripts/backfill_people_credits.py --execute
Without --execute it reports how many records would be updated.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mongo_config import db
from routes.movies import fetch_movie_from_omdb, normalize_credit_names


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execute', action='store_true', help='Write fetched credits to MongoDB')
    parser.add_argument('--limit', type=int, default=0, help='Maximum movies to process (0 = all)')
    args = parser.parse_args()
    if db is None:
        raise SystemExit('MongoDB is not connected')

    query = {'$or': [{'actors': {'$exists': False}}, {'directors': {'$exists': False}}]}
    cursor = db.movies.find(query, {'imdbId': 1, 'title': 1})
    candidates = list(cursor)
    if args.limit > 0:
        candidates = candidates[:args.limit]
    print(f'{len(candidates)} movie(s) need people credits.')
    if not args.execute:
        print('Dry run only. Re-run with --execute to fetch and save credits.')
        return

    updated = 0
    for movie in candidates:
        imdb_id = movie.get('imdbId')
        if not imdb_id:
            continue
        try:
            data = fetch_movie_from_omdb(imdb_id)
            directors = normalize_credit_names(data.get('Director'))
            db.movies.update_one({'_id': movie['_id']}, {'$set': {
                'actors': normalize_credit_names(data.get('Actors')),
                'directors': directors,
                'director': ', '.join(directors) if directors else None,
            }})
            updated += 1
            print(f"Updated {movie.get('title') or imdb_id}")
        except Exception as error:
            print(f"Skipped {movie.get('title') or imdb_id}: {error}")
    print(f'Updated {updated} movie(s).')


if __name__ == '__main__':
    main()
