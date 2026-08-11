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
    HIGH_DEMAND_THRESHOLD = 60.0       # sustained absolute interest score that flags high demand

    def generate_insights(self, business) -> List[dict]:
        """Return a list of insight dicts derived from real data for ``business``."""
        insights: List[dict] = []

        revenue = self._analyze_revenue_trend(business)
        if revenue:
            insights.append(revenue)

        competitor = self._analyze_competitor_prices(business)
        insights.extend(competitor)

        demand = self._analyze_market_demand(business)
        insights.extend(demand)

        inventory = self._analyze_inventory_risk(business)
        insights.extend(inventory)

        return insights

    # ------------------------------------------------------------------ #
    # 1. Revenue trend
    # ------------------------------------------------------------------ #
    def _analyze_revenue_trend(self, business) -> Optional[dict]:
        from analytics.models import SalesRecord

        latest_date_result = SalesRecord.objects.filter(
            business=business
        ).aggregate(latest_date=Max('date'))
        latest_date = latest_date_result.get('latest_date')
        if not latest_date:
            return None

        recent_end = latest_date
        recent_start = recent_end - timedelta(days=29)
        previous_end = recent_start - timedelta(days=1)
        previous_start = previous_end - timedelta(days=29)

        recent = float(SalesRecord.objects.filter(
            business=business, date__gte=recent_start, date__lte=recent_end
        ).aggregate(total=Sum('revenue'))['total'] or 0)

        previous = float(SalesRecord.objects.filter(
            business=business, date__gte=previous_start, date__lte=previous_end
        ).aggregate(total=Sum('revenue'))['total'] or 0)

        if previous > 0:
            change_pct = ((recent - previous) / previous) * 100.0
        else:
            change_pct = 0.0 if recent == 0 else 100.0

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
    def _analyze_competitor_prices(self, business) -> List[dict]:
        from integrations.models import CompetitorPrice

        competitor_prices = CompetitorPrice.objects.filter(business=business)
        if not competitor_prices.exists():
            return []

        rows = (
            competitor_prices
            .values('product_id', 'product__name', 'product__price')
            .annotate(avg_competitor_price=Avg('price'))
        )

        insights: List[dict] = []
        for row in rows:
            our_price = float(row['product__price'] or 0)
            avg_competitor_price = float(row['avg_competitor_price'] or 0)
            if our_price > 0 and avg_competitor_price > 0:
                difference_pct = ((our_price - avg_competitor_price) / avg_competitor_price) * 100
                if difference_pct > 5:
                    name = row['product__name'] or 'Unknown product'
                    insights.append({
                        'business': business,
                        'insight_type': 'competitor_price_lower',
                        'severity': 'medium',
                        'title': f'Higher Price Than Competitors: {name}',
                        'description': (
                            'Problem: This product is currently priced '
                            'higher than the average observed competitor price.\n\n'
                            'Recommendation: Review pricing and determine whether '
                            'the higher price is justified by product quality, brand '
                            'positioning, pack size, shipping, or other value-added benefits.'
                        ),
                    })

        return insights

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

        keywords = list(dict.fromkeys(trends.values_list('keyword', flat=True)))
        growing = []
        declining = []
        high_demand = []
        from analytics.services.trend_insight_engine import TrendInsightEngine
        trend_engine = TrendInsightEngine()
        for keyword in keywords:
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
            elif metrics['trend_score'] >= self.HIGH_DEMAND_THRESHOLD:
                high_demand.append({'keyword': keyword, 'score': metrics['trend_score']})

        insights: List[dict] = []

        for item in growing:
            insights.append({
                'business': business,
                'insight_type': 'growing_demand',
                'severity': 'medium' if item['change'] > 40 else 'low',
                'title': f'Rising Market Interest for {item["keyword"]}',
                'description': (
                    f"Problem: Google Trends indicates a {item['change']:.1f}% increase "
                    f"in relative search interest for {item['keyword']}.\n\n"
                    "Recommendation: Monitor this keyword as a potential market opportunity."
                ),
            })

        for item in declining:
            insights.append({
                'business': business,
                'insight_type': 'declining_demand',
                'severity': 'medium' if item['change'] < -20 else 'low',
                'title': f'Declining Market Interest for {item["keyword"]}',
                'description': (
                    f"Problem: Google Trends indicates a {abs(item['change']):.1f}% decrease "
                    f"in relative search interest for {item['keyword']}.\n\n"
                    "Recommendation: Continue monitoring market interest alongside business-specific signals."
                ),
            })

        for item in high_demand:
            insights.append({
                'business': business,
                'insight_type': 'high_demand',
                'severity': 'low',
                'title': f'Sustained High Market Interest for {item["keyword"]}',
                'description': (
                    'Problem: This tracked search term shows consistently '
                    'high market interest and strong consumer demand.\n\n'
                    'Recommendation: Ensure adequate stock and consider prioritising '
                    'this product in promotions, as sustained search interest often '
                    'precedes increased sales.'
                ),
            })

        return insights

    # ------------------------------------------------------------------ #
    # 4. Inventory risk
    # ------------------------------------------------------------------ #
    def _analyze_inventory_risk(self, business) -> List[dict]:
        from analytics.models import InventorySnapshot

        snapshots = InventorySnapshot.objects.filter(business=business)
        if not snapshots.exists():
            return []

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
            return []

        insights: List[dict] = []
        for item in at_risk:
            if item['quantity'] == 0:
                severity = 'high'
                problem = 'This product is completely out of stock'
            else:
                severity = 'medium'
                problem = (
                    f"This product has {item['quantity']} units on hand, "
                    f"which is below the reorder threshold of {item['reorder_point']}"
                )

            insights.append({
                'business': business,
                'insight_type': 'inventory_risk',
                'severity': severity,
                'title': f'Inventory Stockout Risk: {item["name"]}',
                'description': (
                    f"Problem: {problem}.\n\n"
                    "Recommendation: Reorder this item immediately and consider "
                    "adjusting the reorder point upwards to prevent future stockouts."
                ),
            })

        return insights
