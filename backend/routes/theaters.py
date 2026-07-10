from flask import Blueprint, request, jsonify
from mongo_config import db
from bson import ObjectId
from routes.movies import is_admin

theaters_bp = Blueprint('theaters', __name__)

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
        for t in theaters:
            normalize_theater_location(t)
            t['id'] = str(t.pop('_id'))
            t.setdefault('gmapsLink', '')
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

    data = request.get_json()
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
            "gmapsLink": gmaps_link
        }
        result = db.theaters.insert_one(new_theater)
        new_theater['id'] = str(result.inserted_id)
        new_theater.pop('_id', None)
        return jsonify({"message": "Theater added successfully", "theater": new_theater})
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

    data = request.get_json()
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
            "gmapsLink": gmaps_link
        }
        result = db.theaters.update_one({"_id": ObjectId(theater_id)}, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"error": "Theater not found"}), 404

        updated_theater = {
            "id": theater_id,
            "name": name,
            "location": location,
            "gmapsLink": gmaps_link
        }
        return jsonify({"message": "Theater updated successfully", "theater": updated_theater})
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
