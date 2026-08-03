import csv
import random
from datetime import datetime, timedelta

# Seed for reproducible, high quality data
random.seed(42)

# Product Catalog definition matching user sample
CATALOG = [
    # Electronics
    {"name": "Wireless Bluetooth Earbuds", "category": "Electronics", "price_min": 1200, "price_max": 1400},
    {"name": "Laptop Stand Adjustable", "category": "Electronics", "price_min": 1650, "price_max": 1950},
    {"name": "USB-C Fast Charging Cable", "category": "Electronics", "price_min": 260, "price_max": 325},
    {"name": "Portable Phone Charger 20000mAh", "category": "Electronics", "price_min": 1400, "price_max": 1620},
    {"name": "Smart LED Desk Lamp", "category": "Electronics", "price_min": 820, "price_max": 965},
    {"name": "Mechanical Keyboard RGB", "category": "Electronics", "price_min": 2300, "price_max": 2700},
    {"name": "Noise Cancelling Headphones", "category": "Electronics", "price_min": 3700, "price_max": 4350},
    {"name": "Webcam HD 1080p", "category": "Electronics", "price_min": 1650, "price_max": 1950},
    # Fashion
    {"name": "Cotton Round Neck T-Shirt", "category": "Fashion", "price_min": 370, "price_max": 430},
    {"name": "Slim Fit Chino Pants", "category": "Fashion", "price_min": 830, "price_max": 975},
    {"name": "Leather Wallet Slim", "category": "Fashion", "price_min": 550, "price_max": 650},
    {"name": "Running Sports Shoes", "category": "Fashion", "price_min": 1850, "price_max": 2150},
    {"name": "Sunglasses UV400 Polarized", "category": "Fashion", "price_min": 730, "price_max": 860},
    {"name": "Casual Denim Jacket", "category": "Fashion", "price_min": 1350, "price_max": 1620},
    # Home & Living
    {"name": "Stainless Steel Water Bottle 1L", "category": "Home & Living", "price_min": 460, "price_max": 540},
    {"name": "Non-Stick Frying Pan 26cm", "category": "Home & Living", "price_min": 730, "price_max": 860},
    {"name": "Memory Foam Pillow", "category": "Home & Living", "price_min": 830, "price_max": 970},
    {"name": "Bamboo Cutting Board Set", "category": "Home & Living", "price_min": 550, "price_max": 640},
    {"name": "Scented Soy Wax Candle", "category": "Home & Living", "price_min": 320, "price_max": 380},
    # Beauty
    {"name": "Under Eye Cream Dark Circles", "category": "Beauty", "price_min": 410, "price_max": 480},
    {"name": "Vitamin C Face Serum 30ml", "category": "Beauty", "price_min": 640, "price_max": 750},
    {"name": "Moisturising Sunscreen SPF50", "category": "Beauty", "price_min": 370, "price_max": 430},
    {"name": "Natural Aloe Vera Gel 200ml", "category": "Beauty", "price_min": 220, "price_max": 270},
    {"name": "Collagen Face Sheet Mask Pack", "category": "Beauty", "price_min": 180, "price_max": 215},
]

AUTHORS = [
    "Ravi C.", "Kavya N.", "Ananya G.", "Suresh B.", "Priya S.",
    "Arjun M.", "Vikram T.", "Sneha P.", "Rahul K.", "Aditya R.",
    "Deepa M.", "Karan V.", "Nisha L.", "Rohan D.", "Meera J."
]

SOURCES = ["Amazon", "Flipkart", "Website", "Google Reviews", "App Store"]

REVIEWS_BANK = {
    5: [
        "Absolutely love this product! Works exactly as described.",
        "Very satisfied with my purchase. Fast delivery too.",
        "Quality is top notch. Totally worth it.",
        "Exceeded my expectations. 5 stars!",
        "My family loves it. Great purchase.",
        "Works like a charm. Very pleased.",
        "Great quality for the price. Highly recommend!",
        "Good value for money. Happy with it.",
        "Sturdy build quality and works perfectly.",
        "Excellent product. Will buy again."
    ],
    4: [
        "Very satisfied with my purchase. Fast delivery too.",
        "Excellent product. Will buy again.",
        "Great quality for the price. Highly recommend!",
        "Good value for money. Happy with it.",
        "Sturdy build quality and works perfectly.",
        "Works like a charm. Very pleased.",
        "Absolutely love this product! Works exactly as described.",
        "Quality is top notch. Totally worth it."
    ],
    3: [
        "Decent product. Does what it says.",
        "Works as expected. No complaints.",
        "Average quality. Nothing special.",
        "Okay for the price. Could be better.",
        "Its okay. Will use it and see.",
        "Packaging was a bit damaged but product is fine.",
        "Not bad, but not great either."
    ],
    2: [
        "Would not recommend. Waste of money.",
        "Poor quality. Not worth the price.",
        "Customer support was unhelpful.",
        "Does not match the description at all.",
        "Expected better. Returned the product."
    ],
    1: [
        "Broke after first use. Very fragile.",
        "Stopped working after a week. Very disappointed.",
        "Poor quality. Not worth the price.",
        "Customer support was unhelpful.",
        "Does not match the description at all.",
        "Would not recommend. Waste of money."
    ]
}

# Date Range: 2024-01-01 to 2025-06-30 (547 days)
start_date = datetime(2024, 1, 1)
total_days = 547

# 1. GENERATE sales.csv (5,250 rows)
NUM_SALES_ROWS = 5250
sales_rows = []

for _ in range(NUM_SALES_ROWS):
    random_day = start_date + timedelta(days=random.randint(0, total_days - 1))
    date_str = random_day.strftime("%Y-%m-%d")
    prod = random.choice(CATALOG)
    qty = random.randint(1, 20)
    unit_price = round(random.uniform(prod["price_min"], prod["price_max"]), 2)
    revenue = round(qty * unit_price, 2)
    
    sales_rows.append({
        "date": date_str,
        "product_name": prod["name"],
        "category": prod["category"],
        "quantity": qty,
        "unit_price": unit_price,
        "revenue": revenue
    })

# Sort sales by date ascending
sales_rows.sort(key=lambda x: x["date"])

with open("sample_data/sales.csv", mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["date", "product_name", "category", "quantity", "unit_price", "revenue"])
    writer.writeheader()
    writer.writerows(sales_rows)

print(f"Generated sample_data/sales.csv with {len(sales_rows)} rows.")


# 2. GENERATE inventory.csv (Monthly snapshots for all products: 18 months x 24 products = 432 rows)
months = []
curr = datetime(2024, 1, 1)
while curr <= datetime(2025, 6, 1):
    months.append(curr.strftime("%Y-%m-%d"))
    # Advance to next month start
    if curr.month == 12:
        curr = datetime(curr.year + 1, 1, 1)
    else:
        curr = datetime(curr.year, curr.month + 1, 1)

inventory_rows = []
for m_date in months:
    for prod in CATALOG:
        qty_on_hand = random.randint(10, 250)
        reorder_point = random.randint(15, 50)
        inventory_rows.append({
            "date": m_date,
            "product_name": prod["name"],
            "category": prod["category"],
            "quantity_on_hand": qty_on_hand,
            "reorder_point": reorder_point
        })

inventory_rows.sort(key=lambda x: (x["date"], x["product_name"]))

with open("sample_data/inventory.csv", mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["date", "product_name", "category", "quantity_on_hand", "reorder_point"])
    writer.writeheader()
    writer.writerows(inventory_rows)

print(f"Generated sample_data/inventory.csv with {len(inventory_rows)} rows.")


# 3. GENERATE reviews.csv (1,200 realistic customer reviews based on products in sales)
NUM_REVIEWS = 1200
review_rows = []

# Weight ratings towards positive 4 and 5 stars realistically
ratings_weights = [5]*45 + [4]*30 + [3]*15 + [2]*6 + [1]*4

for _ in range(NUM_REVIEWS):
    random_day = start_date + timedelta(days=random.randint(0, total_days - 1))
    date_str = random_day.strftime("%Y-%m-%d")
    prod = random.choice(CATALOG)
    rating = random.choice(ratings_weights)
    review_text = random.choice(REVIEWS_BANK[rating])
    author = random.choice(AUTHORS)
    source = random.choice(SOURCES)
    
    review_rows.append({
        "review_date": date_str,
        "product_name": prod["name"],
        "category": prod["category"],
        "source": source,
        "author_name": author,
        "rating": rating,
        "review_text": review_text
    })

review_rows.sort(key=lambda x: x["review_date"])

with open("sample_data/reviews.csv", mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["review_date", "product_name", "category", "source", "author_name", "rating", "review_text"])
    writer.writeheader()
    writer.writerows(review_rows)

# Also create copy customer_reviews.csv if needed by legacy
with open("sample_data/customer_reviews.csv", mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["review_date", "product_name", "category", "source", "author_name", "rating", "review_text"])
    writer.writeheader()
    writer.writerows(review_rows)

print(f"Generated sample_data/reviews.csv with {len(review_rows)} rows.")
