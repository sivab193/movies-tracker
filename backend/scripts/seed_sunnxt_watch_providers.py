"""Attach the supplied Sun NXT availability links to matching movie records.

Run from backend/ with MONGO_URI configured:
    python scripts/seed_sunnxt_watch_providers.py
"""
import os
import re
import sys

from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from mongo_config import db  # noqa: E402

SUN_NXT_URLS = {
    "Youth": (2002, "/tamil-movie-youth-2002/detail/8669"), "Puli": (2015, "/tamil-movie-puli-2015/detail/7224"),
    "Nenjinile": (1999, "/tamil-movie-nenjinile-1999/detail/8501"), "Bairavaa": (2017, "/tamil-movie-bairavaa-2017/detail/72177"),
    "Beast": (2022, "/tamil-movie-beast-2022/detail/80589"), "Minsara Kanna": (1999, "/tamil-movie-minsara-kanna-1999/detail/26147"),
    "Friends": (2001, "/tamil-movie-friends-tamil-2001/detail/8580"), "Love Today": (1997, "/tamil-movie-love-today-1997/detail/8448"),
    "Ninaithen Vandhai": (1998, "/tamil-movie-ninaithen-vanthai-1998/detail/8976"), "Poove Unakkaga": (1996, "/tamil-movie-poove-unakkaga-1996/detail/8442"),
    "Thalaivaa": (2013, "/tamil-movie-thalaivaa-2013/detail/7115"), "Thirupaachi": (2005, "/tamil-movie-thirupachi-2005/detail/8814"),
    "Thulladha Manamum Thullum": (1999, "/tamil-movie-thulladha-manamum-thullum-1999/detail/8500"), "Shahjahan": (2001, "/tamil-movie-shajahan-2001/detail/8623"),
    "Sarkar": (2018, "/tamil-movie-sarkar-2018/detail/127018"), "Theri": ((2016, 2017), "/tamil-movie-theri-2017/detail/131380"),
    "Vettaikaaran": (2009, "/tamil-movie-vettaikaaran-2009/detail/8043"), "Kaavalan": (2011, "/tamil-movie-kaavalan-2011/detail/6957"),
    "Jilla": (2014, "/tamil-movie-jilla-2014/detail/7175"), "Ghilli": (2004, "/tamil-movie-ghilli-2004/detail/8778"),
    "Pokkiri": (2007, "/tamil-movie-pokkiri-2007/detail/8941"), "Priyamanavale": (2000, "/tamil-movie-priyamanavale-2000/detail/8546"),
    "Azhagiya Tamil Magan": (2007, "/tamil-movie-azhagiya-tamil-magan-2007/detail/8949"), "Thamizhan": (2002, "/tamil-movie-tamizhan-2002/detail/8661"),
    "Pudhiya Geethai": (2003, "/tamil-movie-pudhiya-geethai-2003/detail/8713"), "Kannukkul Nilavu": (2000, "/tamil-movie-kannukkul-nilavu-2000/detail/8528"),
    "Sura": (2010, "/tamil-movie-sura-2010/detail/8047"), "Badri": (2001, "/tamil-movie-badhri-2001/detail/8594"),
}


def key(value):
    return re.sub(r"[^a-z0-9]", "", value.casefold())


def main():
    if db is None:
        raise SystemExit("MONGO_URI is required to seed watch providers.")

    catalog = {}
    for movie in db.movies.find({}, {"title": 1, "year": 1, "watchProviders": 1}):
        if movie.get("title"):
            catalog.setdefault(key(movie["title"]), []).append(movie)
    updated, missing = 0, []
    for title, (years, path) in SUN_NXT_URLS.items():
        years = years if isinstance(years, tuple) else (years,)
        movie = next((item for item in catalog.get(key(title), []) if item.get("year") in years), None)
        if not movie:
            missing.append(title)
            continue
        provider = {"name": "Sun NXT", "url": f"https://www.sunnxt.com{path}", "regions": ["India"]}
        existing = [item for item in movie.get("watchProviders", []) if item.get("name") != "Sun NXT"]
        db.movies.update_one({"_id": movie["_id"]}, {"$set": {"watchProviders": [*existing, provider]}})
        updated += 1

    print(f"Updated {updated} movies.")
    if missing:
        print("No title match:", ", ".join(missing))


if __name__ == "__main__":
    main()
