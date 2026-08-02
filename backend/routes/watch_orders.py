from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from bson.errors import InvalidId
from mongo_config import db
from firebase_config import auth as firebase_auth
from routes.movies import is_admin
import datetime
import re

watch_orders_bp = Blueprint('watch_orders', __name__)

# Slugs are used as public short links (/w/<slug>), so keep them tight and safe.
SLUG_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
SLUG_MAX_LENGTH = 40
RESERVED_SLUGS = {'new', 'edit', 'admin', 'api', 'all', 'null', 'undefined'}

def verify_admin(req):
    """Verifies if the requester is an admin using their Firebase token."""
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return is_admin(token)

def ensure_slug_index():
    """Unique index on slug, sparse so legacy orders without one are unaffected."""
    try:
        db.watch_orders.create_index("slug", unique=True, sparse=True)
    except Exception as e:
        print(f"Index creation error for watch_orders.slug: {e}")

def slugify(value):
    """Turn an arbitrary name into a url-safe slug."""
    value = re.sub(r'[^a-z0-9]+', '-', (value or '').lower()).strip('-')
    return value[:SLUG_MAX_LENGTH].strip('-')

def unique_slug(base, exclude_id=None):
    """Return `base` (or base-2, base-3, ...) so it is unused by any other order."""
    base = slugify(base) or 'watch-order'
    if base in RESERVED_SLUGS:
        base = f"{base}-order"
    candidate = base
    suffix = 2
    while True:
        query = {"slug": candidate}
        if exclude_id is not None:
            query["_id"] = {"$ne": exclude_id}
        if not db.watch_orders.find_one(query):
            return candidate
        trimmed = base[:SLUG_MAX_LENGTH - len(str(suffix)) - 1].strip('-')
        candidate = f"{trimmed}-{suffix}"
        suffix += 1

def validate_slug(value, exclude_id=None):
    """Validate an admin-supplied slug. Returns (slug, error_message)."""
    slug = (value or '').strip().lower()
    if not slug:
        return None, "Slug cannot be empty"
    if len(slug) > SLUG_MAX_LENGTH:
        return None, f"Slug must be {SLUG_MAX_LENGTH} characters or fewer"
    if not SLUG_PATTERN.match(slug):
        return None, "Slug may only contain lowercase letters, numbers and single dashes"
    if slug in RESERVED_SLUGS:
        return None, "That slug is reserved"
    query = {"slug": slug}
    if exclude_id is not None:
        query["_id"] = {"$ne": exclude_id}
    if db.watch_orders.find_one(query):
        return None, "That slug is already in use"
    return slug, None

def serialize_order(order, backfill_slug=True):
    """Stringify ids and make sure the order has a slug (lazily backfilled)."""
    if backfill_slug and not order.get('slug'):
        slug = unique_slug(order.get('name', ''), exclude_id=order['_id'])
        try:
            db.watch_orders.update_one({"_id": order['_id']}, {"$set": {"slug": slug}})
        except Exception:
            pass
        order['slug'] = slug
    order['_id'] = str(order['_id'])
    for item in order.get('items', []):
        if '_id' in item:
            item['_id'] = str(item['_id'])
    return order

@watch_orders_bp.route('/', methods=['GET'])
def list_watch_orders():
    """List all watch orders (public), sorted by name."""
    try:
        orders = list(db.watch_orders.find().sort('name', 1))
        return jsonify([serialize_order(order) for order in orders]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@watch_orders_bp.route('/<order_id>', methods=['GET'])
def get_watch_order(order_id):
    """Get single watch order details (public)."""
    try:
        order = db.watch_orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            return jsonify({"error": "Watch order not found"}), 404
        return jsonify(serialize_order(order)), 200
    except InvalidId:
        return jsonify({"error": "Invalid watch order ID format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@watch_orders_bp.route('/slug/<slug>', methods=['GET'])
def get_watch_order_by_slug(slug):
    """Resolve a public short link (/w/<slug>) to a watch order. Falls back to id."""
    try:
        order = db.watch_orders.find_one({"slug": (slug or '').strip().lower()})
        if not order:
            # Allow the canonical ObjectId to work on the same route.
            try:
                order = db.watch_orders.find_one({"_id": ObjectId(slug)})
            except InvalidId:
                order = None
        if not order:
            return jsonify({"error": "Watch order not found"}), 404
        return jsonify(serialize_order(order)), 200
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

    ensure_slug_index()
    if data.get('slug'):
        slug, error = validate_slug(data['slug'])
        if error:
            return jsonify({"error": error}), 400
    else:
        slug = unique_slug(data['name'])

    new_order = {
        "name": data['name'],
        "slug": slug,
        "description": data.get('description', ''),
        "items": processed_items,
        "createdAt": now,
        "updatedAt": now
    }

    try:
        result = db.watch_orders.insert_one(new_order)
        return jsonify({"message": "Watch order created", "_id": str(result.inserted_id), "slug": slug}), 201
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
    if 'slug' in data:
        ensure_slug_index()
        slug, error = validate_slug(data['slug'], exclude_id=oid)
        if error:
            return jsonify({"error": error}), 400
        update_data['slug'] = slug

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
        updated = db.watch_orders.find_one({"_id": oid})
        return jsonify(serialize_order(updated)), 200
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
        return jsonify([serialize_order(order) for order in orders]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
