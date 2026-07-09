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
    with open(file_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]

    print(f"📦 Found {len(lines)} theater entries to process.")

    added_count = 0
    skipped_count = 0

    for idx, line in enumerate(lines, 1):
        if "|" in line:
            parts = [p.strip() for p in line.split("|", 1)]
            name = parts[0]
            location = parts[1]
        else:
            name = line
            location = ""

        if not name:
            continue

        # Check for duplicates case-insensitively
        existing = db.theaters.find_one({
            "name": {"$regex": f"^{re_escape(name)}$", "$options": "i"},
            "location": {"$regex": f"^{re_escape(location)}$", "$options": "i"}
        })

        if existing:
            print(f"[{idx}/{len(lines)}] ⚠️  Skipped existing theater: '{name}' ({location})")
            skipped_count += 1
            continue

        try:
            db.theaters.insert_one({
                "name": name,
                "location": location
            })
            print(f"[{idx}/{len(lines)}] ✅ Added theater: '{name}' ({location})")
            added_count += 1
        except Exception as e:
            print(f"[{idx}/{len(lines)}] ❌ Error adding '{name}': {e}")

    print("\n--- Summary ---")
    print(f"✨ Successfully added: {added_count} theaters.")
    print(f"⚠️  Skipped (duplicates): {skipped_count} theaters.")

def re_escape(s):
    import re
    return re.escape(s)

if __name__ == "__main__":
    main()
