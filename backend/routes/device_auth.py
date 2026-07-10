from flask import Blueprint, request, jsonify
from firebase_config import auth as firebase_auth
from mongo_config import db
import secrets
import string
import datetime

device_auth_bp = Blueprint('device_auth', __name__)

def generate_device_code():
    """Generate a user-friendly device code like WXYZ-ABCD"""
    chars = string.ascii_uppercase + string.digits
    # Remove confusing characters
    chars = chars.replace('0', '').replace('O', '').replace('1', '').replace('I')
    code = ''.join(secrets.choice(chars) for _ in range(4))
    code += '-'
    code += ''.join(secrets.choice(chars) for _ in range(4))
    return code

def generate_random_token(length=32):
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)

@device_auth_bp.route('/device/code', methods=['POST'])
def create_device_code():
    """
    Step 1: CLI requests a device code
    Returns: user_code (display to user) and device_code (for polling)
    """
    user_code = generate_device_code()
    device_code = generate_random_token()

    # Store in database with pending status
    db.device_codes.insert_one({
        "userCode": user_code,
        "deviceCode": device_code,
        "status": "pending",  # pending, authorized, expired
        "userId": None,
        "refreshToken": None,
        "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "expiresAt": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    })

    return jsonify({
        "userCode": user_code,
        "deviceCode": device_code,
        "verificationUri": "/device",  # Frontend will show this page
        "expiresIn": 900  # 15 minutes
    })

@device_auth_bp.route('/device/poll', methods=['POST'])
def poll_device_authorization():
    """
    Step 2: CLI polls this endpoint to check if user authorized
    """
    data = request.get_json()
    device_code = data.get('deviceCode')

    if not device_code:
        return jsonify({"error": "Missing deviceCode"}), 400

    # Find device code in database
    device = db.device_codes.find_one({"deviceCode": device_code})

    if not device:
        return jsonify({"error": "Invalid device code"}), 404

    # Check if expired
    if device['expiresAt'] < datetime.datetime.now(datetime.timezone.utc):
        db.device_codes.update_one(
            {"deviceCode": device_code},
            {"$set": {"status": "expired"}}
        )
        return jsonify({"error": "Code expired"}), 400

    # Check status
    if device['status'] == 'pending':
        return jsonify({"status": "pending"}), 200

    if device['status'] == 'authorized':
        # Return the refresh token and user info
        user = db.users.find_one({"firebaseUid": device['userId']})

        # Clean up - delete the device code after successful auth
        db.device_codes.delete_one({"deviceCode": device_code})

        return jsonify({
            "status": "authorized",
            "refreshToken": device['refreshToken'],
            "user": {
                "uid": device['userId'],
                "email": user.get('email') if user else None,
                "displayName": user.get('displayName') if user else None
            }
        }), 200

    return jsonify({"status": "pending"}), 200

@device_auth_bp.route('/device/verify', methods=['POST'])
def verify_device_code():
    """
    Step 3: User submits the code from the web UI (must be logged in)
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401

    token = auth_header.split(' ')[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
    except Exception as e:
        print(f"Error verifying token: {e}")
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()
    user_code = data.get('userCode', '').upper().strip()

    if not user_code:
        return jsonify({"error": "Missing userCode"}), 400

    # Find device code
    device = db.device_codes.find_one({"userCode": user_code})

    if not device:
        return jsonify({"error": "Invalid code"}), 404

    # Check if expired
    if device['expiresAt'] < datetime.datetime.now(datetime.timezone.utc):
        return jsonify({"error": "Code expired"}), 400

    if device['status'] != 'pending':
        return jsonify({"error": "Code already used"}), 400

    # Generate a long-lived refresh token (1 year)
    refresh_token = generate_random_token(48)

    # Store refresh token in database
    db.refresh_tokens.insert_one({
        "token": refresh_token,
        "userId": firebase_uid,
        "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "expiresAt": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365),
        "lastUsed": None
    })

    # Update device code status
    db.device_codes.update_one(
        {"userCode": user_code},
        {"$set": {
            "status": "authorized",
            "userId": firebase_uid,
            "refreshToken": refresh_token,
            "authorizedAt": datetime.datetime.now(datetime.timezone.utc)
        }}
    )

    return jsonify({
        "success": True,
        "message": "Device authorized successfully"
    })

@device_auth_bp.route('/refresh', methods=['POST'])
def refresh_access_token():
    """
    Get a fresh Firebase access token using refresh token
    """
    data = request.get_json()
    refresh_token = data.get('refreshToken')

    if not refresh_token:
        return jsonify({"error": "Missing refreshToken"}), 400

    # Find refresh token in database
    token_doc = db.refresh_tokens.find_one({"token": refresh_token})

    if not token_doc:
        return jsonify({"error": "Invalid refresh token"}), 401

    # Check if expired
    if token_doc['expiresAt'] < datetime.datetime.now(datetime.timezone.utc):
        return jsonify({"error": "Refresh token expired"}), 401

    user_id = token_doc['userId']

    # Generate a custom Firebase token for this user
    try:
        custom_token = firebase_auth.create_custom_token(user_id)

        # Update last used
        db.refresh_tokens.update_one(
            {"token": refresh_token},
            {"$set": {"lastUsed": datetime.datetime.now(datetime.timezone.utc)}}
        )

        # Get user info
        user = db.users.find_one({"firebaseUid": user_id})

        return jsonify({
            "customToken": custom_token.decode('utf-8') if isinstance(custom_token, bytes) else custom_token,
            "expiresIn": 3600,
            "user": {
                "uid": user_id,
                "email": user.get('email') if user else None,
                "displayName": user.get('displayName') if user else None
            }
        })
    except Exception as e:
        print(f"Error creating custom token: {e}")
        return jsonify({"error": "Failed to create access token"}), 500

@device_auth_bp.route('/revoke', methods=['POST'])
def revoke_refresh_token():
    """
    Revoke a refresh token (logout)
    """
    data = request.get_json()
    refresh_token = data.get('refreshToken')

    if not refresh_token:
        return jsonify({"error": "Missing refreshToken"}), 400

    result = db.refresh_tokens.delete_one({"token": refresh_token})

    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Token revoked"})
    else:
        return jsonify({"error": "Token not found"}), 404
