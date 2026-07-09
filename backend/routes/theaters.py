from flask import Blueprint, request, jsonify
from mongo_config import db
from bson import ObjectId
from routes.movies import is_admin

theaters_bp = Blueprint('theaters', __name__)

@theaters_bp.route('/', methods=['GET'])
def list_theaters():
    if db is None:
        return jsonify({"theaters": []})
    try:
        theaters = list(db.theaters.find({}))
        for t in theaters:
            t['id'] = str(t.pop('_id'))
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

    if not name:
        return jsonify({"error": "Theater name is required"}), 400

    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        # Check if theater already exists
        existing = db.theaters.find_one({"name": name, "location": location})
        if existing:
            return jsonify({"error": "Theater already exists"}), 400

        new_theater = {
            "name": name,
            "location": location
        }
        result = db.theaters.insert_one(new_theater)
        new_theater['id'] = str(result.inserted_id)
        new_theater.pop('_id', None)
        return jsonify({"message": "Theater added successfully", "theater": new_theater})
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
