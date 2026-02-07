import os
from pymongo import MongoClient
import certifi

def get_db():
    mongo_uri = os.environ.get('MONGO_URI')
    if not mongo_uri:
        return None
    
    try:
        # certifi.where() is often needed on Mac for SSL
        client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
        # Assuming database name is in URI, otherwise pick default 'movies_db'
        db = client.get_database('movies_db') 
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

db = get_db()
