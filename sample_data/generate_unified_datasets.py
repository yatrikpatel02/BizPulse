import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

# Target directory
output_dir = r"C:\Users\patel siya\Documents\DATASETS"
os.makedirs(output_dir, exist_ok=True)

# Company Products
products = [
    {"name": "Lumina Pro Smartphone", "cost": 450.00, "price": 899.99},
    {"name": "UltraView 4K Monitor", "cost": 200.00, "price": 399.50},
    {"name": "Mechanix Wireless Keyboard", "cost": 45.00, "price": 129.99},
    {"name": "ErgoGrip Bluetooth Mouse", "cost": 15.00, "price": 49.99},
    {"name": "SonicBoom Noise Cancelling Headphones", "cost": 120.00, "price": 299.00},
    {"name": "PowerCore 20000mAh Power Bank", "cost": 25.00, "price": 59.99},
    {"name": "AeroStream Wi-Fi 6 Router", "cost": 75.00, "price": 149.99},
    {"name": "DeskMate Adjustable Stand", "cost": 12.00, "price": 35.00}
]

# Generate Dates
start_date = datetime(2023, 1, 1)
end_date = datetime(2023, 12, 31)
date_range = [start_date + timedelta(days=x) for x in range((end_date - start_date).days + 1)]

# 1. GENERATE SALES DATA (1500 records)
sales_data = []
for _ in range(1500):
    product = random.choice(products)
    qty = random.randint(1, 5)
    sales_data.append({
        "date": random.choice(date_range).strftime('%Y-%m-%d'),
        "product_name": product["name"],
        "qty_sold": qty,
        "amount": round(product["price"] * qty, 2),
        "cost": round(product["cost"] * qty, 2)
    })

sales_df = pd.DataFrame(sales_data).sort_values(by="date")

# 2. GENERATE INVENTORY DATA (Monthly snapshots)
inventory_data = []
snapshot_dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='MS') # Month Start
for dt in snapshot_dates:
    for product in products:
        inventory_data.append({
            "date": dt.strftime('%Y-%m-%d'),
            "product_name": product["name"],
            "quantity_on_hand": random.randint(20, 300),
            "reorder_point": random.choice([20, 50, 100])
        })

inventory_df = pd.DataFrame(inventory_data)

# 3. GENERATE REVIEW DATA (500 records)
reviews = [
    (5, "Amazing product, highly recommend!"), (4, "Really good, but a bit pricey."),
    (5, "Perfect for my needs. Great quality."), (3, "It's okay, does the job."),
    (2, "Had some issues setting it up."), (1, "Broke after a week of use."),
    (4, "Solid build quality, very happy."), (5, "Exceeded my expectations!")
]
authors = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ian", "Julia", "Kevin", "Luna"]

review_data = []
for _ in range(500):
    product = random.choice(products)
    rating, text = random.choice(reviews)
    review_data.append({
        "date": random.choice(date_range).strftime('%Y-%m-%d'),
        "product_name": product["name"],
        "rating": rating,
        "review": text,
        "author_name": f"{random.choice(authors)} {random.choice(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'])}"
    })

reviews_df = pd.DataFrame(review_data).sort_values(by="date")

# SAVE AS CSV, XLSX, AND XLS
sales_df.to_csv(os.path.join(output_dir, 'TechGadgets_Sales.csv'), index=False)
inventory_df.to_excel(os.path.join(output_dir, 'TechGadgets_Inventory.xlsx'), index=False)
reviews_df.to_csv(os.path.join(output_dir, 'TechGadgets_Reviews.csv'), index=False)

print(f"Datasets generated successfully in {output_dir}")
