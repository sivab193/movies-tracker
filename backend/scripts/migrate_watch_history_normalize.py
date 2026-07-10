import os
import sys
from dotenv import load_dotenv
from bson import ObjectId

# Ensure backend root is on the path for imports and .env lookup
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from mongo_config import db

if __name__ == '__main__':
    if db is None:
        print('Database not connected. Set MONGO_URI in .env or environment.')
        exit(1)

    users = list(db.users.find({}))
    total_updated = 0
    total_fixed = 0

    for user in users:
        history = user.get('watchHistory', [])
        if not history:
            continue

        modifications = []
        for entry in history:
            entry_changes = {}
            movie_id = entry.get('movieId')
            theater_name = entry.get('theaterName')
            theater_location = entry.get('theaterLocation')

            if movie_id and isinstance(movie_id, str) and ObjectId.is_valid(movie_id):
                movie = db.movies.find_one({'_id': ObjectId(movie_id)})
                if movie:
                    if entry.get('movieTitle') != movie.get('title'):
                        entry_changes['watchHistory.$.movieTitle'] = movie.get('title')
                    if entry.get('moviePosterUrl') != movie.get('posterUrl'):
                        entry_changes['watchHistory.$.moviePosterUrl'] = movie.get('posterUrl')

            theater_id = entry.get('theaterId')
            theater = None
            if theater_id:
                try:
                    if isinstance(theater_id, str) and ObjectId.is_valid(theater_id):
                        theater = db.theaters.find_one({'_id': ObjectId(theater_id)})
                    elif isinstance(theater_id, ObjectId):
                        theater = db.theaters.find_one({'_id': theater_id})
                except Exception:
                    theater = None

            if not theater and theater_name:
                theater = db.theaters.find_one({'name': theater_name, 'location': theater_location})
                if not theater:
                    theater = db.theaters.find_one({'name': theater_name})
                if theater and not theater_id:
                    entry_changes['watchHistory.$.theaterId'] = theater['_id']

            if theater:
                if entry.get('theaterName') != theater.get('name'):
                    entry_changes['watchHistory.$.theaterName'] = theater.get('name')
                if entry.get('theaterLocation') != theater.get('location'):
                    entry_changes['watchHistory.$.theaterLocation'] = theater.get('location')
                if entry.get('theaterGmapsLink') != theater.get('gmapsLink'):
                    entry_changes['watchHistory.$.theaterGmapsLink'] = theater.get('gmapsLink')

            if entry_changes:
                modifications.append((entry['_id'], entry_changes))

        if modifications:
            for entry_id, changes in modifications:
                db.users.update_one(
                    {'_id': user['_id'], 'watchHistory._id': entry_id},
                    {'$set': changes}
                )
            total_fixed += len(modifications)
            total_updated += 1
            print(f"Updated {len(modifications)} watch history entries for user {user.get('firebaseUid') or str(user['_id'])}")

    print(f"Migration complete. Users updated: {total_updated}, entries updated: {total_fixed}")
