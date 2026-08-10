from __future__ import annotations

import datetime
import statistics
from typing import Any, Dict, List, Optional, Union

from django.utils import timezone

from integrations.services.google_trends_service import GoogleTrendsService
from analytics.services.trend_business_rules import TrendBusinessRulesService

Point = Dict[str, Any]


class TrendInsightEngine:
    """Compute trend metrics from Google Trends *data already in the database*
    and turn them into actionable insights using the business rules service.

    ``growth_percentage`` / ``trend_direction`` / ``recommendation`` are never
    persisted — they are derived on the fly from ``interest_score`` rows stored
    in the ``GoogleTrendsData`` table.
    """

    CURRENT_WINDOW_DAYS = 30
    PREVIOUS_WINDOW_DAYS = 30

    def __init__(
        self,
        data_service: Optional[GoogleTrendsService] = None,
        rules_service: Optional[TrendBusinessRulesService] = None,
    ):
        self.data_service = data_service or GoogleTrendsService()
        self.rules = rules_service or TrendBusinessRulesService()

    def calculate_metrics(self, timeseries: List[Point]) -> Dict[str, Any]:
        """Compute all trend metrics from a raw interest-over-time series.

        Pure-Python (no Pandas dependency) so it is trivially unit-testable.
        Returns ``trend_score``, ``percentage_change``, ``trend_direction``,
        ``volatility_score`` plus diagnostic context.
        """
        points = self._normalize_series(timeseries)
        if not points:
            return self._empty_metrics()

        latest_date = points[-1]['date']
        current_start = latest_date - datetime.timedelta(days=self.CURRENT_WINDOW_DAYS - 1)
        previous_end = latest_date - datetime.timedelta(days=self.CURRENT_WINDOW_DAYS)
        previous_start = previous_end - datetime.timedelta(days=self.PREVIOUS_WINDOW_DAYS - 1)

        current = [p for p in points if current_start <= p['date'] <= latest_date]
        previous = [p for p in points if previous_start <= p['date'] <= previous_end]

        current_values = [p['interest'] for p in current]
        previous_values = [p['interest'] for p in previous]

        trend_score = round(statistics.mean(current_values), 2) if current_values else 0.0
        current_avg = statistics.mean(current_values) if current_values else 0.0
        previous_avg = statistics.mean(previous_values) if previous_values else 0.0

        percentage_change = self._percentage_change(current_avg, previous_avg)
        volatility_score = self._volatility_score(current_values)
        trend_direction = self.rules.determine_trend_direction(percentage_change)

        return {
            'trend_score': trend_score,
            'percentage_change': round(percentage_change, 2),
            'trend_direction': trend_direction,
            'volatility_score': volatility_score,
            'current_period_avg': round(current_avg, 2),
            'previous_period_avg': round(previous_avg, 2),
            'data_points_last_30_days': len(current_values),
            'data_points_previous_30_days': len(previous_values),
            'latest_date': latest_date.isoformat(),
        }

    def analyze_timeseries(self, keyword: str, timeseries: List[Point]) -> Dict[str, Any]:
        """Produce a full insight payload for a single keyword's time series."""
        metrics = self.calculate_metrics(timeseries)
        classification = self.rules.classify(
            percentage_change=metrics['percentage_change'],
            volatility_score=metrics['volatility_score'],
            trend_score=metrics['trend_score'],
        )
        confidence = self._confidence_score(metrics, has_baseline=bool(metrics['data_points_previous_30_days']))

        payload: Dict[str, Any] = {
            'keyword': keyword,
            'trend_score': metrics['trend_score'],
            'percentage_change': metrics['percentage_change'],
            'trend_direction': metrics['trend_direction'],
            'volatility_score': metrics['volatility_score'],
            'confidence_score': confidence,
            'current_period_avg': metrics['current_period_avg'],
            'previous_period_avg': metrics['previous_period_avg'],
            'latest_date': metrics['latest_date'],
            'data_points_last_30_days': metrics['data_points_last_30_days'],
        }

        if classification:
            payload.update({
                'insight_type': classification['insight_type'],
                'title': classification['title'],
                'description': classification['description'],
                'recommended_actions': classification['recommended_actions'],
            })

        return payload

    def analyze(
        self,
        business,
        keywords: Union[str, List[str]],
        region: str = 'worldwide',
        days: int = 90,
        refresh: bool = False,
    ) -> List[Dict[str, Any]]:
        """Analyze one or more keywords and return a list of insight payloads.

        Data is read from the ``GoogleTrendsData`` table. When ``refresh`` is
        true (or a keyword has no stored data) it is re-fetched via PyTrends
        and persisted first.
        """
        keyword_list = self._parse_keywords(keywords)
        if not keyword_list:
            return []

        series_by_keyword = self.data_service.get_time_series(
            business=business, keywords=keyword_list, region=region, days=days
        )

        if refresh:
            fresh = self.data_service.collect_trends(
                business=business, keywords=keyword_list, region=region, days=days
            )
            series_by_keyword = {**series_by_keyword, **{k: v for k, v in fresh.items()}}
            # Re-read to ensure consistent ordering/shape from persisted store.
            series_by_keyword = self.data_service.get_time_series(
                business=business, keywords=keyword_list, region=region, days=days
            )

        insights: List[Dict[str, Any]] = []
        for keyword in keyword_list:
            insights.append(self.analyze_timeseries(keyword, series_by_keyword.get(keyword, [])))
        return insights

    def _confidence_score(self, metrics: Dict[str, Any], has_baseline: bool) -> float:
        coverage = metrics['data_points_last_30_days'] / float(self.CURRENT_WINDOW_DAYS)
        coverage = max(0.0, min(1.0, coverage))
        volatility_norm = min(metrics['volatility_score'] / 100.0, 1.0)
        confidence = 100.0 * coverage * (1.0 - 0.5 * volatility_norm)
        if not has_baseline:
            confidence *= 0.5
        return round(max(0.0, min(100.0, confidence)), 2)

    @staticmethod
    def _percentage_change(current_avg: float, previous_avg: float) -> float:
        if previous_avg > 0:
            return ((current_avg - previous_avg) / previous_avg) * 100.0
        return 0.0

    @staticmethod
    def _volatility_score(values: List[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = statistics.mean(values)
        if mean <= 0:
            return 0.0
        std = statistics.pstdev(values)
        raw = (std / mean) * 100.0
        return round(max(0.0, min(100.0, raw)), 2)

    @staticmethod
    def _normalize_series(timeseries: List[Point]) -> List[Point]:
        points: List[Point] = []
        for item in timeseries:
            date = item['date']
            interest = item['interest']
            if isinstance(date, datetime.datetime):
                date = date.date()
            if interest is None:
                continue
            points.append({'date': date, 'interest': float(interest)})
        points.sort(key=lambda p: p['date'])
        return points

    @staticmethod
    def _parse_keywords(keywords: Union[str, List[str]]) -> List[str]:
        if isinstance(keywords, str):
            return [kw.strip() for kw in keywords.split(',') if kw.strip()]
        return [str(kw).strip() for kw in keywords if kw]

    @staticmethod
    def _empty_metrics() -> Dict[str, Any]:
        return {
            'trend_score': 0.0,
            'percentage_change': 0.0,
            'trend_direction': 'Stable',
            'volatility_score': 0.0,
            'current_period_avg': 0.0,
            'previous_period_avg': 0.0,
            'data_points_last_30_days': 0,
            'data_points_previous_30_days': 0,
            'latest_date': None,
        }
