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
            'title': 'Rapid Search Demand Increase',
            'description': (
                'Search demand is increasing rapidly. Consider increasing '
                'inventory and launching marketing campaigns.'
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
            'title': 'Steady Demand Growth',
            'description': (
                'Demand is steadily growing. Monitor inventory and '
                'advertising performance.'
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
            'title': 'Stable Market Demand',
            'description': (
                'Demand is stable. Maintain current inventory levels.'
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
            'title': 'Declining Search Demand',
            'description': (
                'Search demand is declining. Reduce marketing spend and '
                'monitor sales.'
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
            'title': 'Significant Demand Drop',
            'description': (
                'Demand has dropped significantly. Consider discounting '
                'excess inventory or reviewing product strategy.'
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
