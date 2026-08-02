from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from bson.errors import InvalidId
from mongo_config import db
from firebase_config import auth as firebase_auth
from routes.movies import is_admin
import datetime

watch_orders_bp = Blueprint('watch_orders', __name__)

def verify_admin(req):
    """Verifies if the requester is an admin using their Firebase token."""
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return is_admin(token)

@watch_orders_bp.route('/', methods=['GET'])
def list_watch_orders():
    """List all watch orders (public), sorted by name."""
    try:
        orders = list(db.watch_orders.find().sort('name', 1))
        # Convert ObjectId to strings for JSON serialization
        for order in orders:
            order['_id'] = str(order['_id'])
            for item in order.get('items', []):
                if '_id' in item:
                    item['_id'] = str(item['_id'])
        return jsonify(orders), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@watch_orders_bp.route('/<order_id>', methods=['GET'])
def get_watch_order(order_id):
    """Get single watch order details (public)."""
    try:
        order = db.watch_orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            return jsonify({"error": "Watch order not found"}), 404
            
        order['_id'] = str(order['_id'])
        for item in order.get('items', []):
            if '_id' in item:
                item['_id'] = str(item['_id'])
                
        return jsonify(order), 200
    except InvalidId:
        return jsonify({"error": "Invalid watch order ID format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@watch_orders_bp.route('/', methods=['POST'])
def add_watch_order():
    """Admin only: Add new watch order."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized. Admin access required."}), 403

    data = request.json
    if not data or 'name' not in data:
        return jsonify({"error": "Name is required"}), 400

    now = datetime.datetime.now(datetime.timezone.utc)
    items = data.get('items', [])
    
    processed_items = []
    for idx, item in enumerate(items):
        item_id = item.get('_id')
        if not item_id:
            item_id = ObjectId()
        elif isinstance(item_id, str):
            try:
                item_id = ObjectId(item_id)
            except InvalidId:
                item_id = ObjectId()
        
        processed_items.append({
            "_id": item_id,
            "type": item.get("type", "movie"),
            "itemId": item.get("itemId", ""),
            "notes": item.get("notes", ""),
            "orderIndex": item.get("orderIndex", idx + 1)
        })

    new_order = {
        "name": data['name'],
        "description": data.get('description', ''),
        "items": processed_items,
        "createdAt": now,
        "updatedAt": now
    }

    try:
        result = db.watch_orders.insert_one(new_order)
        return jsonify({"message": "Watch order created", "_id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@watch_orders_bp.route('/<order_id>', methods=['PUT'])
def update_watch_order(order_id):
    """Admin only: Update an existing watch order."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized. Admin access required."}), 403

    try:
        oid = ObjectId(order_id)
    except InvalidId:
        return jsonify({"error": "Invalid watch order ID format"}), 400

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    now = datetime.datetime.now(datetime.timezone.utc)
    update_data = {"updatedAt": now}
    
    if 'name' in data:
        update_data['name'] = data['name']
    if 'description' in data:
        update_data['description'] = data['description']
    
    if 'items' in data:
        items = data['items']
        processed_items = []
        for idx, item in enumerate(items):
            item_id = item.get('_id')
            if not item_id:
                item_id = ObjectId()
            elif isinstance(item_id, str):
                try:
                    item_id = ObjectId(item_id)
                except InvalidId:
                    item_id = ObjectId()
            
            processed_items.append({
                "_id": item_id,
                "type": item.get("type", "movie"),
                "itemId": item.get("itemId", ""),
                "notes": item.get("notes", ""),
                "orderIndex": item.get("orderIndex", idx + 1)
            })
        update_data['items'] = processed_items

    try:
        result = db.watch_orders.update_one({"_id": oid}, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"error": "Watch order not found"}), 404
        return jsonify({"message": "Watch order updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@watch_orders_bp.route('/<order_id>', methods=['DELETE'])
def delete_watch_order(order_id):
    """Admin only: Delete watch order."""
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized. Admin access required."}), 403

    try:
        oid = ObjectId(order_id)
    except InvalidId:
        return jsonify({"error": "Invalid watch order ID format"}), 400

    try:
        result = db.watch_orders.delete_one({"_id": oid})
        if result.deleted_count == 0:
            return jsonify({"error": "Watch order not found"}), 404
        return jsonify({"message": "Watch order deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@watch_orders_bp.route('/movie/<imdb_id>', methods=['GET'])
def find_watch_orders_by_movie(imdb_id):
    """Find which watch orders contain a specific movie/series by itemId."""
    try:
        # Match documents where any item in 'items' array has the matching itemId
        orders = list(db.watch_orders.find({"items.itemId": imdb_id}))
        
        for order in orders:
            order['_id'] = str(order['_id'])
            for item in order.get('items', []):
                if '_id' in item:
                    item['_id'] = str(item['_id'])
                    
        return jsonify(orders), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
