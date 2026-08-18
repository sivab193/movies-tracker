import re
from flask import Blueprint, request, jsonify
from mongo_config import db
from bson import ObjectId
from routes.movies import is_admin

theaters_bp = Blueprint('theaters', __name__)

SCREEN_FORMATS = {'IMAX', 'Dolby Cinema', '4DX', 'ScreenX', 'Laser', 'Standard'}
SOUND_FORMATS = {'Dolby Atmos', 'Dolby 7.1', 'Dolby 5.1', 'Auro 3D', 'Standard'}
SEATING_TYPES = {'Recliner', 'Premium', 'Standard', 'Sofa', 'Wheelchair accessible'}


def normalize_theater_details(data):
    """Validate optional structured details used by public theater pages."""
    details = {}
    for field in ('openedYear', 'renovatedYear'):
        value = data.get(field)
        if value in (None, ''):
            continue
        if not isinstance(value, int) or value < 1800 or value > 2100:
            raise ValueError(f'{field} must be a valid year')
        details[field] = value
    for field in ('notes', 'website'):
        value = data.get(field)
        if value is not None:
            if not isinstance(value, str) or len(value) > 2000:
                raise ValueError(f'{field} is invalid or too long')
            details[field] = value.strip()
    for field in ('amenities',):
        value = data.get(field)
        if value is not None:
            if not isinstance(value, list) or any(not isinstance(item, str) or len(item) > 80 for item in value):
                raise ValueError(f'{field} must be a list of short labels')
            details[field] = list(dict.fromkeys(item.strip() for item in value if item.strip()))
    platforms = data.get('ticketPlatforms')
    if platforms is not None:
        if not isinstance(platforms, list):
            raise ValueError('ticketPlatforms must be a list')
        cleaned = []
        for platform in platforms:
            if not isinstance(platform, dict) or not isinstance(platform.get('name'), str):
                raise ValueError('Each ticket platform needs a name')
            name, url = platform['name'].strip(), str(platform.get('url') or '').strip()
            if not name or len(name) > 80 or len(url) > 2048:
                raise ValueError('Ticket platform details are invalid')
            cleaned.append({'name': name, 'url': url})
        details['ticketPlatforms'] = cleaned
    screens = data.get('screens')
    if screens is not None:
        if not isinstance(screens, list):
            raise ValueError('screens must be a list')
        cleaned = []
        for index, screen in enumerate(screens):
            if not isinstance(screen, dict) or not isinstance(screen.get('name'), str) or not screen['name'].strip():
                raise ValueError('Every screen needs a name')
            capacity = screen.get('capacity')
            if capacity not in (None, '') and (not isinstance(capacity, int) or capacity < 1 or capacity > 5000):
                raise ValueError('Screen capacity must be between 1 and 5000')
            cleaned.append({
                'id': str(screen.get('id') or f'screen-{index + 1}'),
                'name': screen['name'].strip(),
                'format': screen.get('format') if screen.get('format') in SCREEN_FORMATS else 'Standard',
                'sound': screen.get('sound') if screen.get('sound') in SOUND_FORMATS else 'Standard',
                'seating': screen.get('seating') if screen.get('seating') in SEATING_TYPES else 'Standard',
                'capacity': capacity if capacity not in ('', None) else None,
                'screenSize': str(screen.get('screenSize') or '').strip()[:100],
                'notes': str(screen.get('notes') or '').strip()[:500],
                'verified': bool(screen.get('verified', False)),
            })
        details['screens'] = cleaned
    return details

def normalize_theater_location(t):
    loc = (t.get('location') or '').strip()
    name = (t.get('name') or '').strip()
    
    # If location contains comma (e.g., "Bloomington, Indiana" or "Chicago, IL")
    if ',' in loc:
        parts = [p.strip() for p in loc.split(',')]
        if len(parts) > 1 and parts[1].lower() in ['indiana', 'in', 'illinois', 'il', 'usa', 'united states']:
            loc = parts[0]
            
    # If location is literally just "Indiana" or "Illinois" or "IN" / "IL"
    if loc.lower() in ['indiana', 'in']:
        if 'bloomington' in name.lower():
            loc = 'Bloomington'
        elif 'indianapolis' in name.lower() or 'indy' in name.lower():
            loc = 'Indianapolis'
        elif 'lafayette' in name.lower() or 'west lafayette' in name.lower():
            loc = 'West Lafayette'
        elif 'fort wayne' in name.lower():
            loc = 'Fort Wayne'
        elif 'south bend' in name.lower():
            loc = 'South Bend'
        else:
            loc = 'Bloomington' # Default Indiana city
    elif loc.lower() in ['illinois', 'il']:
        if 'chicago' in name.lower():
            loc = 'Chicago'
        elif 'champaign' in name.lower() or 'urbana' in name.lower():
            loc = 'Champaign'
        elif 'peoria' in name.lower():
            loc = 'Peoria'
        elif 'naperville' in name.lower() or 'evanston' in name.lower():
            loc = 'Chicago'
        elif 'springfield' in name.lower():
            loc = 'Springfield'
        else:
            loc = 'Chicago' # Default Illinois city
            
    # If state word appended without comma like "Bloomington Indiana"
    for state_word in [' Indiana', ' Illinois', ' IN', ' IL']:
        if loc.endswith(state_word):
            loc = loc[:-len(state_word)].strip()
            break
            
    if loc != t.get('location'):
        try:
            if '_id' in t and db is not None:
                db.theaters.update_one({"_id": t['_id']}, {"$set": {"location": loc}})
        except Exception:
            pass
        t['location'] = loc
    return t

@theaters_bp.route('/', methods=['GET'])
def list_theaters():
    if db is None:
        return jsonify({"theaters": []})
    try:
        theaters = list(db.theaters.find({}))
        
        # Aggregate visit counts efficiently
        pipeline = [
            {"$unwind": "$watchHistory"},
            {"$match": {"watchHistory.theaterId": {"$ne": None, "$exists": True}}},
            {"$group": {"_id": "$watchHistory.theaterId", "visitCount": {"$sum": 1}}}
        ]
        visit_counts = {str(item['_id']): item['visitCount'] for item in db.users.aggregate(pipeline)}
        
        for t in theaters:
            normalize_theater_location(t)
            t_id = str(t.pop('_id'))
            t['id'] = t_id
            t.setdefault('gmapsLink', '')
            t['verified'] = bool(t.get('verified', False))
            t['visitCount'] = visit_counts.get(t_id, 0)
            t.setdefault('ticketPlatforms', [])
        return jsonify({"theaters": theaters})
    except Exception as e:
        print(f"Error fetching theaters: {e}")
        return jsonify({"error": "Failed to fetch theaters"}), 500

@theaters_bp.route('/', methods=['POST'])
def add_theater():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    data = request.get_json(silent=True) or {}
    name = data.get('name')
    location = data.get('location', '')
    gmaps_link = data.get('gmapsLink', '')

    if not name:
        return jsonify({"error": "Theater name is required"}), 400

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        # Normalize location before inserting
        temp_obj = {"name": name, "location": location}
        normalize_theater_location(temp_obj)
        location = temp_obj['location']

        # Check if theater already exists
        existing = db.theaters.find_one({"name": name, "location": location})
        if existing:
            return jsonify({"error": "Theater already exists"}), 400

        new_theater = {
            "name": name,
            "location": location,
            "gmapsLink": gmaps_link,
            **normalize_theater_details(data),
        }
        result = db.theaters.insert_one(new_theater)
        new_theater['id'] = str(result.inserted_id)
        new_theater.pop('_id', None)
        return jsonify({"message": "Theater added successfully", "theater": new_theater})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@theaters_bp.route('/<theater_id>', methods=['PUT'])
def update_theater(theater_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    if not ObjectId.is_valid(theater_id):
        return jsonify({"error": "Invalid theater ID"}), 400

    data = request.get_json(silent=True) or {}
    name = data.get('name')
    location = data.get('location', '')
    gmaps_link = data.get('gmapsLink', '')

    if not name:
        return jsonify({"error": "Theater name is required"}), 400

    try:
        # Normalize location before updating
        temp_obj = {"name": name, "location": location}
        normalize_theater_location(temp_obj)
        location = temp_obj['location']

        update_data = {
            "name": name,
            "location": location,
            "gmapsLink": gmaps_link,
            **normalize_theater_details(data),
        }
        result = db.theaters.update_one({"_id": ObjectId(theater_id)}, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"error": "Theater not found"}), 404

        updated_theater = db.theaters.find_one({"_id": ObjectId(theater_id)})
        updated_theater = serialize_theater(updated_theater)
        return jsonify({"message": "Theater updated successfully", "theater": updated_theater})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@theaters_bp.route('/<theater_id>', methods=['GET'])
def get_theater(theater_id):
    if db is None:
        return jsonify({'error': 'Database not connected'}), 500
    if not ObjectId.is_valid(theater_id):
        return jsonify({'error': 'Invalid theater ID'}), 400
    theater = db.theaters.find_one({'_id': ObjectId(theater_id)})
    if not theater:
        return jsonify({'error': 'Theater not found'}), 404
    theater = serialize_theater(normalize_theater_location(theater))
    theater['verified'] = bool(theater.get('verified', False))
    theater.setdefault('screens', [])
    theater.setdefault('amenities', [])
    theater.setdefault('ticketPlatforms', [])
    stats = {'watchCount': 0, 'uniqueVisitors': 0, 'topMovie': None}
    movie_counts = {}
    visitors = set()
    for user in db.users.find({'watchHistory.theaterId': theater_id}, {'firebaseUid': 1, 'watchHistory': 1}):
        for entry in user.get('watchHistory', []):
            if str(entry.get('theaterId')) == theater_id:
                stats['watchCount'] += 1
                visitors.add(user.get('firebaseUid'))
                title = entry.get('movieTitle') or 'Untitled'
                movie_counts[title] = movie_counts.get(title, 0) + 1
    stats['uniqueVisitors'] = len(visitors)
    if movie_counts:
        title, count = max(movie_counts.items(), key=lambda item: item[1])
        stats['topMovie'] = {'title': title, 'count': count}
    theater['stats'] = stats
    return jsonify(theater)

@theaters_bp.route('/<theater_id>/verify', methods=['POST'])
def verify_theater(theater_id):
    """Mark a theater as verified (name + maps link confirmed correct) or toggle it off.

    Body may contain {"verified": true|false}. When omitted, the current flag is toggled.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401

    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    if not ObjectId.is_valid(theater_id):
        return jsonify({"error": "Invalid theater ID"}), 400

    try:
        theater = db.theaters.find_one({"_id": ObjectId(theater_id)})
        if not theater:
            return jsonify({"error": "Theater not found"}), 404

        data = request.get_json(silent=True) or {}
        if 'verified' in data:
            new_val = bool(data.get('verified'))
        else:
            new_val = not bool(theater.get('verified', False))

        db.theaters.update_one({"_id": ObjectId(theater_id)}, {"$set": {"verified": new_val}})
        return jsonify({
            "message": "Theater verified" if new_val else "Theater marked unverified",
            "verified": new_val,
            "id": theater_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@theaters_bp.route('/<theater_id>', methods=['DELETE'])
def delete_theater(theater_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        if not ObjectId.is_valid(theater_id):
            return jsonify({"error": "Invalid theater ID"}), 400

        result = db.theaters.delete_one({"_id": ObjectId(theater_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Theater not found"}), 404
        return jsonify({"message": "Theater deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def clean_str(s):
    """Lowercase alphanumerics only. Accepts any type, including None."""
    if s is None:
        return ""
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

def find_theater_duplicate_groups():
    """Group theaters by normalized name + location.

    Returns [(key, kept_doc, [dup_docs...])] for groups with more than one doc.
    The doc with a Google Maps link wins.
    """
    from collections import defaultdict
    groups = defaultdict(list)
    for t in db.theaters.find({}):
        key = f"{clean_str(t.get('name'))}_{clean_str(t.get('location'))}"
        if key == "_":
            # Nothing to match on, so it can never be a duplicate of anything else.
            key = str(t["_id"])
        groups[key].append(t)

    result = []
    for key, docs in groups.items():
        if len(docs) < 2:
            continue
        docs.sort(key=lambda d: len(str(d.get("gmapsLink") or "")), reverse=True)
        result.append((key, docs[0], docs[1:]))
    return result

def serialize_theater(t):
    t = dict(t)
    t['id'] = str(t.pop('_id'))
    t.setdefault('gmapsLink', '')
    return t

@theaters_bp.route('/duplicates', methods=['GET'])
def get_theater_duplicates():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    duplicate_groups = []
    total_duplicates = 0
    for key, kept, dups in find_theater_duplicate_groups():
        total_duplicates += len(dups)
        duplicate_groups.append({
            "key": key,
            "kept": serialize_theater(kept),
            "duplicates": [serialize_theater(d) for d in dups]
        })

    return jsonify({
        "duplicateGroups": duplicate_groups,
        "totalDuplicatesCount": total_duplicates
    })

@theaters_bp.route('/duplicates/merge', methods=['POST'])
def merge_theater_duplicates():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    token = auth_header.split(' ')[1]
    if not is_admin(token):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    total_merged = 0
    users_updated = set()

    for _key, kept, dups in find_theater_duplicate_groups():
        kept_id = str(kept["_id"])

        for dup in dups:
            old_id = str(dup["_id"])
            users_with_ref = db.users.find({
                "$or": [
                    {"watchHistory.theaterId": old_id},
                    {"watchHistory.theaterId": dup["_id"]},
                    {"watchHistory.theaterName": dup.get("name")}
                ]
            })

            for u in users_with_ref:
                wh = u.get("watchHistory", [])
                modified = False
                for entry in wh:
                    entry_theater_id = str(entry.get("theaterId"))
                    if entry_theater_id == kept_id:
                        continue
                    # Older entries were denormalized without a theaterId, so fall
                    # back to matching the name/location the dup was stored under.
                    matches_by_name = (
                        entry.get("theaterName") == dup.get("name")
                        and entry.get("theaterLocation") == dup.get("location")
                    )
                    if entry_theater_id == old_id or matches_by_name:
                        entry["theaterId"] = kept_id
                        entry["theaterName"] = kept.get("name")
                        entry["theaterLocation"] = kept.get("location")
                        if kept.get("gmapsLink"):
                            entry["theaterGmapsLink"] = kept.get("gmapsLink")
                        modified = True
                if modified:
                    db.users.update_one({"_id": u["_id"]}, {"$set": {"watchHistory": wh}})
                    users_updated.add(str(u["_id"]))

            db.theaters.delete_one({"_id": dup["_id"]})
            total_merged += 1

    return jsonify({
        "message": f"Successfully merged {total_merged} duplicate theaters and re-linked {len(users_updated)} watch histories!",
        "mergedCount": total_merged
    })
