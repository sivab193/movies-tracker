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

    total_series = db.series.count_documents({})
    series_agg = list(db.series.aggregate([
        {"$group": {"_id": None, "totalEps": {"$sum": "$totalEpisodes"}, "totalRuntime": {"$sum": "$totalRuntimeMinutes"}}}
    ]))
    total_episodes = series_agg[0]["totalEps"] if series_agg else 0
    series_catalog_runtime_minutes = series_agg[0]["totalRuntime"] if series_agg else 0

    total_movie_runtime_minutes = 0
    for m in db.movies.find({}, {"runtime": 1}):
        rt = m.get("runtime", "")
        if rt and rt != "N/A":
            try:
                total_movie_runtime_minutes += int(rt.split(" ")[0])
            except (ValueError, IndexError):
                pass
    movies_catalog_runtime_minutes = total_movie_runtime_minutes

    total_catalog_runtime_minutes = series_catalog_runtime_minutes + movies_catalog_runtime_minutes

    community_watch_agg = list(db.users.aggregate([
        {"$group": {"_id": None, "totalSeconds": {"$sum": "$totalRuntimeSeconds"}}}
    ]))
    community_watch_time_seconds = community_watch_agg[0]["totalSeconds"] if community_watch_agg else 0

    genre_counts = Counter()
    for movie in db.movies.find({}, {"genre": 1}):
        genre_val = movie.get("genre", "")
        if genre_val:
            for g in genre_val.split(","):
                g = g.strip()
                if g:
                    genre_counts[g] += 1
    for series in db.series.find({}, {"genre": 1}):
        genre_val = series.get("genre", "")
        if genre_val:
            for g in genre_val.split(","):
                g = g.strip()
                if g:
                    genre_counts[g] += 1
    top_genre = genre_counts.most_common(1)[0][0] if genre_counts else None

    insights = []
    if most_watched_movie["count"] > 0:
        insights.append(f"{most_watched_movie['title']} is the crowd favorite with {most_watched_movie['count']} watches.")
    if top_location["count"] > 0:
        insights.append(f"{top_location['name']} leads the city chart with {top_location['count']} watch entries.")
    if average_watches_per_user > 0:
        insights.append(f"Members average {average_watches_per_user} watch entries each, showing strong engagement.")
    if total_theaters:
        insights.append(f"Your theater lineup spans {total_theaters} venues, keeping discovery fresh.")
    if total_catalog_runtime_minutes > 0:
        catalog_days = total_catalog_runtime_minutes // (24 * 60)
        catalog_hrs = (total_catalog_runtime_minutes % (24 * 60)) // 60
        catalog_str = f"{catalog_days}d {catalog_hrs}h" if catalog_days > 0 else f"{catalog_hrs}h"
        insights.append(f"Our content catalog spans {catalog_str} of entertainment across movies and series.")
    if community_watch_time_seconds > 0:
        comm_days = community_watch_time_seconds // 86400
        comm_hrs = (community_watch_time_seconds % 86400) // 3600
        comm_str = f"{comm_days}d {comm_hrs}h" if comm_days > 0 else f"{comm_hrs}h"
        insights.append(f"Together, the community has watched {comm_str} of content — and counting!")

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
        "totalSeries": total_series,
        "totalEpisodes": total_episodes,
        "seriesCatalogRuntimeMinutes": series_catalog_runtime_minutes,
        "moviesCatalogRuntimeMinutes": movies_catalog_runtime_minutes,
        "totalCatalogRuntimeMinutes": total_catalog_runtime_minutes,
        "communityWatchTimeSeconds": community_watch_time_seconds,
        "topGenre": top_genre,
        "insights": insights,
    })
