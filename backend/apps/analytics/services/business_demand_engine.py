"""Business-specific signals layered on top of independent market signals."""
import datetime

from django.db.models import Sum

from analytics.models import InventorySnapshot, SalesRecord
from products.models import Product
from analytics.services.trend_business_rules import TrendBusinessRulesService


class BusinessDemandEngine:
    SALES_WINDOW_DAYS = 30

    def __init__(self, rules_service=None):
        self.rules = rules_service or TrendBusinessRulesService()

    def analyze(self, business, keyword, market_metrics):
        product = Product.objects.filter(business=business, name__iexact=keyword).first()
        if not product:
            return self.rules.build_market_insight(keyword, market_metrics)

        sales = self._sales_signal(business, product)
        inventory = self._inventory_signal(business, product, sales)
        return self.rules.build_business_insight(keyword, market_metrics, sales, inventory)

    def _sales_signal(self, business, product):
        records = SalesRecord.objects.filter(business=business, product=product).order_by('date')
        if not records.exists():
            return {'available': False}
        dates = list(records.values_list('date', flat=True))
        latest = dates[-1]
        history_days = (latest - dates[0]).days + 1
        if history_days < 14:
            return {'available': False, 'history_days': history_days, 'reason': 'less_than_14_days'}
        if history_days >= 60:
            current_start = latest - datetime.timedelta(days=29)
            previous_end = current_start - datetime.timedelta(days=1)
            previous_start = previous_end - datetime.timedelta(days=29)
            confidence = 'full'
        else:
            # An explicitly labelled early signal, never presented as 30 vs 30.
            midpoint = dates[0] + datetime.timedelta(days=(history_days // 2) - 1)
            previous_start, previous_end = dates[0], midpoint
            current_start, latest = midpoint + datetime.timedelta(days=1), latest
            confidence = 'early'
        current = records.filter(date__gte=current_start, date__lte=latest).aggregate(total=Sum('quantity'))['total'] or 0
        previous = records.filter(date__gte=previous_start, date__lte=previous_end).aggregate(total=Sum('quantity'))['total'] or 0
        pct = ((current - previous) / previous * 100.0) if previous else 0.0
        return {
            'available': True, 'percentage_change': round(float(pct), 2),
            'direction': self.rules.determine_trend_direction(pct),
            'history_days': history_days, 'confidence': confidence,
            'current_quantity': int(current), 'average_daily_sales': round(float(current) / self.SALES_WINDOW_DAYS, 2),
        }

    def _inventory_signal(self, business, product, sales):
        snapshots = InventorySnapshot.objects.filter(business=business, product=product).order_by('date')
        if not snapshots.exists():
            return {'available': False}
        first, latest = snapshots.first(), snapshots.last()
        pct = ((latest.quantity_on_hand - first.quantity_on_hand) / first.quantity_on_hand * 100.0) if first.quantity_on_hand else 0.0
        coverage = None
        if sales.get('available') and sales['average_daily_sales'] > 0:
            coverage = round(latest.quantity_on_hand / sales['average_daily_sales'], 1)
        return {'available': True, 'percentage_change': round(float(pct), 2),
                'direction': self.rules.determine_trend_direction(pct),
                'quantity_on_hand': latest.quantity_on_hand, 'stock_coverage_days': coverage}
