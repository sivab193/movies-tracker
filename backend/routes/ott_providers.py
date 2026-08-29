from flask import Blueprint, jsonify, request, Response
from bson import ObjectId, Binary
import base64
import datetime
import ipaddress
import re
import socket
from urllib.parse import urljoin, urlparse

import requests

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

MAX_ICON_BYTES = 1 * 1024 * 1024
ALLOWED_ICON_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'}


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


def decode_icon_data(value):
    if not isinstance(value, str) or not value.startswith('data:'):
        raise ValueError('Logo upload must be an image data URL')
    try:
        header, encoded = value.split(',', 1)
        mime_type = header.split(';', 1)[0].split(':', 1)[1].lower()
        if mime_type not in ALLOWED_ICON_MIME_TYPES:
            raise ValueError('Only JPEG, PNG, WebP, GIF, and SVG logos are supported')
        image_bytes = base64.b64decode(encoded, validate=True)
    except (IndexError, ValueError, base64.binascii.Error):
        raise ValueError('Invalid logo image')
    if not image_bytes or len(image_bytes) > MAX_ICON_BYTES:
        raise ValueError('Logo files must be 1 MB or smaller')
    return mime_type, Binary(image_bytes)


def public_host(url):
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ('http', 'https') or parsed.username or parsed.password:
        raise ValueError('Logo URL must be a public http(s) image URL')
    if parsed.port and parsed.port not in (80, 443):
        raise ValueError('Logo URL must use the standard HTTP or HTTPS port')
    host = (parsed.hostname or '').rstrip('.').lower()
    if not host:
        raise ValueError('Logo URL must include a hostname')
    try:
        addresses = {info[4][0] for info in socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme.lower() == 'https' else 80), type=socket.SOCK_STREAM)}
    except socket.gaierror:
        raise ValueError('Could not resolve logo URL host')
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            raise ValueError('Logo URL host must resolve to a public address')
    return url


def fetch_icon_url(value):
    current_url = public_host(validate_url(value, 'Icon URL'))
    for _ in range(3):
        response = requests.get(current_url, timeout=15, stream=True, allow_redirects=False, headers={'User-Agent': 'MediaVerse/1.0'})
        if response.is_redirect or response.is_permanent_redirect:
            location = response.headers.get('Location')
            if not location:
                raise ValueError('Logo URL returned an invalid redirect')
            current_url = public_host(urljoin(current_url, location))
            continue
        if response.status_code < 200 or response.status_code >= 300:
            raise ValueError(f'Logo URL returned HTTP {response.status_code}')
        content_type = response.headers.get('Content-Type', '').split(';', 1)[0].lower()
        if content_type not in ALLOWED_ICON_MIME_TYPES:
            raise ValueError('URL did not return a supported image')
        chunks = []
        size = 0
        for chunk in response.iter_content(64 * 1024):
            size += len(chunk)
            if size > MAX_ICON_BYTES:
                raise ValueError('Logo files must be 1 MB or smaller')
            chunks.append(chunk)
        return content_type, Binary(b''.join(chunks))
    raise ValueError('Logo URL redirected too many times')


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
    if item.get('iconData'):
        item['iconUrl'] = f"/api/ott-providers/{item['id']}/icon"
    item.pop('iconData', None)
    item.pop('iconMimeType', None)
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


def save_icon(data):
    if data.get('iconImage'):
        return decode_icon_data(data['iconImage'])
    icon_url = data.get('iconUrl')
    if icon_url and str(icon_url).startswith(('http://', 'https://')):
        return fetch_icon_url(icon_url)
    return None


@ott_providers_bp.route('/', methods=['GET'])
def list_providers():
    custom = list(db.ott_providers.find({}).sort('name', 1))
    replaced = {doc.get('replacesDefault') for doc in custom if doc.get('replacesDefault')}
    items = [serialize(provider, True) for provider in DEFAULT_PROVIDERS if provider['name'] not in replaced]
    items.extend(serialize(provider) for provider in custom)
    items.sort(key=lambda item: item.get('name', '').lower())
    return jsonify({"providers": items})


@ott_providers_bp.route('/<provider_id>/icon', methods=['GET'])
def get_provider_icon(provider_id):
    if provider_id.startswith('default:') or not ObjectId.is_valid(provider_id):
        return jsonify({"error": "Icon not found"}), 404
    provider = db.ott_providers.find_one({"_id": ObjectId(provider_id)}, {"iconData": 1, "iconMimeType": 1})
    if not provider or not provider.get('iconData'):
        return jsonify({"error": "Icon not found"}), 404
    return Response(bytes(provider['iconData']), mimetype=provider.get('iconMimeType', 'application/octet-stream'), headers={'Cache-Control': 'public, max-age=31536000, immutable'})


@ott_providers_bp.route('/', methods=['POST'])
def create_provider():
    if not verify_admin(request):
        return jsonify({"error": "Forbidden: Admin access required"}), 403
    data = request.get_json(silent=True) or {}
    try:
        provider = normalize_provider(data)
        icon = save_icon(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if provider_name_exists(provider['name']):
        return jsonify({"error": "A provider with this name already exists"}), 409
    now = datetime.datetime.now(datetime.timezone.utc)
    provider.update({"createdAt": now, "updatedAt": now})
    if icon:
        provider.update({"iconMimeType": icon[0], "iconData": icon[1], "iconUrl": None})
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
        icon = save_icon(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if provider_name_exists(provider['name'], existing.get('_id') if existing else None, replaces_default):
        return jsonify({"error": "A provider with this name already exists"}), 409
    now = datetime.datetime.now(datetime.timezone.utc)
    provider['updatedAt'] = now
    if replaces_default:
        provider['replacesDefault'] = replaces_default
    if icon:
        provider.update({"iconMimeType": icon[0], "iconData": icon[1], "iconUrl": None})
    elif existing and existing.get('iconData'):
        provider.update({"iconMimeType": existing.get('iconMimeType'), "iconData": existing.get('iconData')})
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
