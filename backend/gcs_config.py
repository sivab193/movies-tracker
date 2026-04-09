import os
import json
import base64
import requests
from io import BytesIO
from google.cloud import storage

_client = None
_bucket = None

GCS_BUCKET_NAME = os.environ.get('GCS_BUCKET_NAME', 'movies-tracker')


def _get_client():
    """Lazily initialize GCS client."""
    global _client
    if _client is not None:
        return _client

    gcs_key = os.environ.get('GCS_SERVICE_ACCOUNT_KEY')

    if gcs_key:
        try:
            if "{" not in gcs_key:
                cred_json = json.loads(base64.b64decode(gcs_key))
            else:
                cred_json = json.loads(gcs_key)
            _client = storage.Client.from_service_account_info(cred_json)
        except Exception as e:
            print(f"Error initializing GCS with env var: {e}")
            _client = None
    else:
        # Fallback: local service account file
        key_path = os.path.join(os.path.dirname(__file__), 'gcs-service-account.json')
        if os.path.exists(key_path):
            _client = storage.Client.from_service_account_json(key_path)
        else:
            # Try default credentials (e.g., running on GCP)
            try:
                _client = storage.Client()
            except Exception as e:
                print(f"Warning: Could not initialize GCS client: {e}")
                _client = None

    return _client


def _get_bucket():
    """Get the GCS bucket instance."""
    global _bucket
    if _bucket is not None:
        return _bucket

    client = _get_client()
    if client is None:
        return None

    try:
        _bucket = client.bucket(GCS_BUCKET_NAME)
        return _bucket
    except Exception as e:
        print(f"Error accessing GCS bucket '{GCS_BUCKET_NAME}': {e}")
        return None


def upload_image_from_url(source_url, destination_blob_name):
    """
    Download an image from a URL and upload it to GCS.

    Args:
        source_url: The URL to download the image from.
        destination_blob_name: The destination path in the bucket (e.g. 'coverpics/tt1234567.jpg').

    Returns:
        The public URL of the uploaded object, or None on failure.
    """
    bucket = _get_bucket()
    if bucket is None:
        print("GCS bucket not available. Falling back to original URL.")
        return None

    if not source_url or source_url == "N/A":
        return None

    try:
        response = requests.get(source_url, timeout=15)
        response.raise_for_status()

        blob = bucket.blob(destination_blob_name)

        content_type = response.headers.get('Content-Type', 'image/jpeg')
        blob.upload_from_file(
            BytesIO(response.content),
            content_type=content_type,
            rewind=True
        )

        # Public URL format for public buckets
        public_url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{destination_blob_name}"
        return public_url

    except Exception as e:
        print(f"Error uploading image to GCS ({destination_blob_name}): {e}")
        return None


def upload_image_from_bytes(image_bytes, destination_blob_name, content_type='image/jpeg'):
    """
    Upload raw image bytes to GCS.

    Args:
        image_bytes: The raw bytes of the image.
        destination_blob_name: The destination path in the bucket.
        content_type: MIME type of the image.

    Returns:
        The public URL of the uploaded object, or None on failure.
    """
    bucket = _get_bucket()
    if bucket is None:
        return None

    try:
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_file(
            BytesIO(image_bytes),
            content_type=content_type,
            rewind=True
        )
        return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{destination_blob_name}"
    except Exception as e:
        print(f"Error uploading image to GCS ({destination_blob_name}): {e}")
        return None
