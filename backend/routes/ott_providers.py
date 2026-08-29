from flask import Blueprint, jsonify, request
from bson import ObjectId
import datetime
import re

from mongo_config import db
from routes.movies import is_admin

ott_providers_bp = Blueprint('ott_providers', __name__)

DEFAULT_PROVIDERS = [
    {"name": "Sun NXT", "baseUrl": "https://www.sunnxt.com", "iconText": "SN", "backgroundColor": "#dc2626", "textColor": "#ffffff"},
    {"name": "Netflix", "baseUrl": "https://www.netflix.com", "iconText": "N", "backgroundColor": "#e50914", "textColor": "#ffffff"},
    {"name": "Prime Video", "baseUrl": "https://www.primevideo.com", "iconText": "PV", "backgroundColor": "#00a8e1", "textColor": "#ffffff"},
    {"name": "Disney+ Hotstar", "baseUrl": "https://www.hotstar.com", "iconText": "DH", "backgroundColor": "#113ccf", "textColor": "#ffffff"},
    {"name": "JioHotstar", "baseUrl": "https://www.jiohotstar.com", "iconText": "JH", "backgroundColor": "#113ccf", "textColor": "#ffffff"},
    {"name": "ZEE5", "baseUrl": "https://www.zee5.com", "iconText": "Z5", "backgroundColor": "#18181b", "textColor": "#ffffff"},
    {"name": "SonyLIV", "baseUrl": "https://www.sonyliv.com", "iconText": "SL", "backgroundColor": "#7c3aed", "textColor": "#ffffff"},
    {"name": "aha", "baseUrl": "https://www.aha.video", "iconText": "A", "backgroundColor": "#fbbf24", "textColor": "#000000"},
    {"name": "Apple TV+", "baseUrl": "https://tv.apple.com", "iconText": "TV", "backgroundColor": "#27272a", "textColor": "#ffffff"},
    {"name": "MUBI", "baseUrl": "https://mubi.com", "iconText": "MU", "backgroundColor": "#fde047", "textColor": "#000000"},
]


def verify_admin(req):
    header = req.headers.get('Authorization')
    return bool(header and header.startswith('Bearer ') and is_admin(header.split(' ')[1]))


def validate_url(value, field, required=False):
    value = str(value or '').strip()
    if required and not value:
        raise ValueError(f'{field} is required')
    if value and not re.match(r'^https?://', value, re.I):
        raise ValueError(f'{field} must start with http:// or https://')
    return value[:2000]


def normalize_provider(data):
    name = str(data.get('name') or '').strip()
    if not name:
        raise ValueError('Provider name is required')
    return {
        "name": name[:80],
        "baseUrl": validate_url(data.get('baseUrl'), 'Base URL', True),
        "iconUrl": validate_url(data.get('iconUrl'), 'Icon URL'),
        "iconText": str(data.get('iconText') or '').strip()[:4] or ''.join(ch for ch in name if ch.isalnum())[:2].upper(),
        "backgroundColor": str(data.get('backgroundColor') or '#7c3aed').strip()[:20],
        "textColor": str(data.get('textColor') or '#ffffff').strip()[:20],
    }


def serialize(doc, is_default=False):
    item = dict(doc)
    item['id'] = f"default:{item['name']}" if is_default else str(item.pop('_id'))
    item['isDefault'] = is_default
    for field in ('createdAt', 'updatedAt'):
        if item.get(field) and hasattr(item[field], 'isoformat'):
            item[field] = item[field].isoformat()
    return item


def provider_name_exists(name, exclude_id=None, exclude_default=None):
    query = {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    if exclude_id:
        query['_id'] = {"$ne": exclude_id}
    if db.ott_providers.find_one(query):
        return True
    return any(
        provider['name'].lower() == name.lower() and provider['name'] != exclude_default
        for provider in DEFAULT_PROVIDERS
    )


@ott_providers_bp.route('/', methods=['GET'])
def list_providers():
    custom = list(db.ott_providers.find({}).sort('name', 1))
    replaced = {doc.get('replacesDefault') for doc in custom if doc.get('replacesDefault')}
    items = [serialize(provider, True) for provider in DEFAULT_PROVIDERS if provider['name'] not in replaced]
    items.extend(serialize(provider) for provider in custom)
    items.sort(key=lambda item: item.get('name', '').lower())
    return jsonify({"providers": items})


@ott_providers_bp.route('/', methods=['POST'])
def create_provider():
    if not verify_admin(request):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    try:
        provider = normalize_provider(request.get_json(silent=True) or {})
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if provider_name_exists(provider['name']):
        return jsonify({"error": "A provider with this name already exists"}), 409
    now = datetime.datetime.now(datetime.timezone.utc)
    provider.update({"createdAt": now, "updatedAt": now})
    result = db.ott_providers.insert_one(provider)
    provider['_id'] = result.inserted_id
    return jsonify({"provider": serialize(provider)}), 201


@ott_providers_bp.route('/<provider_id>', methods=['PUT'])
def update_provider(provider_id):
    if not verify_admin(request):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    data = request.get_json(silent=True) or {}
    existing = None
    old_name = None
    replaces_default = None
    if provider_id.startswith('default:'):
        old_name = provider_id.split(':', 1)[1]
        replaces_default = old_name
        existing = db.ott_providers.find_one({"replacesDefault": old_name})
    elif ObjectId.is_valid(provider_id):
        existing = db.ott_providers.find_one({"_id": ObjectId(provider_id)})
        old_name = existing.get('name') if existing else None
        replaces_default = existing.get('replacesDefault') if existing else None
    if not old_name:
        return jsonify({"error": "Provider not found"}), 404
    try:
        provider = normalize_provider(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if provider_name_exists(
        provider['name'],
        existing.get('_id') if existing else None,
        replaces_default,
    ):
        return jsonify({"error": "A provider with this name already exists"}), 409
    now = datetime.datetime.now(datetime.timezone.utc)
    provider['updatedAt'] = now
    if replaces_default:
        provider['replacesDefault'] = replaces_default
    if existing:
        db.ott_providers.update_one({"_id": existing['_id']}, {"$set": provider})
        provider['_id'] = existing['_id']
    else:
        provider['createdAt'] = now
        result = db.ott_providers.insert_one(provider)
        provider['_id'] = result.inserted_id

    if old_name != provider['name']:
        for collection in (db.movies, db.series):
            collection.update_many(
                {"watchProviders.name": old_name},
                {"$set": {"watchProviders.$[watchProvider].name": provider['name']}},
                array_filters=[{"watchProvider.name": old_name}],
            )
    return jsonify({"provider": serialize(provider)})


@ott_providers_bp.route('/<provider_id>', methods=['DELETE'])
def delete_provider(provider_id):
    if not verify_admin(request):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    if provider_id.startswith('default:'):
        return jsonify({"error": "Built-in providers can be edited but not deleted"}), 400
    if not ObjectId.is_valid(provider_id):
        return jsonify({"error": "Invalid provider ID"}), 400
    result = db.ott_providers.delete_one({"_id": ObjectId(provider_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Provider not found"}), 404
    return jsonify({"message": "Provider deleted"})
