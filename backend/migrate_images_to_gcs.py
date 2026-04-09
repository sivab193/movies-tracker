"""
One-time migration script to move existing movie poster images from
external OMDb/Amazon URLs to Google Cloud Storage (coverpics/ folder).

Also updates poster URLs in user watch history entries.

Usage:
    python migrate_images_to_gcs.py
    python migrate_images_to_gcs.py --dry-run   # Preview without changes
"""

import os
import sys
import argparse
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from mongo_config import db
from gcs_config import upload_image_from_url, GCS_BUCKET_NAME


def migrate_movie_posters(dry_run=False):
    """Migrate movie poster URLs from external sources to GCS."""
    if db is None:
        print("Database connection failed. Check MONGO_URI in .env")
        return

    gcs_base = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/"

    # Find movies with non-GCS poster URLs
    movies = list(db.movies.find({
        "posterUrl": {"$ne": None, "$not": {"$regex": f"^{gcs_base}"}}
    }))

    print(f"Found {len(movies)} movies with external poster URLs to migrate.")

    migrated = 0
    failed = 0

    for movie in movies:
        imdb_id = movie.get('imdbId')
        old_url = movie.get('posterUrl')

        if not old_url or not imdb_id:
            continue

        dest_blob = f"coverpics/{imdb_id}.jpg"

        if dry_run:
            print(f"  [DRY RUN] Would migrate {imdb_id}: {old_url[:60]}...")
            migrated += 1
            continue

        print(f"  Migrating {imdb_id} ({movie.get('title', 'Unknown')})...")
        new_url = upload_image_from_url(old_url, dest_blob)

        if new_url:
            # Update movie document
            db.movies.update_one(
                {"_id": movie["_id"]},
                {"$set": {"posterUrl": new_url}}
            )

            # Update any watch history entries that reference this movie's poster
            db.users.update_many(
                {"watchHistory.imdbId": imdb_id},
                {"$set": {"watchHistory.$[elem].moviePosterUrl": new_url}},
                array_filters=[{"elem.imdbId": imdb_id}]
            )

            print(f"    ✓ Migrated to {new_url}")
            migrated += 1
        else:
            print(f"    ✗ Failed to upload {imdb_id}")
            failed += 1

    print(f"\nMigration complete! Migrated: {migrated} | Failed: {failed}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate movie poster images to GCS")
    parser.add_argument('--dry-run', action='store_true', help="Preview changes without applying them")
    args = parser.parse_args()

    migrate_movie_posters(dry_run=args.dry_run)
