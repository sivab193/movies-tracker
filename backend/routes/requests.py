from flask import Blueprint, request, jsonify
import datetime
import re
import requests
from firebase_config import auth as firebase_auth
from mongo_config import db
from bson import ObjectId
from routes.omdb_keys import get_available_api_key, record_omdb_call
from routes.movies import is_admin

requests_bp = Blueprint('requests', __name__)

def extract_imdb_id(link):
    match = re.search(r'tt\d+', link)
    if match:
        return match.group(0)
    return None

def get_omdb_type(imdb_id):
    try:
        api_key, key_id = get_available_api_key()
    except Exception:
        return None

    url = f"https://www.omdbapi.com/?i={imdb_id}&apikey={api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if not data.get('Error'):
            record_omdb_call(key_id)
            return data.get('Type') # 'movie' or 'series'
    return None

@requests_bp.route('/', methods=['POST'])
def submit_request():
    try:
        # Get token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized"}), 401
        
        token = auth_header.split('Bearer ')[1]
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get('uid')
        
        data = request.json
        imdb_link = data.get('imdb_link')
        
        if not imdb_link:
            return jsonify({"error": "IMDB link is required"}), 400
            
        imdb_id = extract_imdb_id(imdb_link)
        if not imdb_id:
            return jsonify({"error": "Invalid IMDB link format"}), 400
            
        # Check if already requested or exists
        if db.requests.find_one({"imdbId": imdb_id, "status": "pending"}):
            return jsonify({"error": "This request is already pending"}), 400
            
        if db.movies.find_one({"imdbId": imdb_id}) or db.series.find_one({"imdbId": imdb_id}):
            return jsonify({"error": "This title is already in the database"}), 400

        # Try to categorize
        item_type = get_omdb_type(imdb_id)
        if not item_type:
            item_type = 'unknown'
            
        new_request = {
            "imdbId": imdb_id,
            "imdbLink": imdb_link,
            "requestedBy": uid,
            "status": "pending", # pending, approved, rejected
            "type": item_type,
            "createdAt": datetime.datetime.utcnow()
        }
        
        result = db.requests.insert_one(new_request)
        return jsonify({
            "message": "Request submitted successfully",
            "id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Error submitting request: {e}")
        return jsonify({"error": str(e)}), 500

@requests_bp.route('/', methods=['GET'])
def get_requests():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized"}), 401
            
        token = auth_header.split('Bearer ')[1]
        if not is_admin(token):
            return jsonify({"error": "Admin access required"}), 403
            
        requests_list = list(db.requests.find({"status": "pending"}).sort("createdAt", -1))
        
        # Hydrate with user details
        for req in requests_list:
            req['_id'] = str(req['_id'])
            user = db.users.find_one({"firebaseUid": req['requestedBy']})
            if user:
                req['requestedByName'] = user.get('name') or user.get('email', 'Unknown User')
            else:
                req['requestedByName'] = 'Unknown User'
                
            # Convert datetime
            if isinstance(req.get('createdAt'), datetime.datetime):
                req['createdAt'] = req['createdAt'].isoformat()
                
        return jsonify(requests_list), 200
        
    except Exception as e:
        print(f"Error fetching requests: {e}")
        return jsonify({"error": str(e)}), 500

@requests_bp.route('/<request_id>', methods=['PATCH'])
def update_request(request_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized"}), 401
            
        token = auth_header.split('Bearer ')[1]
        if not is_admin(token):
            return jsonify({"error": "Admin access required"}), 403
            
        data = request.json
        status = data.get('status')
        if status not in ['approved', 'rejected']:
            return jsonify({"error": "Invalid status"}), 400
            
        result = db.requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": status, "updatedAt": datetime.datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Request not found"}), 404
            
        return jsonify({"message": f"Request {status} successfully"}), 200
        
    except Exception as e:
        print(f"Error updating request: {e}")
        return jsonify({"error": str(e)}), 500
