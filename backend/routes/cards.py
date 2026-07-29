from flask import Blueprint, request, jsonify
from bson import ObjectId
import datetime
from firebase_config import auth as firebase_auth
from mongo_config import db
from routes.movies import is_admin

cards_bp = Blueprint('cards', __name__)

def get_uid_from_token(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token['uid']
    except:
        return None

def verify_admin(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return is_admin(token)

@cards_bp.route('/', methods=['GET'])
def list_cards():
    cards = list(db.cards.find())
    for c in cards:
        c['_id'] = str(c['_id'])
        if 'offers' in c:
            for o in c['offers']:
                if '_id' in o:
                    o['_id'] = str(o['_id'])
    return jsonify(cards), 200

@cards_bp.route('/<card_id>', methods=['GET'])
def get_card(card_id):
    try:
        card = db.cards.find_one({"_id": ObjectId(card_id)})
        if not card:
            return jsonify({"error": "Card not found"}), 404
        card['_id'] = str(card['_id'])
        if 'offers' in card:
            for o in card['offers']:
                if '_id' in o:
                    o['_id'] = str(o['_id'])
        return jsonify(card), 200
    except Exception as e:
        return jsonify({"error": "Invalid card ID"}), 400

@cards_bp.route('/', methods=['POST'])
def add_card():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    now = datetime.datetime.now(datetime.timezone.utc)
    
    offers = data.get('offers', [])
    for o in offers:
        if '_id' not in o:
            o['_id'] = ObjectId()
        else:
            try:
                o['_id'] = ObjectId(o['_id'])
            except:
                o['_id'] = ObjectId()

    new_card = {
        "name": data.get('name'),
        "bank": data.get('bank'),
        "type": data.get('type'),
        "network": data.get('network'),
        "offers": offers,
        "reportCount": 0,
        "lastVerifiedAt": now,
        "createdAt": now,
        "updatedAt": now
    }
    
    result = db.cards.insert_one(new_card)
    return jsonify({"message": "Card created", "id": str(result.inserted_id)}), 201

@cards_bp.route('/<card_id>', methods=['PUT'])
def update_card(card_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.json
    now = datetime.datetime.now(datetime.timezone.utc)
    
    try:
        oid = ObjectId(card_id)
    except:
        return jsonify({"error": "Invalid card ID"}), 400
        
    update_data = {
        "name": data.get('name'),
        "bank": data.get('bank'),
        "type": data.get('type'),
        "network": data.get('network'),
        "updatedAt": now
    }
    
    if 'offers' in data:
        offers = data['offers']
        for o in offers:
            if '_id' not in o or not o['_id']:
                o['_id'] = ObjectId()
            elif isinstance(o['_id'], str):
                o['_id'] = ObjectId(o['_id'])
        update_data['offers'] = offers
        
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = db.cards.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        return jsonify({"error": "Card not found"}), 404
        
    return jsonify({"message": "Card updated"}), 200

@cards_bp.route('/<card_id>', methods=['DELETE'])
def delete_card(card_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        oid = ObjectId(card_id)
    except:
        return jsonify({"error": "Invalid card ID"}), 400
        
    result = db.cards.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Card not found"}), 404
        
    return jsonify({"message": "Card deleted"}), 200

@cards_bp.route('/<card_id>/report', methods=['POST'])
def report_card(card_id):
    uid = get_uid_from_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        oid = ObjectId(card_id)
    except:
        return jsonify({"error": "Invalid card ID"}), 400
        
    card = db.cards.find_one({"_id": oid})
    if not card:
        return jsonify({"error": "Card not found"}), 404
        
    data = request.json
    now = datetime.datetime.now(datetime.timezone.utc)
    
    report = {
        "cardId": oid,
        "userId": uid,
        "reason": data.get('reason'),
        "status": "pending",
        "adminNote": None,
        "createdAt": now,
        "resolvedAt": None
    }
    
    db.card_reports.insert_one(report)
    db.cards.update_one({"_id": oid}, {"$inc": {"reportCount": 1}})
    
    return jsonify({"message": "Report submitted"}), 201

@cards_bp.route('/reports', methods=['GET'])
def get_reports():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
        
    reports = list(db.card_reports.aggregate([
        {"$match": {"status": "pending"}},
        {"$lookup": {
            "from": "cards",
            "localField": "cardId",
            "foreignField": "_id",
            "as": "card"
        }},
        {"$unwind": "$card"}
    ]))
    
    for r in reports:
        r['_id'] = str(r['_id'])
        r['cardId'] = str(r['cardId'])
        r['card']['_id'] = str(r['card']['_id'])
        if 'offers' in r['card']:
            for o in r['card']['offers']:
                if '_id' in o:
                    o['_id'] = str(o['_id'])
                    
    return jsonify(reports), 200

@cards_bp.route('/reports/<report_id>', methods=['PUT'])
def resolve_report(report_id):
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        oid = ObjectId(report_id)
    except:
        return jsonify({"error": "Invalid report ID"}), 400
        
    data = request.json
    status = data.get('status')
    if status not in ['resolved', 'dismissed']:
        return jsonify({"error": "Invalid status"}), 400
        
    now = datetime.datetime.now(datetime.timezone.utc)
    
    report = db.card_reports.find_one({"_id": oid})
    if not report:
        return jsonify({"error": "Report not found"}), 404
        
    db.card_reports.update_one(
        {"_id": oid},
        {"$set": {
            "status": status,
            "adminNote": data.get('adminNote'),
            "resolvedAt": now
        }}
    )
    
    if status == 'resolved':
        db.cards.update_one(
            {"_id": report['cardId']},
            {"$set": {
                "reportCount": 0,
                "lastVerifiedAt": now
            }}
        )
        
    return jsonify({"message": f"Report {status}"}), 200

@cards_bp.route('/user/cards', methods=['POST'])
def add_user_card():
    uid = get_uid_from_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    try:
        card_id = ObjectId(data.get('cardId'))
    except:
        return jsonify({"error": "Invalid card ID"}), 400
        
    now = datetime.datetime.now(datetime.timezone.utc)
    
    user = db.users.find_one({"firebaseUid": uid})
    if not user:
        db.users.insert_one({"firebaseUid": uid, "myCards": []})
        
    existing = db.users.find_one({
        "firebaseUid": uid,
        "myCards.cardId": card_id
    })
    
    if existing:
        return jsonify({"error": "Card already added"}), 400
        
    new_user_card = {
        "cardId": card_id,
        "addedAt": now,
        "usageLog": []
    }
    
    db.users.update_one(
        {"firebaseUid": uid},
        {"$push": {"myCards": new_user_card}}
    )
    
    return jsonify({"message": "Card added to user"}), 201

@cards_bp.route('/user/cards/<card_id>', methods=['DELETE'])
def remove_user_card(card_id):
    uid = get_uid_from_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        oid = ObjectId(card_id)
    except:
        return jsonify({"error": "Invalid card ID"}), 400
        
    result = db.users.update_one(
        {"firebaseUid": uid},
        {"$pull": {"myCards": {"cardId": oid}}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Card not found in user's list"}), 404
        
    return jsonify({"message": "Card removed"}), 200

@cards_bp.route('/user/cards/<card_id>/usage', methods=['POST'])
def log_usage(card_id):
    uid = get_uid_from_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        cid = ObjectId(card_id)
    except:
        return jsonify({"error": "Invalid card ID"}), 400
        
    data = request.json
    now = datetime.datetime.now(datetime.timezone.utc)
    
    try:
        offer_id = ObjectId(data.get('offerId'))
    except:
        return jsonify({"error": "Invalid offer ID"}), 400
        
    usage_date_str = data.get('date')
    if usage_date_str:
        try:
            usage_date = datetime.datetime.fromisoformat(usage_date_str.replace('Z', '+00:00'))
        except:
            usage_date = now
    else:
        usage_date = now
        
    usage_entry = {
        "_id": ObjectId(),
        "date": usage_date,
        "platform": data.get('platform'),
        "offerId": offer_id,
        "movieTitle": data.get('movieTitle'),
        "ticketsSaved": data.get('ticketsSaved', 1),
        "notes": data.get('notes', ""),
        "createdAt": now
    }
    
    result = db.users.update_one(
        {"firebaseUid": uid, "myCards.cardId": cid},
        {"$push": {"myCards.$.usageLog": usage_entry}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Card not found in user's list"}), 404
        
    return jsonify({"message": "Usage logged", "usageId": str(usage_entry["_id"])}), 201

@cards_bp.route('/user/cards/<card_id>/usage/<usage_id>', methods=['DELETE'])
def remove_usage(card_id, usage_id):
    uid = get_uid_from_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        cid = ObjectId(card_id)
        uid_obj = ObjectId(usage_id)
    except:
        return jsonify({"error": "Invalid ID"}), 400
        
    result = db.users.update_one(
        {"firebaseUid": uid, "myCards.cardId": cid},
        {"$pull": {"myCards.$.usageLog": {"_id": uid_obj}}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Usage log not found"}), 404
        
    return jsonify({"message": "Usage removed"}), 200

@cards_bp.route('/user/cards', methods=['GET'])
def get_user_cards():
    uid = get_uid_from_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
        
    user = db.users.find_one({"firebaseUid": uid})
    if not user or 'myCards' not in user:
        return jsonify([]), 200
        
    my_cards = user.get('myCards', [])
    
    card_ids = [c['cardId'] for c in my_cards]
    cards = list(db.cards.find({"_id": {"$in": card_ids}}))
    card_map = {str(c['_id']): c for c in cards}
    
    now = datetime.datetime.now(datetime.timezone.utc)
    current_month = now.month
    current_year = now.year
    
    response_data = []
    
    for uc in my_cards:
        cid_str = str(uc['cardId'])
        if cid_str not in card_map:
            continue
            
        card_details = card_map[cid_str].copy()
        card_details['_id'] = str(card_details['_id'])
        
        usage_log = uc.get('usageLog', [])
        
        usages_this_month = {}
        for ul in usage_log:
            d = ul.get('date')
            if isinstance(d, datetime.datetime) and d.month == current_month and d.year == current_year:
                oid_str = str(ul.get('offerId'))
                usages_this_month[oid_str] = usages_this_month.get(oid_str, 0) + 1
                
            ul['_id'] = str(ul['_id'])
            if 'offerId' in ul:
                ul['offerId'] = str(ul['offerId'])
                
        if 'offers' in card_details:
            for o in card_details['offers']:
                if '_id' in o:
                    oid_str = str(o['_id'])
                    o['_id'] = oid_str
                    max_uses = o.get('usesPerMonth', 0)
                    used = usages_this_month.get(oid_str, 0)
                    o['remainingUses'] = max(0, max_uses - used)
                    
        response_data.append({
            "cardId": cid_str,
            "addedAt": uc.get('addedAt'),
            "usageLog": usage_log,
            "cardDetails": card_details
        })
        
    return jsonify(response_data), 200
