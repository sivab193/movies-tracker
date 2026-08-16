from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from bson import Binary
from bson.errors import InvalidId
from mongo_config import db
from firebase_config import auth as firebase_auth
from routes.movies import is_admin
import datetime
import re
import base64
import random

watch_orders_bp = Blueprint('watch_orders', __name__)

# Slugs are used as public short links (/w/<slug>), so keep them tight and safe.
SLUG_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
SLUG_MAX_LENGTH = 40
RESERVED_SLUGS = {'new', 'edit', 'admin', 'api', 'all', 'null', 'undefined'}
MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_COVER_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}

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


def _runtime_minutes(movie):
    seconds = movie.get('averageTimeSeconds')
    if isinstance(seconds, (int, float)) and not isinstance(seconds, bool):
        return max(0, round(seconds / 60))
    match = re.search(r'\d+', str(movie.get('runtime') or ''))
    return int(match.group()) if match else 0


def _catalog_by_imdb(items):
    """Fetch all movie and series references for an order in at most two queries."""
    movie_ids = list(dict.fromkeys(
        item.get('itemId') for item in items
        if item.get('type', 'movie').lower() == 'movie' and item.get('itemId')
    ))
    series_ids = list(dict.fromkeys(
        item.get('itemId') for item in items
        if item.get('type', 'movie').lower() == 'series' and item.get('itemId')
    ))
    movies = {
        doc['imdbId']: doc for doc in db.movies.find(
            {'imdbId': {'$in': movie_ids}},
            {'imdbId': 1, 'title': 1, 'year': 1, 'posterUrl': 1, 'runtime': 1,
             'imdbRating': 1, 'averageTimeSeconds': 1, 'language': 1, 'Language': 1},
        )
    } if movie_ids else {}
    series = {
        doc['imdbId']: doc for doc in db.series.find(
            {'imdbId': {'$in': series_ids}},
            {'imdbId': 1, 'title': 1, 'year': 1, 'endYear': 1, 'posterUrl': 1,
             'totalSeasons': 1, 'totalEpisodes': 1, 'totalRuntimeMinutes': 1,
             'imdbRating': 1, 'isOngoing': 1},
        )
    } if series_ids else {}
    return movies, series


def _order_summary_and_posters(items, selected_item_ids=None):
    """Build persistent card metadata without making one lookup per item."""
    movies, series = _catalog_by_imdb(items)
    movie_count = sum(item.get('type', 'movie').lower() == 'movie' for item in items)
    series_count = len(items) - movie_count
    total_runtime = 0
    for item in items:
        doc = movies.get(item.get('itemId')) if item.get('type', 'movie').lower() == 'movie' else series.get(item.get('itemId'))
        if not doc:
            continue
        total_runtime += _runtime_minutes(doc) if item.get('type', 'movie').lower() == 'movie' else max(0, int(doc.get('totalRuntimeMinutes') or 0))

    poster_by_item = {}
    for item in items:
        item_id = item.get('itemId')
        doc = movies.get(item_id) if item.get('type', 'movie').lower() == 'movie' else series.get(item_id)
        if doc and doc.get('posterUrl'):
            poster_by_item[item_id] = doc['posterUrl']

    selected_item_ids = [item_id for item_id in (selected_item_ids or []) if item_id in poster_by_item][:5]
    if selected_item_ids:
        poster_urls = [poster_by_item[item_id] for item_id in selected_item_ids]
    else:
        candidates = list(dict.fromkeys(poster_by_item.values()))
        poster_urls = random.sample(candidates, min(5, len(candidates)))

    return {
        'summary': {
            'movieCount': movie_count,
            'seriesCount': series_count,
            'totalRuntimeMinutes': total_runtime,
        },
        'posterUrls': poster_urls,
        'posterItemIds': selected_item_ids,
    }


def _save_cover_image(order_id, data_url):
    if not isinstance(data_url, str) or not data_url.startswith('data:'):
        raise ValueError('Cover image must be a data URL')
    try:
        header, encoded = data_url.split(',', 1)
        mime_type = header.split(';', 1)[0].split(':', 1)[1].lower()
        if mime_type not in ALLOWED_COVER_IMAGE_TYPES:
            raise ValueError('Cover image must be JPEG, PNG, or WebP')
        if len(encoded) > (MAX_COVER_IMAGE_BYTES * 4 // 3) + 4:
            raise ValueError('Cover image exceeds the 5 MB limit')
        image = base64.b64decode(encoded, validate=True)
        if not image or len(image) > MAX_COVER_IMAGE_BYTES:
            raise ValueError('Cover image exceeds the 5 MB limit')
    except (ValueError, IndexError) as error:
        raise ValueError(str(error) or 'Invalid cover image')

    db.watch_order_posters.update_one(
        {'watchOrderId': str(order_id)},
        {'$set': {'imageData': Binary(image), 'mimeType': mime_type}},
        upsert=True,
    )
    return f'/api/watch-orders/{order_id}/poster'


def _enriched_items(order):
    movies, series = _catalog_by_imdb(order.get('items', []))
    enriched = []
    for item in order.get('items', []):
        item = dict(item)
        doc = movies.get(item.get('itemId')) if item.get('type', 'movie').lower() == 'movie' else series.get(item.get('itemId'))
        if doc:
            for key in ('title', 'year', 'posterUrl', 'runtime', 'imdbRating', 'endYear',
                        'totalSeasons', 'totalEpisodes', 'totalRuntimeMinutes', 'isOngoing'):
                if key in doc:
                    item[key] = doc[key]
        if '_id' in item:
            item['_id'] = str(item['_id'])
        enriched.append(item)
    return enriched

def serialize_order(order, backfill_slug=True):
    """Stringify ids and make sure public card metadata is available."""
    if backfill_slug and not order.get('slug'):
        slug = unique_slug(order.get('name', ''), exclude_id=order['_id'])
        try:
            db.watch_orders.update_one({"_id": order['_id']}, {"$set": {"slug": slug}})
        except Exception:
            pass
        order['slug'] = slug
    if not order.get('summary') or 'posterUrls' not in order:
        try:
            meta = _order_summary_and_posters(order.get('items', []), order.get('posterItemIds'))
            db.watch_orders.update_one({'_id': order['_id']}, {'$set': meta})
            order.update(meta)
        except Exception:
            # A list page remains available even if an old order cannot be
            # backfilled (for example, while the database is unavailable).
            order.setdefault('summary', {})
            order.setdefault('posterUrls', [])
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


@watch_orders_bp.route('/slug/<slug>/items', methods=['GET'])
def get_watch_order_items_by_slug(slug):
    """Bulk-resolve one selected order; no client-side per-item lookup loop."""
    try:
        order = db.watch_orders.find_one({'slug': (slug or '').strip().lower()})
        if not order:
            try:
                order = db.watch_orders.find_one({'_id': ObjectId(slug)})
            except InvalidId:
                order = None
        if not order:
            return jsonify({'error': 'Watch order not found'}), 404
        return jsonify({'items': _enriched_items(order)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@watch_orders_bp.route('/<order_id>/items', methods=['GET'])
def get_watch_order_items(order_id):
    try:
        order = db.watch_orders.find_one({'_id': ObjectId(order_id)})
        if not order:
            return jsonify({'error': 'Watch order not found'}), 404
        return jsonify({'items': _enriched_items(order)}), 200
    except InvalidId:
        return jsonify({'error': 'Invalid watch order ID format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@watch_orders_bp.route('/<order_id>/poster', methods=['GET'])
def get_watch_order_poster(order_id):
    try:
        poster = db.watch_order_posters.find_one({'watchOrderId': order_id})
        if not poster:
            return jsonify({'error': 'Poster not found'}), 404
        from flask import Response
        return Response(bytes(poster['imageData']), mimetype=poster.get('mimeType', 'image/jpeg'))
    except Exception:
        return jsonify({'error': 'Failed to fetch poster'}), 500

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

    try:
        meta = _order_summary_and_posters(processed_items, data.get('posterItemIds'))
    except Exception as e:
        return jsonify({'error': f'Could not build watch order summary: {e}'}), 500

    new_order = {
        "name": data['name'],
        "slug": slug,
        "description": data.get('description', ''),
        "items": processed_items,
        **meta,
        "createdAt": now,
        "updatedAt": now
    }

    try:
        result = db.watch_orders.insert_one(new_order)
        if data.get('coverImage'):
            cover_url = _save_cover_image(result.inserted_id, data['coverImage'])
            db.watch_orders.update_one({'_id': result.inserted_id}, {'$set': {'coverPosterUrl': cover_url}})
        return jsonify({"message": "Watch order created", "_id": str(result.inserted_id), "slug": slug}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
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

    existing = db.watch_orders.find_one({'_id': oid})
    if not existing:
        return jsonify({"error": "Watch order not found"}), 404

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

    items_for_meta = update_data.get('items', existing.get('items', []))
    selected_ids = data.get('posterItemIds', existing.get('posterItemIds', []))
    if not isinstance(selected_ids, list):
        return jsonify({'error': 'posterItemIds must be a list'}), 400
    try:
        update_data.update(_order_summary_and_posters(items_for_meta, selected_ids))
    except Exception as e:
        return jsonify({'error': f'Could not build watch order summary: {e}'}), 500

    if data.get('clearCoverImage'):
        update_data['coverPosterUrl'] = None

    try:
        result = db.watch_orders.update_one({"_id": oid}, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"error": "Watch order not found"}), 404
        if data.get('coverImage'):
            cover_url = _save_cover_image(oid, data['coverImage'])
            db.watch_orders.update_one({'_id': oid}, {'$set': {'coverPosterUrl': cover_url}})
        updated = db.watch_orders.find_one({"_id": oid})
        return jsonify(serialize_order(updated)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
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
