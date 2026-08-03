import os
import sys
import django
import pandas as pd

sys.path.insert(0, os.path.abspath('d:/PYTHON-2_PROJECT/BizPulse/backend/apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BizPulse.settings.base')
django.setup()

from integrations.models import ImportBatch
from businesses.models import Business
from products.models import Product
from analytics.models import SalesRecord

business = Business.objects.first()

# Create a dummy dataframe
df_cleaned = pd.DataFrame([
    {'product_name': 'Test Prod 1', 'date': '2023-01-01', 'quantity': 10, 'revenue': 100.0},
    {'product_name': 'Test Prod 2', 'date': '2023-01-01', 'quantity': 5, 'revenue': 50.0},
])

all_products = list(Product.objects.filter(business=business))
existing_products = {p.name: p for p in all_products}
existing_products_by_sku = {p.sku: p for p in all_products}

records_dict = {}
for _, row in df_cleaned.iterrows():
    prod_name = row['product_name']
    product = existing_products.get(prod_name) or existing_products_by_sku.get(prod_name)
    if not product:
        sku = prod_name.strip().upper().replace(' ', '_')[:100]
        base_sku = sku
        counter = 1
        while sku in existing_products_by_sku:
            sku = f"{base_sku[:90]}_{counter}"
            counter += 1
        product = Product.objects.create(
            business=business,
            name=prod_name,
            sku=sku,
            price=0.0
        )
        existing_products[prod_name] = product
        existing_products_by_sku[sku] = product
        
    date_val = row['date']
    qty = int(row['quantity'])
    rev = float(row['revenue'])
    unit_price = rev / qty if qty > 0 else 0.0

    records_dict[(product.id, date_val)] = SalesRecord(
        business=business,
        product=product,
        date=date_val,
        quantity=qty,
        revenue=rev,
        unit_price=unit_price,
    )

print("Attempting bulk_create...")
try:
    SalesRecord.objects.bulk_create(
        records_dict.values(),
        update_conflicts=True,
        unique_fields=['business', 'product', 'date'],
        update_fields=['quantity', 'revenue', 'unit_price']
    )
    print("Success!")
except Exception as e:
    print("Error:", str(e))
