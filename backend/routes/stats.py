from flask import Blueprint, jsonify
from collections import Counter
from mongo_config import db

stats_bp = Blueprint('stats', __name__)


@stats_bp.route('/summary', methods=['GET'])
def get_stats_summary():
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500

    total_users = db.users.count_documents({})
    total_movies = db.movies.count_documents({})
    total_theaters = db.theaters.count_documents({})

    watch_counts = Counter()
    location_counts = Counter()
    theater_counts = Counter()
    total_watch_entries = 0
    users_with_history = 0

    users_cursor = db.users.find({}, {"watchHistory": 1, "totalRuntimeSeconds": 1})
    for user in users_cursor:
        history = user.get("watchHistory", [])
        if history:
            users_with_history += 1

        total_watch_entries += len(history)

        for entry in history:
            movie_title = entry.get("movieTitle") or "Untitled"
            watch_counts[movie_title] += 1

            location = entry.get("theaterLocation") or "Unknown"
            location_counts[location] += 1

            theater = entry.get("theaterName") or "Unknown"
            theater_counts[theater] += 1

    most_watched_movie = {"title": "No watches yet", "count": 0}
    if watch_counts:
        title, count = watch_counts.most_common(1)[0]
        most_watched_movie = {"title": title, "count": int(count)}

    top_location = {"name": "No data", "count": 0}
    if location_counts:
        name, count = location_counts.most_common(1)[0]
        top_location = {"name": name, "count": int(count)}

    top_theater = {"name": "No data", "count": 0}
    if theater_counts:
        name, count = theater_counts.most_common(1)[0]
        top_theater = {"name": name, "count": int(count)}

    average_watches_per_user = round(total_watch_entries / total_users, 1) if total_users else 0
    average_watches_per_location = round(total_watch_entries / len(location_counts), 1) if location_counts else 0
    average_watches_per_movie = round(total_watch_entries / total_movies, 1) if total_movies else 0
    history_share = round((users_with_history / total_users) * 100, 1) if total_users else 0

    insights = []
    if most_watched_movie["count"] > 0:
        insights.append(f"{most_watched_movie['title']} is the crowd favorite with {most_watched_movie['count']} watches.")
    if top_location["count"] > 0:
        insights.append(f"{top_location['name']} leads the city chart with {top_location['count']} watch entries.")
    if average_watches_per_user > 0:
        insights.append(f"Members average {average_watches_per_user} watch entries each, showing strong engagement.")
    if total_theaters:
        insights.append(f"Your theater lineup spans {total_theaters} venues, keeping discovery fresh.")

    return jsonify({
        "totalUsers": total_users,
        "totalMovies": total_movies,
        "totalTheaters": total_theaters,
        "totalWatchEntries": total_watch_entries,
        "usersWithHistory": users_with_history,
        "historySharePercent": history_share,
        "averageWatchesPerUser": average_watches_per_user,
        "averageWatchesPerLocation": average_watches_per_location,
        "averageWatchesPerMovie": average_watches_per_movie,
        "mostWatchedMovie": most_watched_movie,
        "topLocation": top_location,
        "topTheater": top_theater,
        "insights": insights,
    })
