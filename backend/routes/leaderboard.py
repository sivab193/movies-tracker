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
            leaderboard.append({
                "userId": str(user['_id']),
                "displayName": user.get('displayName', 'Anonymous'),
                "photoURL": user.get('photoURL'),
                "totalRuntimeSeconds": user.get('totalRuntimeSeconds', 0),
                "totalMoviesWatched": user.get('totalMoviesWatched', 0),
                "isPublic": user.get('isPublic', False)
            })
            
        return jsonify({"leaderboard": leaderboard})

    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return jsonify({"error": "Failed to fetch leaderboard"}), 500
