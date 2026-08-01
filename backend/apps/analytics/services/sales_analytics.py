import datetime
import pandas as pd
from django.db import models
from django.db.models import Sum, Count
from analytics.models.sales_record import SalesRecord


class SalesAnalyticsService:
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
    def calculate_revenue_metrics(cls, business, start_date=None, end_date=None):
        start_date = cls.parse_date(start_date)
        end_date = cls.parse_date(end_date)

        queryset = SalesRecord.objects.filter(business=business)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        # If no records exist, return default structure
        if not queryset.exists():
            return {
                'total_revenue': 0.0,
                'total_quantity': 0,
                'average_unit_price': 0.0,
                'transaction_count': 0,
                'previous_revenue': 0.0,
                'previous_quantity': 0,
                'revenue_growth_pct': 0.0,
                'quantity_growth_pct': 0.0,
            }

        # Compute aggregates
        aggregates = queryset.aggregate(
            total_revenue=Sum('revenue'),
            total_quantity=Sum('quantity'),
            transaction_count=Count('id')
        )

        total_revenue = float(aggregates['total_revenue'] or 0.0)
        total_quantity = int(aggregates['total_quantity'] or 0)
        transaction_count = int(aggregates['transaction_count'] or 0)
        avg_unit_price = total_revenue / total_quantity if total_quantity > 0 else 0.0

        # Determine date range of current query
        if start_date and end_date:
            duration = end_date - start_date + datetime.timedelta(days=1)
            prev_end = start_date - datetime.timedelta(days=1)
            prev_start = prev_end - duration + datetime.timedelta(days=1)
        else:
            # If dates are not provided, find the min/max dates in queryset
            min_max = queryset.aggregate(min_d=models.Min('date'), max_d=models.Max('date'))
            min_d = min_max['min_d']
            max_d = min_max['max_d']
            if min_d and max_d:
                duration = max_d - min_d + datetime.timedelta(days=1)
                prev_end = min_d - datetime.timedelta(days=1)
                prev_start = prev_end - duration + datetime.timedelta(days=1)
            else:
                duration = datetime.timedelta(days=30)
                prev_end = datetime.date.today() - duration
                prev_start = prev_end - duration

        # Fetch previous period data
        prev_queryset = SalesRecord.objects.filter(
            business=business,
            date__gte=prev_start,
            date__lte=prev_end
        )
        prev_aggregates = prev_queryset.aggregate(
            total_revenue=Sum('revenue'),
            total_quantity=Sum('quantity')
        )
        prev_revenue = float(prev_aggregates['total_revenue'] or 0.0)
        prev_quantity = int(prev_aggregates['total_quantity'] or 0)

        # Compute growth percentage
        if prev_revenue > 0:
            revenue_growth_pct = ((total_revenue - prev_revenue) / prev_revenue) * 100.0
        else:
            revenue_growth_pct = 100.0 if total_revenue > 0 else 0.0

        if prev_quantity > 0:
            quantity_growth_pct = ((total_quantity - prev_quantity) / prev_quantity) * 100.0
        else:
            quantity_growth_pct = 100.0 if total_quantity > 0 else 0.0

        return {
            'total_revenue': round(total_revenue, 2),
            'total_quantity': total_quantity,
            'average_unit_price': round(avg_unit_price, 2),
            'transaction_count': transaction_count,
            'previous_revenue': round(prev_revenue, 2),
            'previous_quantity': prev_quantity,
            'revenue_growth_pct': round(revenue_growth_pct, 2),
            'quantity_growth_pct': round(quantity_growth_pct, 2)
        }

    @classmethod
    def analyze_sales_trends(cls, business, start_date=None, end_date=None, interval='daily'):
        start_date = cls.parse_date(start_date)
        end_date = cls.parse_date(end_date)

        queryset = SalesRecord.objects.filter(business=business)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        if not queryset.exists():
            return []

        # Load data to pandas DataFrame
        records = list(queryset.values('date', 'revenue', 'quantity'))
        df = pd.DataFrame(records)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')

        # Determine time range bounds for padding/reindexing
        min_date = start_date or df.index.min().date()
        max_date = end_date or df.index.max().date()

        # Resample by interval
        if interval == 'daily':
            idx = pd.date_range(min_date, max_date, freq='D')
            df_resampled = df.resample('D').sum().reindex(idx, fill_value=0)
            df_resampled.index.name = 'date'
            df_resampled = df_resampled.reset_index()
            df_resampled['date'] = df_resampled['date'].dt.strftime('%Y-%m-%d')

        elif interval == 'weekly':
            # Align weekly bounds to Sunday-based ranges to guarantee coverage and non-empty range
            start_sun = pd.to_datetime(min_date) - pd.to_timedelta((pd.to_datetime(min_date).dayofweek - 6) % 7, unit='D')
            end_sun = pd.to_datetime(max_date) + pd.to_timedelta((6 - pd.to_datetime(max_date).dayofweek) % 7, unit='D')
            idx = pd.date_range(start_sun, end_sun, freq='W')
            df_resampled = df.resample('W').sum().reindex(idx, fill_value=0)
            df_resampled.index.name = 'date'
            df_resampled = df_resampled.reset_index()
            df_resampled['date'] = df_resampled['date'].dt.strftime('%Y-%m-%d')

        elif interval == 'monthly':
            # Align monthly bounds to Month Start ranges to guarantee coverage and non-empty range
            start_ms = pd.to_datetime(min_date).replace(day=1)
            end_ms = pd.to_datetime(max_date).replace(day=1)
            idx = pd.date_range(start_ms, end_ms, freq='MS')
            df_resampled = df.resample('MS').sum().reindex(idx, fill_value=0)
            df_resampled.index.name = 'date'
            df_resampled = df_resampled.reset_index()
            df_resampled['date'] = df_resampled['date'].dt.strftime('%Y-%m')

        else:
            raise ValueError(f"Invalid interval: {interval}. Must be 'daily', 'weekly', or 'monthly'.")

        # Convert DataFrame to list of dictionaries
        trends = []
        for _, row in df_resampled.iterrows():
            trends.append({
                'date': row['date'],
                'revenue': round(float(row['revenue']), 2),
                'quantity': int(row['quantity'])
            })

        return trends

    @classmethod
    def calculate_product_performance(cls, business, start_date=None, end_date=None, limit=10):
        start_date = cls.parse_date(start_date)
        end_date = cls.parse_date(end_date)

        queryset = SalesRecord.objects.filter(business=business)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        total_revenue = float(queryset.aggregate(total=Sum('revenue'))['total'] or 0.0)

        # Group by product
        performance = queryset.values(
            'product_id',
            'product__name',
            'product__sku'
        ).annotate(
            total_revenue=Sum('revenue'),
            total_quantity=Sum('quantity')
        ).order_by('-total_revenue')[:limit]

        results = []
        for item in performance:
            rev = float(item['total_revenue'] or 0.0)
            qty = int(item['total_quantity'] or 0)
            share = (rev / total_revenue) * 100.0 if total_revenue > 0 else 0.0
            avg_price = rev / qty if qty > 0 else 0.0
            results.append({
                'product_id': item['product_id'],
                'product_name': item['product__name'],
                'product_sku': item['product__sku'],
                'total_revenue': round(rev, 2),
                'total_quantity': qty,
                'average_unit_price': round(avg_price, 2),
                'revenue_share_pct': round(share, 2)
            })

        return results

    @classmethod
    def analyze_seasonal_patterns(cls, business):
        queryset = SalesRecord.objects.filter(business=business)

        if not queryset.exists():
            return {
                'monthly': [],
                'weekly': [],
                'quarterly': []
            }

        records = list(queryset.values('date', 'revenue', 'quantity'))
        df = pd.DataFrame(records)
        df['date'] = pd.to_datetime(df['date'])
        df['revenue'] = df['revenue'].astype(float)
        df['quantity'] = df['quantity'].astype(int)

        total_revenue = df['revenue'].sum()

        # 1. Monthly Seasonality (1-12)
        monthly_group = df.groupby(df['date'].dt.month)[['revenue', 'quantity']].sum()
        month_names = {
            1: 'January', 2: 'February', 3: 'March', 4: 'April',
            5: 'May', 6: 'June', 7: 'July', 8: 'August',
            9: 'September', 10: 'October', 11: 'November', 12: 'December'
        }
        monthly_data = []
        for m_num in range(1, 13):
            m_name = month_names[m_num]
            rev = float(monthly_group.loc[m_num, 'revenue']) if m_num in monthly_group.index else 0.0
            qty = int(monthly_group.loc[m_num, 'quantity']) if m_num in monthly_group.index else 0
            pct = (rev / total_revenue) * 100.0 if total_revenue > 0 else 0.0
            monthly_data.append({
                'month': m_name,
                'revenue': round(rev, 2),
                'quantity': qty,
                'percentage': round(pct, 2)
            })

        # 2. Weekly Seasonality (0=Monday, 6=Sunday)
        weekly_group = df.groupby(df['date'].dt.dayofweek)[['revenue', 'quantity']].sum()
        day_names = {
            0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday',
            4: 'Friday', 5: 'Saturday', 6: 'Sunday'
        }
        weekly_data = []
        for d_num in range(7):
            d_name = day_names[d_num]
            rev = float(weekly_group.loc[d_num, 'revenue']) if d_num in weekly_group.index else 0.0
            qty = int(weekly_group.loc[d_num, 'quantity']) if d_num in weekly_group.index else 0
            pct = (rev / total_revenue) * 100.0 if total_revenue > 0 else 0.0
            weekly_data.append({
                'day': d_name,
                'revenue': round(rev, 2),
                'quantity': qty,
                'percentage': round(pct, 2)
            })

        # 3. Quarterly Seasonality (1-4)
        quarterly_group = df.groupby(df['date'].dt.quarter)[['revenue', 'quantity']].sum()
        quarterly_data = []
        for q_num in range(1, 5):
            q_name = f'Q{q_num}'
            rev = float(quarterly_group.loc[q_num, 'revenue']) if q_num in quarterly_group.index else 0.0
            qty = int(quarterly_group.loc[q_num, 'quantity']) if q_num in quarterly_group.index else 0
            pct = (rev / total_revenue) * 100.0 if total_revenue > 0 else 0.0
            quarterly_data.append({
                'quarter': q_name,
                'revenue': round(rev, 2),
                'quantity': qty,
                'percentage': round(pct, 2)
            })

        return {
            'monthly': monthly_data,
            'weekly': weekly_data,
            'quarterly': quarterly_data
        }
