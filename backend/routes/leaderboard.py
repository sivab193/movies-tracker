from flask import Blueprint, jsonify
from mongo_config import db

leaderboard_bp = Blueprint('leaderboard', __name__)

@leaderboard_bp.route('/', methods=['GET'])
def get_leaderboard():
    if db is None:
         return jsonify({"leaderboard": []})

    try:
        # Fetch users who joined the leaderboard, sorted by totalRuntime (descending)
        users_cursor = db.users.find({"joinedLeaderboard": True}).sort("totalRuntimeSeconds", -1).limit(100)
        
        leaderboard = []
        for user in users_cursor:
            public_fields = user.get('publicFields', ['totalRuntime', 'movieCount'])
            movies_watched = user.get('totalMoviesWatched', 0) if 'movieCount' in public_fields else -1
            user_id = user.get('customUrl') or user.get('firebaseUid') or str(user['_id'])
            leaderboard.append({
                "userId": user_id,
                "customUrl": user.get('customUrl'),
                "displayName": user.get('displayName', 'Anonymous'),
                "photoURL": user.get('photoURL'),
                "totalRuntimeSeconds": user.get('totalRuntimeSeconds', 0),
                "totalMoviesWatched": movies_watched,
                "isPublic": user.get('isPublic', False),
                "joinedLeaderboard": user.get('joinedLeaderboard', False)
            })
            
        return jsonify({"leaderboard": leaderboard})

    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return jsonify({"error": "Failed to fetch leaderboard"}), 500


@leaderboard_bp.route('/series', methods=['GET'])
def get_series_leaderboard():
    """Fun ranking of total series runtime, including rewatches."""
    if db is None:
        return jsonify({"leaderboard": []})

    try:
        users_cursor = db.users.find({
            "joinedLeaderboard": True,
            "seriesProgress.0": {"$exists": True},
        })

        leaderboard = []
        for user in users_cursor:
            total_minutes = sum(
                int(entry.get('runtimeWatchedMinutes') or 0)
                for entry in (user.get('seriesProgress') or [])
            )
            if total_minutes <= 0:
                continue

            public_fields = user.get('publicFields', ['totalRuntime', 'movieCount'])
            user_id = user.get('customUrl') or user.get('firebaseUid') or str(user['_id'])
            leaderboard.append({
                "userId": user_id,
                "customUrl": user.get('customUrl'),
                "displayName": user.get('displayName', 'Anonymous'),
                "photoURL": user.get('photoURL'),
                "totalRuntimeMinutes": total_minutes,
                "totalSeriesWatched": sum(
                    1 for entry in (user.get('seriesProgress') or [])
                    if int(entry.get('totalWatchCount') or 0) > 0
                ),
                "isPublic": user.get('isPublic', False),
                "joinedLeaderboard": user.get('joinedLeaderboard', False),
                "profileShowsMovieStats": 'movieCount' in public_fields,
            })

        leaderboard.sort(key=lambda entry: entry['totalRuntimeMinutes'], reverse=True)
        return jsonify({"leaderboard": leaderboard[:100]})

    except Exception as e:
        print(f"Error fetching series leaderboard: {e}")
        return jsonify({"error": "Failed to fetch series leaderboard"}), 500
