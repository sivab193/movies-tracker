import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore, auth

def initialize_firebase():
    if not firebase_admin._apps:
        # Check if we have the service account content in an environment variable (common for Vercel)
        service_account_key = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY')
        
        if service_account_key:
            try:
                # If it's base64 encoded (to handle newlines in env vars), decode it
                if "{" not in service_account_key:
                    cred_json = json.loads(base64.b64decode(service_account_key))
                else:
                    cred_json = json.loads(service_account_key)
                
                cred = credentials.Certificate(cred_json)
                firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"Error initializing Firebase with env var: {e}")
                # Fallback or re-raise depending on strictness
        else:
            # Fallback for local development if file exists
            try:
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
            except Exception as e:
                print("Warning: Could not initialize Firebase. Ensure FIREBASE_SERVICE_ACCOUNT_KEY env var is set or serviceAccountKey.json is present.")

initialize_firebase()
auth = auth
# dB is removed as we use Mongo

