#!/usr/bin/env python3
"""
🦸 MCU Watch Order Builder
==========================
Builds watch orders in db.watch_orders:

  1. "Marvel Cinematic Universe (Chronological Order)" — from
     scripts/mcu_watch_order.json (the curated in-universe timeline)
  2. "Marvel Cinematic Universe (Release Order)" — optional, derived from
     scripts/mcu.json sorted by release date (--with-release-order)

Titles/years are resolved from db.movies / db.series when the entry has already
been imported (see bulk_import_imdb_ids.py); otherwise the title from the JSON
is used, so this works even before the bulk import runs.

Expected mcu_watch_order.json format:
{
  "watch_order": [
    { "order": 1, "title": "Eyes of Wakanda", "id": "tt13968252",
      "type": "series", "note": "optional" },
    ...
  ]
}

Usage:
    python3 scripts/seed_mcu_watch_orders.py [path_to_mcu_watch_order.json] [options]

Options:
    --with-release-order   Also build the release-order list from mcu.json
    --release-only         Only build the release-order list
    --catalog PATH         Path to mcu.json (default: scripts/mcu.json)
    --skip-existing        Leave a watch order untouched if it already exists
                           (default is to update it in place, keeping its _id)
    --dry-run              Print the resulting orders without writing to MongoDB
"""

import os
import sys
import json
import re
import argparse
import datetime

from dotenv import load_dotenv
from bson import ObjectId

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from mongo_config import db  # noqa: E402

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CHRONO_ORDER_NAME = "Marvel Cinematic Universe (Chronological Order)"
CHRONO_ORDER_DESC = (
    "Every MCU film and series arranged by in-universe timeline, from ancient "
    "Wakanda through the Multiverse Saga."
)

RELEASE_ORDER_NAME = "Marvel Cinematic Universe (Release Order)"
RELEASE_ORDER_DESC = (
    "Every MCU film and series in the order it was released — the way audiences "
    "experienced the story unfold, reveals and post-credit scenes included."
)


# ------------------------------------------------------------------- resolving

def resolve_from_db(imdb_id, kind, fallback_title):
    """Pull title/year/releaseDate from the DB when the entry has been imported."""
    collection = 'movies' if kind == 'movie' else 'series'
    doc = db[collection].find_one(
        {"imdbId": imdb_id},
        {"title": 1, "year": 1, "releaseDate": 1}
    )
    if not doc:
        return {"title": fallback_title, "year": 0, "releaseDate": None, "inDb": False}

    return {
        "title": doc.get('title') or fallback_title,
        "year": doc.get('year') or 0,
        "releaseDate": doc.get('releaseDate'),
        "inDb": True,
    }


def build_item(imdb_id, kind, resolved, order_index, notes=""):
    return {
        "_id": ObjectId(),
        "type": kind,
        "itemId": imdb_id,
        "title": resolved["title"],
        "year": resolved["year"],
        "notes": notes or "",
        "orderIndex": order_index,
    }


# --------------------------------------------------------------------- builders

def build_chronological_order(order_path, catalog_path):
    """Reads the curated watch order file and turns it into watch_order items."""
    with open(order_path, encoding='utf-8') as f:
        data = json.load(f)

    entries = data.get('watch_order', data) if isinstance(data, dict) else data
    if not entries:
        print(f"❌ No entries found in {order_path}")
        sys.exit(1)

    # mcu.json is the source of truth for which titles exist; used only to warn
    # about drift between the two files.
    catalog_ids = set()
    if os.path.exists(catalog_path):
        with open(catalog_path, encoding='utf-8') as f:
            catalog = json.load(f)
        for key in ('movies', 'series'):
            catalog_ids.update(
                (e.get('id') or e.get('imdbId') or '').strip()
                for e in catalog.get(key, [])
            )
        catalog_ids.discard('')

    entries = sorted(entries, key=lambda e: e.get('order', 0))

    items, seen, not_in_db = [], set(), []
    for entry in entries:
        imdb_id = (entry.get('id') or entry.get('imdbId') or '').strip()
        title = (entry.get('title') or '').strip()
        kind = entry.get('type', 'movie')

        if not imdb_id.startswith('tt'):
            print(f"  ⚠️ '{title or entry}' has no valid IMDb ID — skipped.")
            continue
        if imdb_id in seen:
            print(f"  ⚠️ '{title}' ({imdb_id}) appears more than once — keeping the first.")
            continue
        if kind not in ('movie', 'series'):
            print(f"  ⚠️ '{title}' has unknown type '{kind}' — treating as movie.")
            kind = 'movie'
        seen.add(imdb_id)

        resolved = resolve_from_db(imdb_id, kind, title)
        if not resolved["inDb"]:
            not_in_db.append(title or imdb_id)

        items.append(build_item(imdb_id, kind, resolved, len(items) + 1,
                                entry.get('note') or entry.get('notes') or ""))

    if catalog_ids:
        missing = catalog_ids - seen
        if missing:
            print(f"  ⚠️ {len(missing)} title(s) in mcu.json have no slot in the watch order:")
            for imdb_id in sorted(missing):
                print(f"     - {imdb_id}")
        extra = seen - catalog_ids
        if extra:
            print(f"  ℹ️ {len(extra)} title(s) in the watch order are not in mcu.json: "
                  f"{', '.join(sorted(extra))}")

    if not_in_db:
        print(f"  ℹ️ {len(not_in_db)} title(s) not imported yet — using titles from JSON.")
        print("     Run: python3 scripts/bulk_import_imdb_ids.py scripts/mcu.json")

    return items


def build_release_order(catalog_path):
    """Sorted by release date; undated (unreleased) titles keep mcu.json order at the end."""
    if not os.path.exists(catalog_path):
        print(f"❌ Catalog not found: {catalog_path}")
        sys.exit(1)

    with open(catalog_path, encoding='utf-8') as f:
        catalog = json.load(f)

    rows = []
    for kind, key in (("movie", "movies"), ("series", "series")):
        for index, entry in enumerate(catalog.get(key, [])):
            imdb_id = (entry.get('id') or entry.get('imdbId') or '').strip()
            if not imdb_id.startswith('tt'):
                continue
            resolved = resolve_from_db(imdb_id, kind, (entry.get('title') or '').strip())
            date = resolved["releaseDate"] or (f"{resolved['year']}-12-31" if resolved["year"] else None)
            rows.append((date or "9999-12-31", 0 if kind == 'movie' else 1, index, imdb_id, kind, resolved))

    rows.sort(key=lambda r: r[:3])
    return [
        build_item(imdb_id, kind, resolved, order_index)
        for order_index, (_, _, _, imdb_id, kind, resolved) in enumerate(rows, start=1)
    ]


# ----------------------------------------------------------------------- saving

def slug_for(name, exclude_id=None):
    """Public short-link slug (/w/<slug>). Mirrors routes/watch_orders.py rules."""
    base = re.sub(r'[^a-z0-9]+', '-', (name or '').lower()).strip('-')[:40].strip('-') or "watch-order"
    candidate, suffix = base, 2
    while True:
        query = {"slug": candidate}
        if exclude_id is not None:
            query["_id"] = {"$ne": exclude_id}
        if not db.watch_orders.find_one(query):
            return candidate
        trimmed = base[:40 - len(str(suffix)) - 1].strip('-')
        candidate = f"{trimmed}-{suffix}"
        suffix += 1


def save_order(name, description, items, args):
    existing = db.watch_orders.find_one({"name": name})

    if existing and args.skip_existing:
        print(f"⏭️  '{name}' already exists ({len(existing.get('items', []))} items) — skipping.")
        return

    if args.dry_run:
        verb = "update" if existing else "create"
        print(f"🧪 Dry run — would {verb} '{name}' with {len(items)} items:")
        for item in items:
            note = f"  — {item['notes']}" if item['notes'] else ""
            print(f"   {item['orderIndex']:>3}. [{item['type']:<6}] {item['title']} ({item['year']}){note}")
        return

    now = datetime.datetime.now(datetime.timezone.utc)
    if existing:
        # Keep item _ids stable for titles already in the order, so anything
        # referencing them elsewhere keeps working.
        existing_ids = {
            item.get('itemId'): item.get('_id')
            for item in existing.get('items', []) if item.get('_id')
        }
        for item in items:
            if item['itemId'] in existing_ids:
                item['_id'] = existing_ids[item['itemId']]

        update = {"description": description, "items": items, "updatedAt": now}
        # Never overwrite a slug an admin may have customised.
        if not existing.get("slug"):
            update["slug"] = slug_for(name, exclude_id=existing["_id"])

        db.watch_orders.update_one({"_id": existing["_id"]}, {"$set": update})
        print(f"♻️  Updated '{name}' — {len(items)} items (ID: {existing['_id']}).")
    else:
        result = db.watch_orders.insert_one({
            "name": name,
            "slug": slug_for(name),
            "description": description,
            "items": items,
            "createdAt": now,
            "updatedAt": now,
        })
        print(f"✅ Created '{name}' — {len(items)} items (ID: {result.inserted_id}).")


def main():
    parser = argparse.ArgumentParser(description="Build MCU watch orders in MongoDB.")
    parser.add_argument('order_path', nargs='?',
                        default=os.path.join(SCRIPT_DIR, 'mcu_watch_order.json'))
    parser.add_argument('--catalog', default=os.path.join(SCRIPT_DIR, 'mcu.json'))
    parser.add_argument('--with-release-order', action='store_true')
    parser.add_argument('--release-only', action='store_true')
    parser.add_argument('--skip-existing', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    if db is None:
        print("❌ Cannot connect to MongoDB. Check MONGO_URI in backend/.env")
        sys.exit(1)
    if not args.release_only and not os.path.exists(args.order_path):
        print(f"❌ Watch order file not found: {args.order_path}")
        sys.exit(1)

    if not args.release_only:
        print(f"🕰️  Chronological order — {args.order_path}")
        save_order(CHRONO_ORDER_NAME, CHRONO_ORDER_DESC,
                   build_chronological_order(args.order_path, args.catalog), args)

    if args.with_release_order or args.release_only:
        print(f"\n🎞️  Release order — {args.catalog}")
        save_order(RELEASE_ORDER_NAME, RELEASE_ORDER_DESC,
                   build_release_order(args.catalog), args)

    print("\nDone.")


if __name__ == '__main__':
    main()
