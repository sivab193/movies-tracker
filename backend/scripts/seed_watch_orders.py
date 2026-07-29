"""
Seed script to add initial watch orders data to MongoDB.
Run: python backend/scripts/seed_watch_orders.py

Requires MONGO_URI environment variable to be set.
"""
import os
import sys
import datetime

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from mongo_config import db
from bson import ObjectId

if db is None:
    print("ERROR: Could not connect to MongoDB. Check your MONGO_URI.")
    sys.exit(1)

now = datetime.datetime.now(datetime.timezone.utc)

watch_orders = [
    {
        "name": "Marvel Cinematic Universe (Infinity Saga)",
        "description": "The complete chronological watch order for the MCU Infinity Saga.",
        "items": [
            {
                "_id": ObjectId(),
                "type": "movie",
                "itemId": "tt0118849",
                "title": "Captain America: The First Avenger",
                "year": 2011,
                "notes": "Set during WWII, introducing the First Avenger.",
                "orderIndex": 1
            },
            {
                "_id": ObjectId(),
                "type": "movie",
                "itemId": "tt4154664",
                "title": "Captain Marvel",
                "year": 2019,
                "notes": "Set in 1995, introduces Carol Danvers and the Skrulls.",
                "orderIndex": 2
            },
            {
                "_id": ObjectId(),
                "type": "movie",
                "itemId": "tt0371746",
                "title": "Iron Man",
                "year": 2008,
                "notes": "The movie that started it all.",
                "orderIndex": 3
            },
            {
                "_id": ObjectId(),
                "type": "movie",
                "itemId": "tt0800369",
                "title": "Thor",
                "year": 2011,
                "notes": "Introduces Thor, Loki, and Asgard.",
                "orderIndex": 4
            },
            {
                "_id": ObjectId(),
                "type": "movie",
                "itemId": "tt0848228",
                "title": "The Avengers",
                "year": 2012,
                "notes": "The first major team-up event.",
                "orderIndex": 5
            }
        ],
        "createdAt": now,
        "updatedAt": now
    }
]

print("Seeding watch orders...")
for order in watch_orders:
    # Check if order already exists
    existing = db.watch_orders.find_one({"name": order["name"]})
    if existing:
        print(f"  ⚠️  '{order['name']}' already exists, skipping.")
        continue
    
    result = db.watch_orders.insert_one(order)
    print(f"  ✅ Added '{order['name']}' (ID: {result.inserted_id})")

print(f"\nDone! {db.watch_orders.count_documents({})} total watch orders in database.")
