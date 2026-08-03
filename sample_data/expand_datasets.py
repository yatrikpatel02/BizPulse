"""
Generates all three datasets from scratch in a single pass.
- sales.csv     : 9,250 unique rows (Jan 2023 - Jun 2025)
- inventory.csv : monthly snapshots (Jan 2023 - Jun 2025) x 24 products
- reviews.csv   : 2,100 realistic customer reviews
"""
import csv
import random
from datetime import datetime, timedelta

# Single unified seed for the entire generation run
random.seed(2024)

CATALOG = [
    {"name": "Wireless Bluetooth Earbuds",    "category": "Electronics",   "price_min": 1200, "price_max": 1400},
    {"name": "Laptop Stand Adjustable",        "category": "Electronics",   "price_min": 1650, "price_max": 1950},
    {"name": "USB-C Fast Charging Cable",      "category": "Electronics",   "price_min": 260,  "price_max": 325},
    {"name": "Portable Phone Charger 20000mAh","category": "Electronics",   "price_min": 1400, "price_max": 1620},
    {"name": "Smart LED Desk Lamp",            "category": "Electronics",   "price_min": 820,  "price_max": 965},
    {"name": "Mechanical Keyboard RGB",        "category": "Electronics",   "price_min": 2300, "price_max": 2700},
    {"name": "Noise Cancelling Headphones",    "category": "Electronics",   "price_min": 3700, "price_max": 4350},
    {"name": "Webcam HD 1080p",                "category": "Electronics",   "price_min": 1650, "price_max": 1950},
    {"name": "Cotton Round Neck T-Shirt",      "category": "Fashion",       "price_min": 370,  "price_max": 430},
    {"name": "Slim Fit Chino Pants",           "category": "Fashion",       "price_min": 830,  "price_max": 975},
    {"name": "Leather Wallet Slim",            "category": "Fashion",       "price_min": 550,  "price_max": 650},
    {"name": "Running Sports Shoes",           "category": "Fashion",       "price_min": 1850, "price_max": 2150},
    {"name": "Sunglasses UV400 Polarized",     "category": "Fashion",       "price_min": 730,  "price_max": 860},
    {"name": "Casual Denim Jacket",            "category": "Fashion",       "price_min": 1350, "price_max": 1620},
    {"name": "Stainless Steel Water Bottle 1L","category": "Home & Living", "price_min": 460,  "price_max": 540},
    {"name": "Non-Stick Frying Pan 26cm",      "category": "Home & Living", "price_min": 730,  "price_max": 860},
    {"name": "Memory Foam Pillow",             "category": "Home & Living", "price_min": 830,  "price_max": 970},
    {"name": "Bamboo Cutting Board Set",       "category": "Home & Living", "price_min": 550,  "price_max": 640},
    {"name": "Scented Soy Wax Candle",         "category": "Home & Living", "price_min": 320,  "price_max": 380},
    {"name": "Under Eye Cream Dark Circles",   "category": "Beauty",        "price_min": 410,  "price_max": 480},
    {"name": "Vitamin C Face Serum 30ml",      "category": "Beauty",        "price_min": 640,  "price_max": 750},
    {"name": "Moisturising Sunscreen SPF50",   "category": "Beauty",        "price_min": 370,  "price_max": 430},
    {"name": "Natural Aloe Vera Gel 200ml",    "category": "Beauty",        "price_min": 220,  "price_max": 270},
    {"name": "Collagen Face Sheet Mask Pack",  "category": "Beauty",        "price_min": 180,  "price_max": 215},
]

AUTHORS = [
    "Ravi C.", "Kavya N.", "Ananya G.", "Suresh B.", "Priya S.",
    "Arjun M.", "Vikram T.", "Sneha P.", "Rahul K.", "Aditya R.",
    "Deepa M.", "Karan V.", "Nisha L.", "Rohan D.", "Meera J.",
    "Pooja S.", "Kartik P.", "Sonal M.", "Dhruv A.", "Tanya K.",
    "Ishaan B.", "Shruti R.", "Varun D.", "Aisha K.", "Nikhil J."
]

SOURCES = ["Amazon", "Flipkart", "Website", "Google Reviews", "App Store"]

REVIEW_TEXTS = {
    5: [
        "Absolutely love this! Works exactly as described.",
        "Very satisfied with my purchase. Fast delivery too.",
        "Perfect for my needs. Great quality.",
        "Exceeded my expectations. Highly recommend!",
        "My family loves it. Great purchase overall.",
        "Works like a charm. Very pleased with this.",
        "Great quality for the price. Will buy again.",
        "Good value for money. Very happy with it.",
        "Sturdy build and works perfectly. 5 stars!",
        "Excellent product. Zero complaints at all.",
        "Outstanding quality. Totally worth the price.",
        "Brilliant product. Delivered on time too.",
        "Best purchase this year. Amazing quality.",
        "Extremely happy! Highly recommend to everyone.",
        "Fantastic product. Looks great and works well.",
    ],
    4: [
        "Very good product. Mostly happy with it.",
        "Excellent value. A minor quibble but overall great.",
        "Good quality. Packaging was neat and tidy.",
        "Happy with the purchase. Works as expected.",
        "Solid build quality. Would recommend to a friend.",
        "Works well. Delivery was faster than expected.",
        "Good product, minor packaging damage but item fine.",
        "Overall a great buy. Minor issues but nothing major.",
        "Really satisfied. A few small things could be better.",
        "Good experience. Would buy from here again.",
    ],
    3: [
        "Decent product. Does exactly what it says.",
        "Average quality. Not bad but not great either.",
        "Works as expected. No major complaints.",
        "Okay for the price. Could be improved though.",
        "It is fine. Nothing outstanding about it.",
        "Packaging was a little damaged but the item is fine.",
        "Not as impressive as I expected. Just okay.",
        "Average experience. Product works but barely.",
    ],
    2: [
        "Not worth the money. Poor quality overall.",
        "Very disappointing. Returned the product.",
        "Customer support was unhelpful. Frustrating.",
        "Does not match the description at all.",
        "Quality is very low. Would not buy again.",
        "Broke sooner than expected. Very unhappy.",
    ],
    1: [
        "Broke after first use. Very fragile build.",
        "Stopped working within a week. Very disappointed.",
        "Extremely poor quality. Total waste of money.",
        "Never buying from here again. Terrible product.",
        "Does not work at all. Completely useless.",
        "Worst purchase I have made. Very regretful.",
        "Customer support refused to help. Awful experience.",
    ]
}

# Date range: 2023-01-01 to 2025-06-30
start_date = datetime(2023, 1, 1)
end_date   = datetime(2025, 6, 30)
total_days = (end_date - start_date).days + 1

# Build pool of all possible dates
all_dates = [start_date + timedelta(days=d) for d in range(total_days)]

# ============================================================
# 1. sales.csv — 9,250 rows from scratch, single pass
# ============================================================
NUM_SALES = 9250
sales_rows = []
for _ in range(NUM_SALES):
    day   = random.choice(all_dates)
    prod  = random.choice(CATALOG)
    qty   = random.randint(1, 25)
    # Add seasonal variance: Q4 gets a boost
    if day.month in (10, 11, 12):
        qty = min(25, qty + random.randint(1, 5))
    # Weekend boost
    if day.weekday() >= 5:
        qty = min(25, qty + random.randint(0, 3))
    unit_price = round(random.uniform(prod["price_min"], prod["price_max"]), 2)
    revenue    = round(qty * unit_price, 2)
    sales_rows.append({
        "date":         day.strftime("%Y-%m-%d"),
        "product_name": prod["name"],
        "category":     prod["category"],
        "quantity":     qty,
        "unit_price":   unit_price,
        "revenue":      revenue,
    })

# Sort by date
sales_rows.sort(key=lambda r: r["date"])

with open("sample_data/sales.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["date", "product_name", "category", "quantity", "unit_price", "revenue"])
    w.writeheader()
    w.writerows(sales_rows)

print(f"Generated sample_data/sales.csv  → {len(sales_rows):,} rows")

# ============================================================
# 2. inventory.csv — monthly snapshots, 30 months x 24 products
# ============================================================
months = []
curr = datetime(2023, 1, 1)
while curr <= datetime(2025, 6, 1):
    months.append(curr.strftime("%Y-%m-%d"))
    curr = datetime(curr.year + (curr.month // 12), (curr.month % 12) + 1, 1)

inv_rows = []
for m_date in months:
    for prod in CATALOG:
        qty_on_hand  = random.randint(10, 300)
        reorder_point = random.randint(15, 60)
        inv_rows.append({
            "date":           m_date,
            "product_name":   prod["name"],
            "category":       prod["category"],
            "quantity_on_hand": qty_on_hand,
            "reorder_point":  reorder_point,
        })

inv_rows.sort(key=lambda r: (r["date"], r["product_name"]))

with open("sample_data/inventory.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["date", "product_name", "category", "quantity_on_hand", "reorder_point"])
    w.writeheader()
    w.writerows(inv_rows)

print(f"Generated sample_data/inventory.csv → {len(inv_rows):,} rows")

# ============================================================
# 3. reviews.csv — 2,100 rows, realistic rating distribution
# ============================================================
NUM_REVIEWS = 2100
# Weighted realistic rating distribution
rating_pool = [5]*45 + [4]*30 + [3]*15 + [2]*6 + [1]*4

rev_rows = []
for _ in range(NUM_REVIEWS):
    day    = random.choice(all_dates)
    prod   = random.choice(CATALOG)
    rating = random.choice(rating_pool)
    text   = random.choice(REVIEW_TEXTS[rating])
    author = random.choice(AUTHORS)
    source = random.choice(SOURCES)
    rev_rows.append({
        "review_date":  day.strftime("%Y-%m-%d"),
        "product_name": prod["name"],
        "category":     prod["category"],
        "source":       source,
        "author_name":  author,
        "rating":       rating,
        "review_text":  text,
    })

rev_rows.sort(key=lambda r: r["review_date"])

fields = ["review_date", "product_name", "category", "source", "author_name", "rating", "review_text"]
for fname in ("sample_data/reviews.csv", "sample_data/customer_reviews.csv"):
    with open(fname, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rev_rows)

print(f"Generated sample_data/reviews.csv   → {len(rev_rows):,} rows")
print("\nAll datasets regenerated successfully from scratch!")
