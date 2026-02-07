import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

load_dotenv()

def get_db():
    mongo_uri = os.environ.get('MONGO_URI')
    if not mongo_uri:
        print("MONGO_URI not found in environment.")
        return None
    try:
        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
        return client.get_database('movies_db') 
    except Exception as e:
        print(f"Error: {e}")
        return None

def seed_users():
    db = get_db()
    if db is None:
        return

    users_col = db.users
    # clean up?
    # users_col.delete_many({}) 

    test_users = [
        {"displayName": "Alice Cinema", "photoURL": "", "totalMoviesWatched": 15, "totalRuntimeSeconds": 15 * 120 * 60},
        {"displayName": "Bob Film", "photoURL": "", "totalMoviesWatched": 8, "totalRuntimeSeconds": 8 * 110 * 60},
        {"displayName": "Charlie Movie", "photoURL": "", "totalMoviesWatched": 22, "totalRuntimeSeconds": 22 * 105 * 60},
        {"displayName": "Dave Screen", "photoURL": "", "totalMoviesWatched": 5, "totalRuntimeSeconds": 5 * 130 * 60},
        {"displayName": "Eve Director", "photoURL": "", "totalMoviesWatched": 40, "totalRuntimeSeconds": 40 * 95 * 60},
    ]

    print("Seeding users...")
    for user in test_users:
        users_col.insert_one(user)
        print(f"Added user: {user['displayName']}")

if __name__ == "__main__":
    seed_users()
    print("Done!")
