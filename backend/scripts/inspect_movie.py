import os
import sys
from bson import ObjectId
from dotenv import load_dotenv

# Add parent dir to path to import mongo_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from mongo_config import db

def check_movie():
    if db is None:
        print("Database connection failed.")
        return
    movie_id = "6a501656ce2d24ada42ff7d6"
    doc = None
    if ObjectId.is_valid(movie_id):
        doc = db.movies.find_one({"_id": ObjectId(movie_id)})
    if not doc:
        doc = db.movies.find_one({"_id": movie_id})
    if not doc:
        doc = db.movies.find_one({"id": movie_id})
    
    if doc:
        print("Found movie:")
        for k, v in doc.items():
            print(f"  {k}: {v}")
    else:
        print(f"Movie {movie_id} not found in database.")

if __name__ == "__main__":
    check_movie()
