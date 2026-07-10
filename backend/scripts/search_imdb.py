import os
import sys
import re
import urllib.parse
import json
import datetime
import requests
from dotenv import load_dotenv
from bson import ObjectId, Binary

# Ensure backend root is on the path for imports
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)

# Load env from backend folder
load_dotenv()

from mongo_config import db

OMDB_API_KEY = os.environ.get('OMDB_API_KEY', 'd8dd897d')

imdb_list_movies = {
    "Karuppu": "tt33988385",
    "Parasakthi": "tt35019998",
    "Thaai Kizhavi": "tt39255646",
    "Blast": "tt37971394",
    "Youth": "tt38693888",
    "LIK: Love Insurance Kompany": "tt30460421",
    "Love Insurance Kompany": "tt30460421",
    "Kara": "tt37458112",
    "TTT: Thalaivar Thambi Thalaimaiyil": "tt36926733",
    "Thalaivar Thambi Thalaimaiyil": "tt36926733",
    "With Love": "tt38123566",
    "Gatta Kusthi 2": "tt37458495",
    "Vaa Vaathiyaar": "tt26234108",
    "Leader": "tt32741341",
    "Draupathi 2": "tt33063741",
    "Jana Nayagan": "tt33379543",
    "Vishwanath and Sons": "tt35836025",
    "Dhruva Natchathiram Chapter 1: Yuddha Kaandam": "tt6735802",
    "DC": "tt37501035",
    "Jailer 2": "tt33318732",
    "OM Chapter 1: Udhiram - The Blood Wood": "tt34515768",
    "Seyon": "tt39675127",
    "Arasan": "tt37458144",
    "Indian 3": "tt29898610",
    "Benz": "tt27127819",
    "Mookuthi Amman 2": "tt32909364",
    "Marshal": "tt32809427"
}

wiki_movies = [
    "29", "99/66", "Aazhi", "Anali", "Anantha", "Ananthan Kaadu", "Angikaaram", "Anthony", 
    "Arivaan", "Battle", "Blast", "Breakfast", "Carmeni Selvam", "Charukesi", "Chellamada Nee Enakku", 
    "Commando Vin Love Story", "Con City", "Dark Giant", "Day 11", "Dear Radhi", "Double Occupancy", 
    "Draupathi 2", "Dream Girl", "Fourth Floor", "Gandhi Talks", "Gilli Mappilai", "Granny", "Guest", 
    "Habeebi", "Happy Raj", "Heartin", "Hot Spot 2 Much", "Jockey", "Justice for Jeni", "Kaa – The Forest", 
    "Kaakaa", "Kaalidas 2", "Kadhal Reset Repeat", "Kara", "Karuppu", "Karuppu Pulsar", "Kenatha Kanom", 
    "Kolaiseval", "L.S.S: Love Subscribe Share", "Leader", "Lockdown", "Love Insurance Kompany", 
    "Lucky the Superstar", "MG24", "Maayabimbum", "Made in Korea", "Manithan Deivamagalam", "Mellisai", 
    "Moondram Kan", "Mr. X", "Mustafa Mustafa", "My Dear Dolly", "My Lord", "Mylanji", "Nee Forever", 
    "Neelira", "Nizhal", "Nooru Saami", "Oh Butterfly", "Parasakthi", "Parimala and Co", "Police Family", 
    "Pookie", "Red Label", "Salliyargal", "Sannidhanam P.O", "Satan – The Dark", "Sattendru Maarudhu Vaanilai", 
    "Siva Sambo", "Sweety Naughty Crazy", "TN 2026", "Thaai Kizhavi", "Thalaivar Thambi Thalaimaiyil", 
    "The Bed", "Theeyor Koodam", "Therincha Kadhalinga", "Thiraivi", "Vaa Vaathiyaar", "Vadam", "Valluvan", 
    "Vangala Viriguda", "Vasool Mannan", "Vengeance", "Vowels", "With Love", "Yaarra Andha Paiyan Naan Dhan Andha Paiyan", 
    "Yogi Da", "Youth"
]

def normalize(title):
    return re.sub(r'[^a-z0-9]', '', title.lower())

def search_suggest_api(title):
    clean_title = title.strip().lower()
    if not clean_title:
        return []
    
    first_char = clean_title[0]
    encoded_title = urllib.parse.quote(clean_title)
    url = f"https://sg.media-imdb.com/suggests/{first_char}/{encoded_title}.json"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            text = response.text
            match = re.search(r'imdb\$.*?\((.*)\)', text, re.DOTALL)
            if match:
                return json.loads(match.group(1)).get('d', [])
            match_generic = re.search(r'^[a-zA-Z0-9_]+\((.*)\)$', text.strip(), re.DOTALL)
            if match_generic:
                return json.loads(match_generic.group(1)).get('d', [])
    except Exception as e:
        print(f"Error querying suggest API for {title}: {e}")
    return []

def search_omdb_api(title):
    if not OMDB_API_KEY:
        return []
    encoded_title = urllib.parse.quote(title)
    url = f"https://www.omdbapi.com/?s={encoded_title}&type=movie&apikey={OMDB_API_KEY}"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get('Response') == 'True':
                return data.get('Search', [])
    except Exception as e:
        print(f"Error querying OMDB for {title}: {e}")
    return []

def find_best_imdb_match(title):
    norm_title = normalize(title)
    for k, v in imdb_list_movies.items():
        if normalize(k) == norm_title:
            return v, "Known List Match"
            
    suggest_results = search_suggest_api(title)
    candidates = []
    
    for item in suggest_results:
        item_id = item.get('id', '')
        if not item_id.startswith('tt'):
            continue
        item_title = item.get('l', '')
        item_year = item.get('y')
        item_type = item.get('q', '')
        
        if normalize(item_title) == norm_title or norm_title in normalize(item_title):
            score = 0
            if item_type == 'feature':
                score += 10
            if item_year in [2025, 2026, 2027]:
                score += 20
            elif item_year == 2024:
                score += 5
            candidates.append((score, item_id, item_title, item_year, "Suggest API"))
            
    omdb_results = search_omdb_api(title)
    for item in omdb_results:
        item_id = item.get('imdbID', '')
        item_title = item.get('Title', '')
        item_year_str = item.get('Year', '')
        year_match = re.search(r'\d{4}', item_year_str)
        item_year = int(year_match.group(0)) if year_match else None
        
        if normalize(item_title) == norm_title or norm_title in normalize(item_title):
            score = 5
            if item_year in [2025, 2026, 2027]:
                score += 20
            elif item_year == 2024:
                score += 5
            candidates.append((score, item_id, item_title, item_year, "OMDB Search"))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        best = candidates[0]
        return best[1], f"Matched '{best[2]}' ({best[3]}) via {best[4]} (Score: {best[0]})"
        
    return None, "Not Found"

def parse_release_date_to_iso(released_str, year_val=None):
    if not released_str or released_str == 'N/A':
        if year_val:
            return f"{str(year_val)[:4]}-01-01"
        return "1970-01-01"
    try:
        dt = datetime.datetime.strptime(str(released_str).strip(), "%d %b %Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        try:
            dt = datetime.datetime.strptime(str(released_str).strip(), "%b %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            try:
                if len(str(released_str)) == 10 and str(released_str)[4] == '-' and str(released_str)[7] == '-':
                    return str(released_str)
                return f"{str(released_str)[:4]}-01-01"
            except:
                if year_val:
                    return f"{str(year_val)[:4]}-01-01"
                return "1970-01-01"

def save_poster_to_db(movie_id, poster_url):
    if not poster_url or poster_url == "N/A":
        return None
    try:
        response = requests.get(poster_url)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            image_data = Binary(response.content)
            db.movie_posters.update_one(
                {"movieId": str(movie_id)},
                {"$set": {
                    "imageData": image_data,
                    "mimeType": content_type
                }},
                upsert=True
            )
            return f"/api/movies/{movie_id}/poster"
    except Exception as e:
        print(f"  ⚠️ Error saving poster to MongoDB: {e}")
    return None

def fetch_movie_from_omdb(imdb_id):
    if not OMDB_API_KEY:
        raise Exception("OMDB_API_KEY not found in environment.")
    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={OMDB_API_KEY}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch {imdb_id} from OMDB. Status: {response.status_code}")
    data = response.json()
    if data.get('Error'):
        raise Exception(f"OMDb Error for {imdb_id}: {data['Error']}")
    return data

def import_to_mongodb(imdb_id):
    if db is None:
        print("❌ Error: MongoDB connection is not active.")
        return False

    # Check if already exists in db
    existing = db.movies.find_one({"imdbId": imdb_id})
    
    try:
        omdb_data = fetch_movie_from_omdb(imdb_id)
        
        runtime_str = omdb_data.get('Runtime', 'N/A')
        average_time_seconds = 0
        if runtime_str != 'N/A':
            try:
                minutes = int(runtime_str.split(' ')[0])
                average_time_seconds = minutes * 60
            except Exception:
                pass

        lang = omdb_data.get('Language', 'English')
        rel_str = omdb_data.get('Released', str(omdb_data.get('Year', '')))
        year_val = int(omdb_data.get('Year')) if str(omdb_data.get('Year', '')).isdigit() else 2026
        rel_date = parse_release_date_to_iso(rel_str, year_val)

        movie_data = {
            "imdbId": imdb_id,
            "title": omdb_data.get('Title'),
            "year": year_val,
            "imdbRating": float(omdb_data.get('imdbRating')) if omdb_data.get('imdbRating') != "N/A" else None,
            "runtime": runtime_str,
            "language": lang,
            "Language": lang,
            "released": rel_str,
            "releaseDate": rel_date,
            "averageTimeSeconds": average_time_seconds
        }

        if existing:
            # Update existing document, maintaining historical fields
            db.movies.update_one(
                {"_id": existing["_id"]},
                {"$set": movie_data}
            )
            movie_id = str(existing["_id"])
            print(f"  ✅ Updated database entry: '{movie_data['title']}' ({movie_data['year']})")
        else:
            # Set creation defaults for new document
            movie_data["posterUrl"] = None
            movie_data["submissionCount"] = 0
            movie_data["createdAt"] = datetime.datetime.now(datetime.timezone.utc)
            
            result = db.movies.insert_one(movie_data)
            movie_id = str(result.inserted_id)
            print(f"  ✅ Imported new movie: '{movie_data['title']}' ({movie_data['year']})")

        # Save poster to database
        omdb_poster_url = omdb_data.get('Poster')
        if omdb_poster_url and omdb_poster_url != "N/A":
            poster_url = save_poster_to_db(movie_id, omdb_poster_url)
            if poster_url:
                db.movies.update_one({"_id": ObjectId(movie_id)}, {"$set": {"posterUrl": poster_url}})
                
        return True
    except Exception as e:
        print(f"  ❌ Error processing {imdb_id} for MongoDB: {e}")
        return False

def main():
    print("Step 1: Running IMDb ID search/verification...")
    results = {}
    unmatched = []
    
    # Process IMDb list movies
    for title, imdb_id in imdb_list_movies.items():
        results[imdb_id] = {
            "title": title,
            "source": "IMDb List"
        }
        
    # Process Wikipedia movies
    for title in wiki_movies:
        norm_t = normalize(title)
        already_have = False
        for imdb_id, info in results.items():
            if normalize(info["title"]) == norm_t:
                already_have = True
                break
        if already_have:
            continue
            
        print(f"Searching for '{title}'...")
        imdb_id, match_info = find_best_imdb_match(title)
        if imdb_id:
            results[imdb_id] = {
                "title": title,
                "source": match_info
            }
        else:
            unmatched.append(title)
            
    # Read existing IDs from movies.txt
    movies_txt_path = "movies.txt"
    existing_ids = set()
    if os.path.exists(movies_txt_path):
        with open(movies_txt_path, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("tt"):
                    existing_ids.add(line)
                    
    # Merge and avoid repetitions
    all_final_ids = list(existing_ids)
    for imdb_id in sorted(results.keys()):
        if imdb_id not in existing_ids:
            all_final_ids.append(imdb_id)
            
    sorted_final_ids = sorted(all_final_ids)
    
    with open(movies_txt_path, "w") as f:
        for imdb_id in sorted_final_ids:
            f.write(f"{imdb_id}\n")
            
    print(f"\nSaved {len(sorted_final_ids)} IDs to movies.txt.")
    
    # Save descriptive search log
    with open("movies_search_log.json", "w") as f:
        json.dump({
            "matched": results,
            "unmatched": unmatched,
            "total_ids": len(sorted_final_ids)
        }, f, indent=2)

    # Step 2: Import all IDs from movies.txt into MongoDB
    print("\nStep 2: Syncing all IDs from movies.txt to MongoDB...")
    if db is None:
        print("❌ Cannot connect to MongoDB. Skipping database sync.")
        return
        
    print(f"Found {len(sorted_final_ids)} movie IDs to sync. Starting ingestion...")
    success_count = 0
    for idx, imdb_id in enumerate(sorted_final_ids):
        print(f"[{idx+1}/{len(sorted_final_ids)}] Ingesting {imdb_id}...")
        if import_to_mongodb(imdb_id):
            success_count += 1
            
    print(f"\n✨ MongoDB Sync Finished! Successfully synced: {success_count} / {len(sorted_final_ids)} movies.")

if __name__ == "__main__":
    main()
