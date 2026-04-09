from flask import Blueprint, request, jsonify
from firebase_config import auth as firebase_auth
from mongo_config import db
import datetime
import os
import re
from bson import ObjectId

users_bp = Blueprint('users', __name__)

def get_user_from_token(token):
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

@users_bp.route('/me', methods=['GET'])
def get_my_settings():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    if not decoded_token:
        return jsonify({"error": "Invalid token"}), 401

    firebase_uid = decoded_token['uid']
    user = db.users.find_one({"firebaseUid": firebase_uid})
    
    if not user:
        # Email Validation
        email = decoded_token.get('email', '')
        allowed_domains = os.environ.get('ALLOWED_EMAIL_DOMAINS', '').split(',')
        allowed_domains = [d.strip() for d in allowed_domains if d.strip()]
        
        if allowed_domains:
            domain = email.split('@')[-1]
            if domain not in allowed_domains:
                return jsonify({"error": f"Email domain not allowed. Allowed: {', '.join(allowed_domains)}"}), 403

        # Create initial user record if it doesn't exist
        new_user = {
            "firebaseUid": firebase_uid,
            "email": email,
            "displayName": decoded_token.get('name', 'Anonymous'),
            "photoURL": decoded_token.get('picture'),
            "isPublic": False,
            "isAdmin": False,
            "adminRequestStatus": "NONE", # NONE, PENDING, APPROVED, REJECTED
            "joinedLeaderboard": False,
            "publicFields": ["totalRuntime", "movieCount"],
            "hiddenMovies": [],
            "totalRuntimeSeconds": 0,
            "totalMoviesWatched": 0,
            "watchHistory": []
        }
        db.users.insert_one(new_user)
        user = new_user

    user['_id'] = str(user['_id'])
    
    # Check if admin email (manual override for first user/setup)
    # Admin status is now managed via DB only
    # First admin should be set manually in MongoDB
        
    # Convert datetimes and ObjectIds in watchHistory
    if 'watchHistory' in user:
        for movie in user['watchHistory']:
            # Convert _id if present (added in migration)
            if '_id' in movie and isinstance(movie['_id'], ObjectId):
                movie['_id'] = str(movie['_id'])
            if 'movieId' in movie and isinstance(movie['movieId'], ObjectId):
                movie['movieId'] = str(movie['movieId'])
            if 'createdAt' in movie and isinstance(movie['createdAt'], datetime.datetime):
                movie['createdAt'] = movie['createdAt'].isoformat()
            if 'timestamp' in movie and isinstance(movie['timestamp'], datetime.datetime):
                movie['timestamp'] = movie['timestamp'].isoformat()

    return jsonify(user)

@users_bp.route('/request-admin', methods=['POST'])
def request_admin():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    if not decoded_token:
        return jsonify({"error": "Invalid token"}), 401
        
    firebase_uid = decoded_token['uid']
    
    db.users.update_one(
        {"firebaseUid": firebase_uid},
        {"$set": {"adminRequestStatus": "PENDING"}}
    )
    
    return jsonify({"message": "Admin access requested"})

@users_bp.route('/watch-history', methods=['POST'])
def add_watch_history():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    if not decoded_token:
        return jsonify({"error": "Invalid token"}), 401

    firebase_uid = decoded_token['uid']
    data = request.get_json()
    
    movie_id = data.get('movieId')
    if not movie_id:
        return jsonify({"error": "Movie ID is required"}), 400
        
    # Verify movie exists and get runtime
    try:
        movie = db.movies.find_one({"_id": ObjectId(movie_id)})
        if not movie:
            return jsonify({"error": "Movie not found"}), 404
    except:
        return jsonify({"error": "Invalid movie ID"}), 400

    # Create entry
    entry_id = ObjectId()
    entry = {
        "_id": entry_id,
        "movieId": ObjectId(movie_id),
        "imdbId": movie.get('imdbId'),
        "movieTitle": movie.get('title'),
        "moviePosterUrl": movie.get('posterUrl'),
        "theaterName": data.get('theaterName'),
        "theaterLocation": data.get('location'),
        "ticketCost": data.get('ticketCost'),
        "currency": data.get('currency'),
        "timestamp": data.get('timestamp'), # Expecting ISO string
        "createdAt": datetime.datetime.utcnow().isoformat()
    }
    
    # Calculate runtime in seconds
    runtime_str = movie.get('runtime', '0 min')
    runtime_minutes = 0
    try:
        runtime_minutes = int(runtime_str.split(' ')[0])
    except:
        pass
    runtime_seconds = runtime_minutes * 60

    db.users.update_one(
        {"firebaseUid": firebase_uid},
        {
            "$push": {"watchHistory": entry},
            "$inc": {
                "totalMoviesWatched": 1, 
                "totalRuntimeSeconds": runtime_seconds
            }
        }
    )

    return jsonify({"message": "Watch history added successfully", "id": str(entry_id)})

@users_bp.route('/<user_id>/watch-history/<entry_id>', methods=['DELETE'])
def delete_watch_history(user_id, entry_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    if not decoded_token:
        return jsonify({"error": "Invalid token"}), 401

    current_uid = decoded_token['uid']
    caller = db.users.find_one({"firebaseUid": current_uid})
    is_admin = caller and caller.get('isAdmin')
        
    if current_uid != user_id and not is_admin:
        return jsonify({"error": "Forbidden"}), 403

    target_user = db.users.find_one({"firebaseUid": user_id})
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    watch_history = target_user.get('watchHistory', [])
    entry_to_delete = None
    for entry in watch_history:
        if str(entry.get('_id')) == entry_id:
            entry_to_delete = entry
            break
            
    if not entry_to_delete:
        return jsonify({"error": "Entry not found"}), 404
        
    runtime_seconds = 0
    movie = db.movies.find_one({"_id": entry_to_delete['movieId']})
    if movie:
        runtime_str = movie.get('runtime', '0 min')
        try:
            runtime_minutes = int(runtime_str.split(' ')[0])
            runtime_seconds = runtime_minutes * 60
        except:
            pass

    db.users.update_one(
        {"firebaseUid": user_id},
        {
            "$pull": {"watchHistory": {"_id": entry_to_delete['_id']}},
            "$inc": {
                "totalMoviesWatched": -1,
                "totalRuntimeSeconds": -runtime_seconds
            }
        }
    )
    
    return jsonify({"message": "Entry deleted"})


@users_bp.route('/<user_id>/watch-history/<entry_id>', methods=['PUT'])
def update_watch_history(user_id, entry_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header: return jsonify({"error": "Unauthorized"}), 401
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    if not decoded_token: return jsonify({"error": "Invalid token"}), 401
    
    current_uid = decoded_token['uid']
    caller = db.users.find_one({"firebaseUid": current_uid})
    is_admin = caller and caller.get('isAdmin')
    
    if current_uid != user_id and not is_admin:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    
    updates = {}
    if 'theaterName' in data: updates['watchHistory.$.theaterName'] = data['theaterName']
    if 'theaterLocation' in data: updates['watchHistory.$.theaterLocation'] = data['theaterLocation']
    if 'ticketCost' in data: updates['watchHistory.$.ticketCost'] = data['ticketCost']
    if 'timestamp' in data: updates['watchHistory.$.timestamp'] = data['timestamp']
    if 'currency' in data: updates['watchHistory.$.currency'] = data['currency']
    
    if not updates:
        return jsonify({"message": "No changes"})

    try:
        oid = ObjectId(entry_id)
    except:
        return jsonify({"error": "Invalid ID"}), 400

    result = db.users.update_one(
        {"firebaseUid": user_id, "watchHistory._id": oid},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Entry not found"}), 404
        
    return jsonify({"message": "Updated successfully"})

@users_bp.route('/management-requests', methods=['GET'])
def get_admin_requests():
    # Verify Admin
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    # Getting current user to check admin status
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    if not decoded_token:
        return jsonify({"error": "Invalid token"}), 401
        
    current_user_uid = decoded_token['uid']
    current_user = db.users.find_one({"firebaseUid": current_user_uid})
    
    # Check manual ENV list or DB flag
    is_admin = current_user and current_user.get('isAdmin', False)
    
    if not is_admin:
        return jsonify({"error": "Forbidden"}), 403
        
    requests_cursor = db.users.find({"adminRequestStatus": "PENDING"})
    requests = []
    for req in requests_cursor:
        req['_id'] = str(req['_id'])
        requests.append({
            "id": req['_id'],
            "displayName": req.get('displayName'),
            "email": req.get('email'),
            "photoURL": req.get('photoURL')
        })
        
    return jsonify(requests)

@users_bp.route('/management-requests/<user_id>/resolve', methods=['POST'])
def resolve_admin_request(user_id):
    # Verify Admin
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    current_user_uid = decoded_token['uid']
    current_user = db.users.find_one({"firebaseUid": current_user_uid})
    
    is_admin = current_user and current_user.get('isAdmin', False)
    
    if not is_admin:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    action = data.get('action') # 'APPROVE' or 'REJECT'
    
    if action == 'APPROVE':
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"isAdmin": True, "adminRequestStatus": "APPROVED"}}
        )
    elif action == 'REJECT':
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"isAdmin": False, "adminRequestStatus": "REJECTED"}}
        )
    else:
        return jsonify({"error": "Invalid action"}), 400
        
    return jsonify({"message": f"Request {action}D"})

@users_bp.route('/settings', methods=['POST'])
def update_settings():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    decoded_token = get_user_from_token(token)
    if not decoded_token:
        return jsonify({"error": "Invalid token"}), 401

    firebase_uid = decoded_token['uid']
    data = request.get_json()
    
    update_data = {}
    if 'isPublic' in data:
        update_data['isPublic'] = data['isPublic']
    if 'publicFields' in data:
        update_data['publicFields'] = data['publicFields']
    if 'hiddenMovies' in data:
        update_data['hiddenMovies'] = data['hiddenMovies']
    if 'joinedLeaderboard' in data:
        # Check if user has already joined
        user = db.users.find_one({"firebaseUid": firebase_uid})
        if user and not user.get('joinedLeaderboard'):
            update_data['joinedLeaderboard'] = data['joinedLeaderboard']
    if 'displayName' in data:
        update_data['displayName'] = data['displayName']
    
    if update_data:
        db.users.update_one({"firebaseUid": firebase_uid}, {"$set": update_data})
    
    return jsonify({"message": "Settings updated successfully"})

@users_bp.route('/', methods=['GET'])
def list_all_users():
    auth_header = request.headers.get('Authorization')
    if not auth_header: return jsonify({"error": "Unauthorized"}), 401
    decoded = get_user_from_token(auth_header.split(' ')[1])
    if not decoded: return jsonify({"error": "Invalid token"}), 401
    
    caller = db.users.find_one({"firebaseUid": decoded['uid']})
    if not caller or not caller.get('isAdmin'):
        return jsonify({"error": "Forbidden"}), 403
        
    users = list(db.users.find({}, {"watchHistory": 0}))
    for u in users:
        u['_id'] = str(u['_id'])
        
    return jsonify(users)

@users_bp.route('/<user_id>/ban', methods=['POST'])
def toggle_ban_user(user_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header: return jsonify({"error": "Unauthorized"}), 401
    decoded = get_user_from_token(auth_header.split(' ')[1])
    if not decoded: return jsonify({"error": "Invalid token"}), 401
    
    caller = db.users.find_one({"firebaseUid": decoded['uid']})
    if not caller or not caller.get('isAdmin'):
        return jsonify({"error": "Forbidden"}), 403
        
    target = db.users.find_one({"firebaseUid": user_id})
    if not target: return jsonify({"error": "User not found"}), 404
    
    current_status = target.get('isBannedFromLeaderboard', False)
    new_status = not current_status
    
    db.users.update_one(
        {"firebaseUid": user_id},
        {"$set": {"isBannedFromLeaderboard": new_status, "joinedLeaderboard": False if new_status else target.get('joinedLeaderboard')}}
    )
    
    return jsonify({"message": "User ban status updated", "isBanned": new_status})

@users_bp.route('/<user_id>', methods=['GET'])
def get_public_profile(user_id):
    # Check Admin Override
    is_admin = False
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        decoded = get_user_from_token(token)
        if decoded:
            caller = db.users.find_one({"firebaseUid": decoded['uid']})
            if caller and caller.get('isAdmin'):
                is_admin = True

    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except:
        user = db.users.find_one({"firebaseUid": user_id})

    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.get('isPublic', False) and not is_admin:
        return jsonify({"error": "This profile is private"}), 403

    public_fields = user.get('publicFields', [])
    profile = {
        "firebaseUid": user.get('firebaseUid'), # Return UID for admin actions
        "displayName": user.get('displayName', 'Anonymous'),
        "photoURL": user.get('photoURL'),
        "totalRuntimeSeconds": user.get('totalRuntimeSeconds', 0),
        "totalMoviesWatched": user.get('totalMoviesWatched', 0),
        "joinedLeaderboard": user.get('joinedLeaderboard', False),
        "isBannedFromLeaderboard": user.get('isBannedFromLeaderboard', False)
    }

    # If Admin, show full history. Use ?full=true or default if admin?
    # Logic: If Admin OR Public with moviesList
    
    show_history = is_admin or 'moviesList' in public_fields
    
    if show_history:
        full_history = user.get('watchHistory', [])
        hidden_ids = user.get('hiddenMovies', [])
        
        history_to_return = []
        for m in full_history:
            # Skip hidden if NOT admin
            if not is_admin and str(m.get('imdbId')) in hidden_ids:
                continue

            # Convert ID
            if '_id' in m: m['_id'] = str(m['_id'])
            if 'movieId' in m: m['movieId'] = str(m['movieId'])

            if 'createdAt' in m and isinstance(m['createdAt'], datetime.datetime):
                m['createdAt'] = m['createdAt'].isoformat()
            if 'timestamp' in m and isinstance(m['timestamp'], datetime.datetime):
                m['timestamp'] = m['timestamp'].isoformat()
            history_to_return.append(m)
                
        profile['watchHistory'] = history_to_return
        profile['privateMoviesCount'] = len(full_history) - len(history_to_return) if not is_admin else 0
    else:
        profile['privateMoviesCount'] = user.get('totalMoviesWatched', 0)

    if is_admin:
        profile['email'] = user.get('email') # Show email to admin

    return jsonify(profile)
