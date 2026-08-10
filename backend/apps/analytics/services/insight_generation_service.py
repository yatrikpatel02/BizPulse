"""
Real-data insight generation for the analytics.Insight model.

This replaces the previous hard-coded "default" insights with insights derived
from actual business data:

    * revenue trend  -> from analytics.SalesRecord
    * competitor pricing -> from integrations.CompetitorPrice
    * market demand  -> from integrations.GoogleTrendsData
    * inventory risk -> from analytics.InventorySnapshot

Each generator returns ``None`` when there is no underlying data (or the signal
is unremarkable), so the insights table is only ever populated with findings the
data actually supports.
"""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import List, Optional

from django.db.models import Avg, Max, Sum
from django.utils import timezone

logger = logging.getLogger(__name__)


class InsightGenerationService:
    """Build real, data-backed Insight payloads for a business."""

    REVENUE_DECLINE_THRESHOLD = -10.0   # % change that flags a revenue decline
    DEMAND_GROWTH_THRESHOLD = 5.0      # % change that flags growing demand
    DEMAND_DECLINE_THRESHOLD = -5.0    # % change that flags declining demand
    COMPETITOR_SPREAD_THRESHOLD = 15.0  # % gap that flags a competitor price gap

    def generate_insights(self, business) -> List[dict]:
        """Return a list of insight dicts derived from real data for ``business``."""
        insights: List[dict] = []

        revenue = self._analyze_revenue_trend(business)
        if revenue:
            insights.append(revenue)

        competitor = self._analyze_competitor_prices(business)
        if competitor:
            insights.append(competitor)

        demand = self._analyze_market_demand(business)
        insights.extend(demand)

        inventory = self._analyze_inventory_risk(business)
        if inventory:
            insights.append(inventory)

        return insights

    # ------------------------------------------------------------------ #
    # 1. Revenue trend
    # ------------------------------------------------------------------ #
    def _analyze_revenue_trend(self, business) -> Optional[dict]:
        from analytics.models import SalesRecord

        if not SalesRecord.objects.filter(business=business).exists():
            return None

        today = timezone.now().date()
        recent_start = today - timedelta(days=30)
        prev_start = recent_start - timedelta(days=30)
        prev_end = recent_start - timedelta(days=1)

        recent = float(SalesRecord.objects.filter(
            business=business, date__gte=recent_start, date__lte=today
        ).aggregate(total=Sum('revenue'))['total'] or 0)

        previous = float(SalesRecord.objects.filter(
            business=business, date__gte=prev_start, date__lte=prev_end
        ).aggregate(total=Sum('revenue'))['total'] or 0)

        if previous > 0:
            change_pct = ((recent - previous) / previous) * 100.0
        else:
            change_pct = 0.0 if recent == 0 else 100.0

        # Only flag a clear, material decline.
        if change_pct >= self.REVENUE_DECLINE_THRESHOLD:
            return None

        drop = abs(change_pct)
        return {
            'business': business,
            'insight_type': 'revenue_declining',
            'severity': 'high',
            'title': 'Revenue Declining Trend Detected',
            'description': (
                f"Problem: Total business revenue decreased by {drop:.1f}% "
                f"compared to the previous 30-day period.\n\n"
                f"Reason: Recent 30-day revenue was {recent:,.2f} vs "
                f"{previous:,.2f} in the prior period.\n\n"
                "Recommendation: Consider launching targeted promotional bundles "
                "and run a re-engagement email campaign for top customers."
            ),
        }

    # ------------------------------------------------------------------ #
    # 2. Competitor pricing
    # ------------------------------------------------------------------ #
    def _analyze_competitor_prices(self, business) -> Optional[dict]:
        from integrations.models import CompetitorPrice

        competitor_prices = CompetitorPrice.objects.filter(business=business)
        if not competitor_prices.exists():
            return None

        rows = (
            competitor_prices
            .values('product_id', 'product__name', 'product__price')
            .annotate(avg_competitor_price=Avg('price'))
        )

        pricier_products = []
        for row in rows:
            our_price = float(row['product__price'] or 0)
            avg_competitor_price = float(row['avg_competitor_price'] or 0)
            if our_price > 0 and avg_competitor_price > 0:
                difference_pct = ((our_price - avg_competitor_price) / avg_competitor_price) * 100
                if difference_pct > 5:
                    pricier_products.append(row['product__name'] or 'Unknown product')

        if not pricier_products:
            return None

        names = '\n'.join(pricier_products)

        return {
            'business': business,
            'insight_type': 'competitor_price_lower',
            'severity': 'medium',
            'title': 'Products With Higher Prices',
            'description': (
                'Problem: The following products are currently priced '
                'higher than the average observed competitor price:\n'
                f'{names}\n\n'
                'Recommendation: Review pricing for these products and '
                'determine whether the higher price is justified by product '
                'quality, brand positioning, pack size, shipping, or other '
                'value-added benefits.'
            ),
        }

    # ------------------------------------------------------------------ #
    # 3. Market demand (Google Trends)
    # ------------------------------------------------------------------ #
    def _analyze_market_demand(self, business) -> List[dict]:
        from integrations.models import GoogleTrendsData

        recent_cutoff = timezone.now().date() - timedelta(days=90)
        trends = GoogleTrendsData.objects.filter(
            business=business, date__gte=recent_cutoff
        )
        if not trends.exists():
            return []

        growing = []
        declining = []
        from analytics.services.trend_insight_engine import TrendInsightEngine
        trend_engine = TrendInsightEngine()
        for keyword in trends.values_list('keyword', flat=True).distinct():
            series = list(
                trends.filter(keyword=keyword).order_by('date')
                .values('date', 'interest_score')
            )
            if len(series) < 28:
                continue
            metrics = trend_engine.calculate_metrics([
                {'date': row['date'], 'interest': row['interest_score']} for row in series
            ])
            if metrics['data_points_last_14_days'] < 14 or metrics['data_points_previous_14_days'] < 14:
                continue
            change = metrics['percentage_change']
            if change >= self.DEMAND_GROWTH_THRESHOLD:
                growing.append({'keyword': keyword, 'change': change})
            elif change <= self.DEMAND_DECLINE_THRESHOLD:
                declining.append({'keyword': keyword, 'change': change})

        insights: List[dict] = []

        if growing:
            avg_change = sum(g['change'] for g in growing) / len(growing)
            names = ', '.join(dict.fromkeys(g['keyword'] for g in growing[:3]))
            extra = ' (and others)' if len(growing) > 3 else ''
            if avg_change > 40:
                severity = 'medium'
            else:
                severity = 'low'

            insights.append({
                'business': business,
                'insight_type': 'growing_demand',
                'severity': severity,
                'title': f'Rising Market Interest for {names}{extra}',
                'description': (
                    f"Problem: Google Trends indicates a {avg_change:.1f}% increase "
                    f"in relative search interest for {names}{extra}.\n\n"
                    f"Reason: Relative search interest rose across {len(growing)} tracked "
                    f"keyword(s) over the last 90 days.\n\n"
                    "Recommendation: Monitor these keywords as potential market opportunities."
                ),
            })

        if declining:
            avg_change = sum(d['change'] for d in declining) / len(declining)
            names = ', '.join(dict.fromkeys(d['keyword'] for d in declining[:3]))
            extra = ' (and others)' if len(declining) > 3 else ''
            severity = 'medium' if avg_change < -20 else 'low'

            insights.append({
                'business': business,
                'insight_type': 'declining_demand',
                'severity': severity,
                'title': f'Declining Market Interest for {names}{extra}',
                'description': (
                    f"Problem: Google Trends indicates a {abs(avg_change):.1f}% decrease "
                    f"in relative search interest for {names}{extra}.\n\n"
                    f"Reason: Relative search interest fell across {len(declining)} tracked "
                    f"keyword(s) over the last 90 days.\n\n"
                    "Recommendation: Continue monitoring market interest alongside business-specific signals."
                ),
            })

        return insights

    # ------------------------------------------------------------------ #
    # 4. Inventory risk
    # ------------------------------------------------------------------ #
    def _analyze_inventory_risk(self, business) -> Optional[dict]:
        from analytics.models import InventorySnapshot

        snapshots = InventorySnapshot.objects.filter(business=business)
        if not snapshots.exists():
            return None

        latest = snapshots.values('product').annotate(latest_date=Max('date'))
        at_risk = []
        for entry in latest:
            snap = snapshots.filter(
                product_id=entry['product'], date=entry['latest_date']
            ).select_related('product').first()
            if not snap:
                continue
            reorder = snap.reorder_point or 0
            if snap.quantity_on_hand == 0 or snap.quantity_on_hand < reorder:
                at_risk.append({
                    'name': snap.product.name,
                    'quantity': snap.quantity_on_hand,
                    'reorder_point': reorder,
                })

        if not at_risk:
            return None

        out_of_stock = sum(1 for item in at_risk if item['quantity'] == 0)
        below = len(at_risk) - out_of_stock

        parts = []
        if out_of_stock:
            parts.append(f"{out_of_stock} product(s) completely out of stock")
        if below:
            parts.append(f"{below} product(s) below reorder threshold")
        problem = ' and '.join(parts)
        products = '; '.join(
            f"{item['name']} ({item['quantity']} on hand, reorder point {item['reorder_point']})"
            for item in at_risk
        )

        if out_of_stock >= 3 or len(at_risk) > 5:
            severity = 'high'
        else:
            severity = 'medium'

        return {
            'business': business,
            'insight_type': 'inventory_risk',
            'severity': severity,
            'title': 'Critical Inventory Stockout Risk',
            'description': (
                f"Problem: {problem}.\n\n"
                f"Reason: {len(at_risk)} SKU(s) are at stockout risk based on the "
                f"latest inventory snapshots.\n\n"
                f"Affected products: {products}.\n\n"
                "Recommendation: Immediately reorder at-risk items, adjust baseline "
                "reorder points upwards, and establish alternative distributor agreements."
            ),
        }
