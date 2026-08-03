from flask import Blueprint, request, jsonify
import datetime
import os
from bson import ObjectId
from pymongo import ASCENDING
from mongo_config import db

omdb_keys_bp = Blueprint('omdb_keys', __name__)

def ensure_indexes():
    if db is not None:
        try:
            db.omdb_key_usage.create_index(
                [("keyId", ASCENDING), ("date", ASCENDING)],
                unique=True
            )
        except Exception as e:
            print(f"Index creation error for omdb_key_usage: {e}")

# Attempt to create indexes on load
ensure_indexes()

def get_available_api_key(override_key=None):
    if override_key and isinstance(override_key, str) and override_key.strip():
        return override_key.strip(), None

    if db is not None:
        today = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
        
        # Find active keys sorted by priority
        keys = list(db.omdb_api_keys.find({"active": {"$ne": False}}).sort("priority", ASCENDING))
        
        for k in keys:
            key_id_str = str(k['_id'])
            usage = db.omdb_key_usage.find_one({"keyId": key_id_str, "date": today})
            if not usage or usage.get('requestCount', 0) < 1000:
                return k['key'], key_id_str
            
    fallback = os.environ.get('OMDB_API_KEY')
    if fallback:
        return fallback, None
        
    raise Exception("No available OMDB API keys")

def record_omdb_call(key_id):
    if not key_id or db is None:
        return
        
    today = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
    now = datetime.datetime.now(datetime.timezone.utc)
    
    db.omdb_key_usage.update_one(
        {"keyId": str(key_id), "date": today},
        {
            "$inc": {"requestCount": 1},
            "$set": {"lastUsedAt": now}
        },
        upsert=True
    )

def verify_admin(req):
    from routes.movies import is_admin
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return is_admin(token)

def mask_key(key):
    if not key or len(key) <= 4:
        return "****"
    return f"****{key[-4:]}"

@omdb_keys_bp.route('/', methods=['GET'])
def list_keys():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    today = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
    keys = list(db.omdb_api_keys.find().sort("priority", ASCENDING))
    result = []
    
    for k in keys:
        key_id_str = str(k['_id'])
        usage = db.omdb_key_usage.find_one({"keyId": key_id_str, "date": today})
        today_usage = usage.get('requestCount', 0) if usage else 0
        
        result.append({
            "id": key_id_str,
            "key": mask_key(k.get('key')),
            "email": k.get('email'),
            "label": k.get('label'),
            "active": k.get('active', True),
            "priority": k.get('priority', 0),
            "createdAt": k.get('createdAt', '').isoformat() if hasattr(k.get('createdAt'), 'isoformat') else k.get('createdAt'),
            "todayUsage": today_usage,
            "dailyLimit": 1000
        })
        
    return jsonify(result)

@omdb_keys_bp.route('/', methods=['POST'])
def add_key():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    key = (data.get('key') or '').strip()
    email = (data.get('email') or '').strip()
    label = (data.get('label') or '').strip()
    
    if not key:
        return jsonify({"error": "Key is required"}), 400
        
    if db.omdb_api_keys.find_one({"key": key}):
        return jsonify({"error": "Key already exists"}), 400
        
    max_key = db.omdb_api_keys.find_one(sort=[("priority", -1)])
    priority = (max_key.get('priority', 0) + 1) if max_key else 0
    
    now = datetime.datetime.now(datetime.timezone.utc)
    new_doc = {
        "key": key,
        "email": email,
        "label": label,
        "active": True,
        "priority": priority,
        "createdAt": now,
        "updatedAt": now
    }
    
    res = db.omdb_api_keys.insert_one(new_doc)
    key_id = str(res.inserted_id)
    
    return jsonify({
        "id": key_id,
        "key": mask_key(key),
        "email": email,
        "label": label,
        "active": True,
        "priority": priority,
        "createdAt": now.isoformat(),
        "todayUsage": 0,
        "dailyLimit": 1000
    })

@omdb_keys_bp.route('/<key_id>', methods=['PUT'])
def update_key(key_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    updates = {}
    
    if 'email' in data:
        updates['email'] = data['email']
    if 'label' in data:
        updates['label'] = data['label']
    if 'active' in data:
        updates['active'] = bool(data['active'])
    if 'priority' in data:
        updates['priority'] = int(data['priority'])
        
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400
        
    updates['updatedAt'] = datetime.datetime.now(datetime.timezone.utc)
    
    res = db.omdb_api_keys.update_one(
        {"_id": ObjectId(key_id)},
        {"$set": updates}
    )
    
    if res.matched_count == 0:
        return jsonify({"error": "Key not found"}), 404
        
    return jsonify({"message": "Key updated"})

@omdb_keys_bp.route('/<key_id>', methods=['DELETE'])
def delete_key(key_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    res = db.omdb_api_keys.delete_one({"_id": ObjectId(key_id)})
    if res.deleted_count == 0:
        return jsonify({"error": "Key not found"}), 404
        
    db.omdb_key_usage.delete_many({"keyId": key_id})
    return jsonify({"message": "Key deleted"})

@omdb_keys_bp.route('/usage', methods=['GET'])
def usage_dashboard():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        days = int(request.args.get('days', 7))
    except ValueError:
        days = 7
        
    now = datetime.datetime.now(datetime.timezone.utc)
    today_str = now.strftime('%Y-%m-%d')
    start_date = (now - datetime.timedelta(days=days)).strftime('%Y-%m-%d')
    
    keys = list(db.omdb_api_keys.find())
    key_map = {}
    key_results = []
    active_keys = 0
    exhausted_today = 0
    total_today = 0
    
    for k in keys:
        kid = str(k['_id'])
        key_map[kid] = k
        if k.get('active', True):
            active_keys += 1
        key_results.append({
            "id": kid,
            "label": k.get('label', ''),
            "email": k.get('email', ''),
            "maskedKey": mask_key(k.get('key'))
        })
        
    usage_records = list(db.omdb_key_usage.find({"date": {"$gte": start_date}}))
    usage_results = []
    
    for u in usage_records:
        usage_results.append({
            "keyId": u.get('keyId'),
            "date": u.get('date'),
            "requestCount": u.get('requestCount', 0)
        })
        if u.get('date') == today_str:
            total_today += u.get('requestCount', 0)
            if u.get('requestCount', 0) >= 1000:
                exhausted_today += 1
                
    return jsonify({
        "keys": key_results,
        "usage": usage_results,
        "summary": {
            "totalToday": total_today,
            "totalKeys": len(keys),
            "activeKeys": active_keys,
            "exhaustedToday": exhausted_today
        }
    })

@omdb_keys_bp.route('/reorder', methods=['POST'])
def reorder_keys():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json() or {}
    key_ids = data.get('keyIds', [])
    
    if not isinstance(key_ids, list):
        return jsonify({"error": "keyIds must be a list"}), 400
        
    for index, kid in enumerate(key_ids):
        try:
            db.omdb_api_keys.update_one(
                {"_id": ObjectId(kid)},
                {"$set": {"priority": index, "updatedAt": datetime.datetime.now(datetime.timezone.utc)}}
            )
        except Exception:
            pass
            
    return jsonify({"message": "Keys reordered successfully"})
