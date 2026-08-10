from __future__ import annotations

from typing import Any, Dict, List, Optional


class TrendBusinessRulesService:
    """Configurable, data-driven business rules for trend insights.

    The rules are defined declaratively (thresholds are plain numbers, the
    output text and recommended actions are plain data). To change a rule —
    its threshold, tone, or suggested actions — only the constants/rules below
    need editing. Neither the PyTrends data collection nor the metric
    calculation logic has to change.
    """

    STABLE_THRESHOLD = 5.0
    OPPORTUNITY_THRESHOLD = 20.0

    TREND_DIRECTION_BANDS = ('Growing', 'Stable', 'Declining')
    INSIGHT_TYPES = ('Opportunity', 'Positive Trend', 'Stable', 'Warning', 'Risk')

    TREND_INSIGHT_RULES: List[Dict[str, Any]] = [
        {
            'insight_type': 'Opportunity',
            'min_change': OPPORTUNITY_THRESHOLD,
            'strict_min': True,
            'max_change': None,
            'title': 'Strongly Increasing Market Interest',
            'description': (
                'Relative search interest is increasing rapidly.'
            ),
            'recommended_actions': [
                'Increase inventory levels ahead of peak demand',
                'Launch targeted marketing campaigns to capture demand',
                'Scale up acquisition and bidding for high-intent traffic',
                'Explore related keyword segments to expand reach',
            ],
        },
        {
            'insight_type': 'Positive Trend',
            'min_change': STABLE_THRESHOLD,
            'strict_min': True,
            'max_change': OPPORTUNITY_THRESHOLD,
            'title': 'Increasing Market Interest',
            'description': (
                'Relative search interest is increasing.'
            ),
            'recommended_actions': [
                'Monitor inventory turnover and lead times',
                'Review advertising performance and ROAS',
                'Capture early market share with promotional pricing',
                'Plan incremental stock replenishment',
            ],
        },
        {
            'insight_type': 'Stable',
            'min_change': -STABLE_THRESHOLD,
            'strict_min': False,
            'max_change': STABLE_THRESHOLD,
            'title': 'Stable Market Interest',
            'description': (
                'Relative search interest is stable.'
            ),
            'recommended_actions': [
                'Maintain current inventory levels',
                'Keep marketing spend flat and optimise for efficiency',
                'Watch for early change signals in search demand',
                'Reassess next cycle when new data is available',
            ],
        },
        {
            'insight_type': 'Warning',
            'min_change': -OPPORTUNITY_THRESHOLD,
            'strict_min': False,
            'max_change': -STABLE_THRESHOLD,
            'strict_max': True,
            'title': 'Declining Market Interest',
            'description': (
                'Relative search interest is declining.'
            ),
            'recommended_actions': [
                'Reduce discretionary marketing spend',
                'Monitor sales and inventory closely',
                'Prepare promotional pricing to stabilise demand',
                'Validate the trend against additional data sources',
            ],
        },
        {
            'insight_type': 'Risk',
            'min_change': None,
            'max_change': -OPPORTUNITY_THRESHOLD,
            'strict_max': True,
            'title': 'Strongly Decreasing Market Interest',
            'description': (
                'Relative search interest has decreased significantly.'
            ),
            'recommended_actions': [
                'Discount excess inventory proactively',
                'Review the product strategy and positioning',
                'Cut underperforming ad spend immediately',
                'Consider sunsetting low-performing products',
            ],
        },
    ]

    def determine_trend_direction(self, percentage_change: float) -> str:
        """Map a percentage change to a coarse trend direction."""
        if percentage_change > self.STABLE_THRESHOLD:
            return 'Growing'
        if percentage_change < -self.STABLE_THRESHOLD:
            return 'Declining'
        return 'Stable'

    def classify(
        self,
        percentage_change: float,
        volatility_score: float = 0.0,
        trend_score: float = 0.0,
    ) -> Dict[str, Any]:
        """Return the insight rule that matches the given percentage change.

        Returns a dict with keys: ``insight_type``, ``title``,
        ``description`` and ``recommended_actions``.
        """
        for rule in self.TREND_INSIGHT_RULES:
            if self._matches(percentage_change, rule):
                return {
                    'insight_type': rule['insight_type'],
                    'title': rule['title'],
                    'description': rule['description'],
                    'recommended_actions': list(rule['recommended_actions']),
                }
        return None

    def build_market_insight(self, keyword: str, market: Dict[str, Any]) -> Dict[str, Any]:
        """Make an evidence-bounded insight for a keyword not sold by the business."""
        if market.get('insight_type') == 'Insufficient Data':
            return {}
        change = market['percentage_change']
        direction = market['trend_direction']
        if direction == 'Growing':
            title = 'Rising Market Interest'
            action = 'Consider monitoring this product as a potential market opportunity.'
        elif direction == 'Declining':
            title = 'Declining Consumer Interest'
            action = None
        else:
            title = 'Stable Market Interest'
            action = 'Continue monitoring relative search interest for meaningful changes.'
        description = (
            f'Relative search interest for {keyword} {"increased" if change >= 0 else "decreased"} '
            f'by {abs(change):.1f}% over the previous 14-day period.'
        )
        return {'title': title, 'description': description,
                'recommended_actions': [action] if action else [],
                'intelligence_type': 'market'}

    def build_business_insight(self, keyword, market, sales, inventory) -> Dict[str, Any]:
        """Combine only signals that exist; market-only remains a valid result."""
        market_only = self.build_market_insight(keyword, market)
        if not sales.get('available'):
            return market_only
        growing = market['trend_direction'] == 'Growing'
        sales_direction = sales['direction']
        inventory_direction = inventory.get('direction') if inventory.get('available') else None
        if growing and sales_direction == 'Growing' and inventory_direction == 'Declining':
            return {'title': 'High Demand & Stock Risk', 'intelligence_type': 'business',
                    'description': 'Consumer search interest and sales are increasing while inventory is declining.',
                    'recommended_actions': ['Consider replenishing inventory to avoid potential stockouts.']}
        if growing and sales_direction == 'Growing':
            return {'title': 'Growing Product Momentum', 'intelligence_type': 'business',
                    'description': 'Consumer search interest and sales are increasing, indicating positive momentum for this product.',
                    'recommended_actions': ['Monitor stock coverage and maintain availability.']}
        if growing and sales_direction == 'Declining' and inventory_direction == 'Declining':
            return {'title': 'Potential Stock Constraint', 'intelligence_type': 'business',
                    'description': 'Consumer interest is increasing while sales and inventory are declining. Reduced inventory may be limiting conversion.',
                    'recommended_actions': ['Review inventory availability before judging product demand.']}
        if growing and sales_direction == 'Declining':
            return {'title': 'Low Conversion Signal', 'intelligence_type': 'business',
                    'description': 'Consumer search interest is increasing, but sales are declining.',
                    'recommended_actions': ['Review pricing, availability, product positioning, and customer feedback.']}
        if market['trend_direction'] == 'Declining' and sales_direction == 'Declining' and inventory_direction == 'Growing':
            return {'title': 'Declining Demand / Overstock Risk', 'intelligence_type': 'business',
                    'description': 'Consumer interest and sales are declining while inventory remains elevated.',
                    'recommended_actions': ['Review inventory levels and promotional strategies.']}
        return market_only

    @staticmethod
    def _matches(pct: float, rule: Dict[str, Any]) -> bool:
        min_change: Optional[float] = rule.get('min_change')
        max_change: Optional[float] = rule.get('max_change')

        lower_ok = True
        if min_change is not None:
            if rule.get('strict_min'):
                lower_ok = pct > min_change
            else:
                lower_ok = pct >= min_change

        upper_ok = True
        if max_change is not None:
            if rule.get('strict_max'):
                upper_ok = pct < max_change
            else:
                upper_ok = pct <= max_change

        return lower_ok and upper_ok
