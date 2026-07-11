import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
OMDB_API_KEY = os.environ.get('OMDB_API_KEY')

def check_omdb():
    url = f"https://www.omdbapi.com/?i=tt33379543&apikey={OMDB_API_KEY}"
    res = requests.get(url).json()
    print("OMDb data for tt33379543:")
    for k, v in res.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    check_omdb()
