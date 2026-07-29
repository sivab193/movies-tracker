"""
Seed script to add initial card data to MongoDB.
Run: python backend/scripts/seed_cards.py

Requires MONGO_URI environment variable to be set.
"""
import os
import sys
import datetime

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from mongo_config import db
from bson import ObjectId

if db is None:
    print("ERROR: Could not connect to MongoDB. Check your MONGO_URI.")
    sys.exit(1)

now = datetime.datetime.now(datetime.timezone.utc)

cards = [
    {
        "name": "Axis Burgundy Debit",
        "bank": "Axis Bank",
        "type": "debit",
        "network": "Visa",
        "offers": [
            {
                "_id": ObjectId(),
                "platform": "BookMyShow",
                "offerType": "BOGO",
                "description": "Buy 1 Get 1 Free on movie tickets",
                "maxDiscount": 500,
                "usesPerMonth": 4,
                "minTickets": 2,
                "couponCode": None,
                "perDayLimit": 1,
                "notes": "Select 'Axis Bank Debit Card offer' on BookMyShow payment page. Must book min 2 tickets. Only eligible Burgundy BIN numbers.",
                "isActive": True
            }
        ],
        "reportCount": 0,
        "lastVerifiedAt": now,
        "createdAt": now,
        "updatedAt": now
    },
    {
        "name": "SBI Wealth Debit",
        "bank": "SBI",
        "type": "debit",
        "network": "RuPay Select",
        "offers": [
            {
                "_id": ObjectId(),
                "platform": "BookMyShow",
                "offerType": "discount",
                "description": "2 free movie tickets per month (up to ₹500 per transaction)",
                "maxDiscount": 500,
                "usesPerMonth": 1,
                "minTickets": 2,
                "couponCode": None,
                "perDayLimit": None,
                "notes": "Select 'RuPay SBI Debit Card Offer' on BookMyShow. Only SBI Wealth RuPay Select variant eligible. Convenience fees not covered.",
                "isActive": True
            }
        ],
        "reportCount": 0,
        "lastVerifiedAt": now,
        "createdAt": now,
        "updatedAt": now
    },
    {
        "name": "Axis Myzone",
        "bank": "Axis Bank",
        "type": "credit",
        "network": "Visa",
        "offers": [
            {
                "_id": ObjectId(),
                "platform": "District",
                "offerType": "BOGO",
                "description": "100% discount on second movie ticket (up to ₹200/month)",
                "maxDiscount": 200,
                "usesPerMonth": 1,
                "minTickets": 2,
                "couponCode": "AXIS200",
                "perDayLimit": None,
                "notes": "Use code AXIS200 on District app. May require ₹25,000 monthly spend for eligibility. Verify current terms on Axis Bank app.",
                "isActive": True
            }
        ],
        "reportCount": 0,
        "lastVerifiedAt": now,
        "createdAt": now,
        "updatedAt": now
    }
]

print("Seeding cards...")
for card in cards:
    # Check if card already exists
    existing = db.cards.find_one({"name": card["name"], "bank": card["bank"]})
    if existing:
        print(f"  ⚠️  '{card['name']}' already exists, skipping.")
        continue
    
    result = db.cards.insert_one(card)
    print(f"  ✅ Added '{card['name']}' (ID: {result.inserted_id})")

print(f"\nDone! {db.cards.count_documents({})} total cards in database.")
