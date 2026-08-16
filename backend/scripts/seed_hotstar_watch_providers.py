"""Attach the supplied Disney+ Hotstar availability links to matching movie and series records.

Run from backend/ with MONGO_URI configured:
    python scripts/seed_hotstar_watch_providers.py
"""
import os
import re
import sys
import csv
import io

from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from mongo_config import db  # noqa: E402

DATA = """Title,Type,Link
Eyes of Wakanda,Show,https://www.hotstar.com/in/shows/eyes-of-wakanda/1271341046
Loki,Show,https://www.hotstar.com/in/shows/loki/1260063451
WandaVision,Show,https://www.hotstar.com/in/shows/wandavision/1260051344
Hawkeye,Show,https://www.hotstar.com/in/shows/hawkeye/1260073683
Moon Knight,Show,https://www.hotstar.com/in/shows/moon-knight/1260089681
She-Hulk: Attorney at Law,Show,https://www.hotstar.com/in/shows/she-hulk-attorney-at-law/1260103788
Secret Invasion,Show,https://www.hotstar.com/in/shows/secret-invasion/1260111182
What If...?,Show,https://www.hotstar.com/in/shows/what-if/1260066057
Agatha All Along,Show,https://www.hotstar.com/in/shows/agatha-all-along/1271321224
I Am Groot,Show,https://www.hotstar.com/in/shows/i-am-groot/1260146581
Marvel's Daredevil,Show,https://www.hotstar.com/in/shows/marvels-daredevil/1260091261
Marvel's Jessica Jones,Show,https://www.hotstar.com/in/shows/marvels-jessica-jones/1260089834
Marvel's Luke Cage,Show,https://www.hotstar.com/in/shows/marvels-luke-cage/1260091266
Marvel's Iron Fist,Show,https://www.hotstar.com/in/shows/marvels-iron-fist/1260091270
Marvel's The Defenders,Show,https://www.hotstar.com/in/shows/marvels-the-defenders/1260091248
Marvel's The Punisher,Show,https://www.hotstar.com/in/shows/marvels-the-punisher/1260091274
The Falcon and The Winter Soldier,Show,https://www.hotstar.com/in/shows/the-falcon-and-the-winter-soldier/1260055670
Echo,Show,https://www.hotstar.com/in/shows/echo/1260157856
Ms. Marvel,Show,https://www.hotstar.com/in/shows/ms-marvel/1260098459
Ironheart,Show,https://www.hotstar.com/in/shows/ironheart/1271341039
Daredevil: Born Again,Show,https://www.hotstar.com/in/shows/daredevil-born-again/1271337449
Wonder Man,Show,https://www.hotstar.com/in/shows/wonder-man/1271460125
Iron Man,Movie,https://www.hotstar.com/in/movies/iron-man/1660000038
Iron Man 3,Movie,https://www.hotstar.com/in/movies/iron-man-3/1660000042
Thor,Movie,https://www.hotstar.com/in/movies/thor/1660000044
Thor: The Dark World,Movie,https://www.hotstar.com/in/movies/thor-the-dark-world/1260018142
Thor: Ragnarok,Movie,https://www.hotstar.com/in/movies/thor-ragnarok/1660010577
Thor: Love and Thunder,Movie,https://www.hotstar.com/in/movies/thor-love-and-thunder/1260110008
Captain America: The First Avenger,Movie,https://www.hotstar.com/in/movies/captain-america-the-first-avenger/1660000034
Captain Marvel,Movie,https://www.hotstar.com/in/movies/captain-marvel/1260014878
Marvel's The Avengers,Movie,https://www.hotstar.com/in/movies/marvels-the-avengers/1660000015
Marvel's Avengers: Age Of Ultron,Movie,https://www.hotstar.com/in/movies/marvels-avengers-age-of-ultron/1260018315
Ant-Man and The Wasp: Quantumania,Movie,https://www.hotstar.com/in/movies/ant-man-and-the-wasp-quantumania/1260140795
Black Widow,Movie,https://www.hotstar.com/in/movies/black-widow/1260067485
Black Panther: Wakanda Forever,Movie,https://www.hotstar.com/in/movies/black-panther-wakanda-forever/1260118821
Shang-Chi and The Legend of The Ten Rings,Movie,https://www.hotstar.com/in/movies/shangchi-and-the-legend-of-the-ten-rings/1260072682
Eternals,Movie,https://www.hotstar.com/in/movies/eternals/1260077949
Doctor Strange in the Multiverse of Madness,Movie,https://www.hotstar.com/in/movies/doctor-strange-in-the-multiverse-of-madness/1260103761
Guardians of the Galaxy Vol. 3,Movie,https://www.hotstar.com/in/movies/guardians-of-the-galaxy-vol-3/1260143699
The Marvels,Movie,https://www.hotstar.com/in/movies/the-marvels/1260167860
Iron Man 2,Movie,https://www.hotstar.com/in/movies/iron-man-2/1660000039
Captain America: The Winter Soldier,Movie,https://www.hotstar.com/in/movies/captain-america-the-winter-soldier/1260016410
Captain America: Civil War,Movie,https://www.hotstar.com/in/movies/captain-america-civil-war/1260016768
Guardians Of The Galaxy,Movie,https://www.hotstar.com/in/movies/guardians-of-the-galaxy/1260018294
Guardians Of The Galaxy Vol. 2,Movie,https://www.hotstar.com/in/movies/guardians-of-the-galaxy-vol-2/1260018295
Ant-Man,Movie,https://www.hotstar.com/in/movies/antman/1260018141
Ant-Man And The Wasp,Movie,https://www.hotstar.com/in/movies/ant-man-and-the-wasp/1660010696
Black Panther,Movie,https://www.hotstar.com/in/movies/black-panther/1660010672
Doctor Strange,Movie,https://www.hotstar.com/in/movies/doctor-strange/1260018179
Avengers: Infinity War,Movie,https://www.hotstar.com/in/movies/avengers-infinity-war/1660010677
Avengers: Endgame,Movie,https://www.hotstar.com/in/movies/marvel-studios-avengers-endgame/1260013556
The Guardians of the Galaxy Holiday Special,Movie,https://www.hotstar.com/in/movies/the-guardians-of-the-galaxy-holiday-special/1260111097
Deadpool & Wolverine,Movie,https://www.hotstar.com/in/movies/deadpool-and-wolverine/1271305185
The Punisher: One Last Kill,Movie,https://www.hotstar.com/in/movies/the-punisher-one-last-kill/1271614656
Captain America: Brave New World,Movie,https://www.hotstar.com/in/movies/captain-america-brave-new-world/1271337438
Thunderbolts*,Movie,https://www.hotstar.com/in/movies/thunderbolts/1271337437
The Fantastic Four: First Steps,Movie,https://www.hotstar.com/in/movies/the-fantastic-four-first-steps/1271406275"""

def key(value):
    # Remove prefix "Marvel's " to improve matches
    val = re.sub(r"^marvel's ", "", value.casefold().strip())
    # Remove "marvel studios "
    val = re.sub(r"^marvel studios ", "", val)
    return re.sub(r"[^a-z0-9]", "", val)

def main():
    if db is None:
        raise SystemExit("MONGO_URI is required to seed watch providers.")

    movies_catalog = {}
    for movie in db.movies.find({}, {"title": 1, "watchProviders": 1}):
        if movie.get("title"):
            movies_catalog.setdefault(key(movie["title"]), []).append(movie)
            
    series_catalog = {}
    for series in db.series.find({}, {"title": 1, "watchProviders": 1}):
        if series.get("title"):
            series_catalog.setdefault(key(series["title"]), []).append(series)

    reader = csv.DictReader(io.StringIO(DATA))
    updated_movies, updated_series = 0, 0
    missing = []
    
    PROVIDER_NAME = "Disney+ Hotstar"

    for row in reader:
        title = row['Title'].strip()
        item_type = row['Type'].strip()
        url = row['Link'].strip()
        
        provider = {"name": PROVIDER_NAME, "url": url, "regions": ["India"]}
        title_key = key(title)

        if item_type == "Movie":
            matches = movies_catalog.get(title_key, [])
            if not matches:
                missing.append(f"[Movie] {title}")
                continue
            
            # If multiple matches, just take the first one
            match = matches[0]
            existing = [item for item in match.get("watchProviders", []) if item.get("name") != PROVIDER_NAME]
            db.movies.update_one({"_id": match["_id"]}, {"$set": {"watchProviders": [*existing, provider]}})
            updated_movies += 1
            
        elif item_type == "Show":
            matches = series_catalog.get(title_key, [])
            if not matches:
                missing.append(f"[Show] {title}")
                continue
                
            match = matches[0]
            existing = [item for item in match.get("watchProviders", []) if item.get("name") != PROVIDER_NAME]
            db.series.update_one({"_id": match["_id"]}, {"$set": {"watchProviders": [*existing, provider]}})
            updated_series += 1
            
        else:
            print(f"Unknown type {item_type} for {title}")

    print(f"Updated {updated_movies} movies and {updated_series} series.")
    if missing:
        print("No title match for the following:")
        for m in missing:
            print(f" - {m}")

if __name__ == "__main__":
    main()
