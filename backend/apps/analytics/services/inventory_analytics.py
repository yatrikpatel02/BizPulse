import datetime
import pandas as pd
from django.db import models
from analytics.models.inventory_snapshot import InventorySnapshot
from products.models import Product


class InventoryAnalyticsService:
    @classmethod
    def parse_date(cls, date_val):
        if not date_val:
            return None
        if isinstance(date_val, (datetime.date, datetime.datetime)):
            if isinstance(date_val, datetime.datetime):
                return date_val.date()
            return date_val
        try:
            return pd.to_datetime(date_val).date()
        except Exception:
            raise ValueError(f"Invalid date format: {date_val}")

    @classmethod
    def _classify_stock(cls, qty, reorder):
        if qty == 0:
            return 'out_of_stock'
        if pd.isna(reorder) or reorder is None:
            return 'normal'
        
        reorder_val = int(reorder)
        if qty <= reorder_val:
            return 'understock'
        elif qty > 2 * reorder_val:
            return 'overstock'
        return 'normal'

    @classmethod
    def calculate_inventory_health(cls, business, date=None):
        date = cls.parse_date(date)

        snapshots_qs = InventorySnapshot.objects.filter(business=business)
        if date:
            snapshots_qs = snapshots_qs.filter(date__lte=date)

        if not snapshots_qs.exists():
            return {
                'health_score': 100.0,
                'out_of_stock_count': 0,
                'understock_count': 0,
                'normal_count': 0,
                'overstock_count': 0,
                'total_items': 0,
                'total_value': 0.0,
                'total_products': 0
            }

        # Load to pandas and resolve the latest snapshot per product
        df = pd.DataFrame(list(snapshots_qs.values(
            'product_id',
            'product__name',
            'product__sku',
            'product__price',
            'quantity_on_hand',
            'reorder_point',
            'date'
        )))
        df['date'] = pd.to_datetime(df['date'])
        
        # Sort by date and take the last snapshot per product
        df_latest = df.sort_values('date').groupby('product_id').last().reset_index()

        # Classify stock statuses
        df_latest['status'] = df_latest.apply(
            lambda r: cls._classify_stock(int(r['quantity_on_hand']), r['reorder_point']),
            axis=1
        )

        df_latest['valuation'] = df_latest['quantity_on_hand'].astype(int) * df_latest['product__price'].astype(float)

        total_products = len(df_latest)
        out_of_stock_count = int((df_latest['status'] == 'out_of_stock').sum())
        understock_count = int((df_latest['status'] == 'understock').sum())
        normal_count = int((df_latest['status'] == 'normal').sum())
        overstock_count = int((df_latest['status'] == 'overstock').sum())

        total_items = int(df_latest['quantity_on_hand'].sum())
        total_value = float(df_latest['valuation'].sum())
        health_score = (normal_count / total_products) * 100.0 if total_products > 0 else 100.0

        return {
            'health_score': round(health_score, 2),
            'out_of_stock_count': out_of_stock_count,
            'understock_count': understock_count,
            'normal_count': normal_count,
            'overstock_count': overstock_count,
            'total_items': total_items,
            'total_value': round(total_value, 2),
            'total_products': total_products
        }

    @classmethod
    def detect_stock_anomalies(cls, business):
        # We fetch the latest snapshot per product
        snapshots_qs = InventorySnapshot.objects.filter(business=business)
        if not snapshots_qs.exists():
            return []

        df = pd.DataFrame(list(snapshots_qs.values(
            'product_id',
            'product__name',
            'product__sku',
            'product__price',
            'quantity_on_hand',
            'reorder_point',
            'date'
        )))
        df['date'] = pd.to_datetime(df['date'])
        df_latest = df.sort_values('date').groupby('product_id').last().reset_index()

        df_latest['status'] = df_latest.apply(
            lambda r: cls._classify_stock(int(r['quantity_on_hand']), r['reorder_point']),
            axis=1
        )

        # Filter for anomalies: out of stock, understock, or overstock
        df_anomalies = df_latest[df_latest['status'].isin(['out_of_stock', 'understock', 'overstock'])]

        anomalies = []
        for _, row in df_anomalies.iterrows():
            anomalies.append({
                'product_id': int(row['product_id']),
                'product_name': row['product__name'],
                'product_sku': row['product__sku'],
                'quantity_on_hand': int(row['quantity_on_hand']),
                'reorder_point': int(row['reorder_point']) if not pd.isna(row['reorder_point']) and row['reorder_point'] is not None else None,
                'status': row['status']
            })

        return anomalies

    @classmethod
    def get_inventory_history(cls, business, start_date=None, end_date=None):
        start_date = cls.parse_date(start_date)
        end_date = cls.parse_date(end_date)

        snapshots_qs = InventorySnapshot.objects.filter(business=business)
        if start_date:
            snapshots_qs = snapshots_qs.filter(date__gte=start_date)
        if end_date:
            snapshots_qs = snapshots_qs.filter(date__lte=end_date)

        if not snapshots_qs.exists():
            return []

        df = pd.DataFrame(list(snapshots_qs.values(
            'product_id',
            'product__price',
            'quantity_on_hand',
            'reorder_point',
            'date'
        )))
        df['date'] = pd.to_datetime(df['date'])
        df['quantity_on_hand'] = df['quantity_on_hand'].astype(int)
        df['product__price'] = df['product__price'].astype(float)
        df['valuation'] = df['quantity_on_hand'] * df['product__price']

        history = []
        grouped = df.groupby('date')
        for dt, group in sorted(grouped, key=lambda x: x[0]):
            statuses = []
            for _, row in group.iterrows():
                status = cls._classify_stock(int(row['quantity_on_hand']), row['reorder_point'])
                statuses.append(status)

            total_qty = group['quantity_on_hand'].sum()
            total_val = group['valuation'].sum()

            history.append({
                'date': dt.strftime('%Y-%m-%d'),
                'total_quantity': int(total_qty),
                'total_value': round(float(total_val), 2),
                'out_of_stock_count': statuses.count('out_of_stock'),
                'understock_count': statuses.count('understock'),
                'normal_count': statuses.count('normal'),
                'overstock_count': statuses.count('overstock'),
            })

        return history
