import os
import sys
import argparse
import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

try:
    from mongo_config import db
except Exception as e:
    print(f"❌ Error importing mongo_config: {e}")
    sys.exit(1)

DEFAULT_THEATERS = """PVR Cinemas | Chennai
INOX | Mumbai
Cinepolis | Bangalore
SPI Cinemas | Chennai
AGS Cinemas | Chennai
Rohini Silver Screens | Chennai
Sathyam Cinemas | Chennai"""

def main():
    parser = argparse.ArgumentParser(description="Bulk add theaters from a text file.")
    parser.add_argument("--file", default="theaters.txt", help="Path to theaters text file (default: theaters.txt)")
    args = parser.parse_args()

    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), args.file)

    if not os.path.exists(file_path):
        print(f"⚠️  File '{args.file}' not found. Creating a sample '{args.file}'...")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(DEFAULT_THEATERS + "\n")
        print(f"✅ Created sample '{args.file}'. Review it and run the script again.")
        return

    print(f"📖 Reading theaters from {file_path}...")
    entries = []
    if file_path.lower().endswith(".csv"):
        import csv
        with open(file_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get("Name", row.get("name", "")).strip()
                location = row.get("City", row.get("Location", row.get("city", row.get("location", "")))).strip()
                gmaps_link = row.get("Google Maps Location Link", row.get("gmapsLink", "")).strip()
                if name:
                    entries.append({"name": name, "location": location, "gmapsLink": gmaps_link})
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
        for line in lines:
            if "|" in line:
                parts = [p.strip() for p in line.split("|", 1)]
                name = parts[0]
                location = parts[1]
            else:
                name = line
                location = ""
            if name:
                entries.append({"name": name, "location": location, "gmapsLink": ""})

    print(f"📦 Found {len(entries)} theater entries to process.")

    added_count = 0
    updated_count = 0
    skipped_count = 0

    for idx, entry in enumerate(entries, 1):
        name = entry["name"]
        location = entry["location"]
        gmaps_link = entry.get("gmapsLink", "")

        # Check for duplicates case-insensitively
        existing = db.theaters.find_one({
            "name": {"$regex": f"^{re_escape(name)}$", "$options": "i"},
            "location": {"$regex": f"^{re_escape(location)}$", "$options": "i"}
        })

        if existing:
            if not existing.get("gmapsLink") and gmaps_link:
                try:
                    db.theaters.update_one({"_id": existing["_id"]}, {"$set": {"gmapsLink": gmaps_link}})
                    print(f"[{idx}/{len(entries)}] 🔄 Updated existing theater '{name}' ({location}) with Google Maps link.")
                    updated_count += 1
                except Exception as e:
                    print(f"[{idx}/{len(entries)}] ❌ Error updating '{name}': {e}")
            else:
                print(f"[{idx}/{len(entries)}] ⚠️  Skipped existing theater: '{name}' ({location})")
                skipped_count += 1
            continue

        try:
            db.theaters.insert_one({
                "name": name,
                "location": location,
                "gmapsLink": gmaps_link
            })
            print(f"[{idx}/{len(entries)}] ✅ Added theater: '{name}' ({location})")
            added_count += 1
        except Exception as e:
            print(f"[{idx}/{len(entries)}] ❌ Error adding '{name}': {e}")

    print("\n--- Summary ---")
    print(f"✨ Successfully added: {added_count} theaters.")
    if updated_count > 0:
        print(f"🔄 Successfully updated with Maps link: {updated_count} theaters.")
    print(f"⚠️  Skipped (duplicates): {skipped_count} theaters.")

def re_escape(s):
    import re
    return re.escape(s)

if __name__ == "__main__":
    main()
