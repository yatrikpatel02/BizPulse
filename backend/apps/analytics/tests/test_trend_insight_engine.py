import datetime
import unittest

from analytics.services.trend_business_rules import TrendBusinessRulesService
from analytics.services.trend_insight_engine import TrendInsightEngine


def build_series(values, days_back_start=89):
    """Build a daily time series ending today from a list of interest values.

    ``values`` is ordered oldest-first; each value maps to a successive day.
    """
    today = datetime.date.today()
    start = today - datetime.timedelta(days=days_back_start)
    points = []
    for i, v in enumerate(values):
        points.append({'date': start + datetime.timedelta(days=i), 'interest': v})
    return points


class TrendInsightEngineMetricsTest(unittest.TestCase):
    def setUp(self):
        self.engine = TrendInsightEngine(rules_service=TrendBusinessRulesService())

    def test_empty_series_returns_defaults(self):
        metrics = self.engine.calculate_metrics([])
        self.assertEqual(metrics['trend_score'], 0.0)
        self.assertEqual(metrics['percentage_change'], 0.0)
        self.assertEqual(metrics['trend_direction'], 'Stable')
        self.assertEqual(metrics['volatility_score'], 0.0)
        self.assertEqual(metrics['data_points_last_30_days'], 0)
        self.assertIsNone(metrics['latest_date'])

    def test_metrics_fast_growth_opportunity(self):
        # 90 days: first 60 days = 30, last 30 days = 60.
        values = [30] * 60 + [60] * 30
        metrics = self.engine.calculate_metrics(build_series(values))
        self.assertEqual(metrics['data_points_last_30_days'], 30)
        self.assertEqual(metrics['data_points_previous_30_days'], 30)
        self.assertEqual(metrics['trend_score'], 60.0)
        self.assertAlmostEqual(metrics['percentage_change'], 100.0, places=2)
        self.assertEqual(metrics['trend_direction'], 'Growing')
        self.assertEqual(metrics['volatility_score'], 0.0)

    def test_metrics_decline_risk(self):
        values = [60] * 60 + [20] * 30
        metrics = self.engine.calculate_metrics(build_series(values))
        self.assertEqual(metrics['trend_score'], 20.0)
        expected_change = ((20.0 - 60.0) / 60.0) * 100.0
        self.assertAlmostEqual(metrics['percentage_change'], round(expected_change, 2), places=2)
        self.assertEqual(metrics['trend_direction'], 'Declining')

    def test_volatility_zero_for_constant_values(self):
        values = [50] * 90
        metrics = self.engine.calculate_metrics(build_series(values))
        self.assertEqual(metrics['volatility_score'], 0.0)

    def test_volatility_high_for_fluctuating_values(self):
        # Current 30 days alternate 0/100 -> mean 50, std 50 -> CV 1 -> 100.
        fluctuating = []
        for i in range(90):
            if i >= 60:  # current 30-day window
                fluctuating.append(0 if (i % 2 == 0) else 100)
            else:
                fluctuating.append(25)
        metrics = self.engine.calculate_metrics(build_series(fluctuating))
        self.assertGreater(metrics['volatility_score'], 0.0)
        self.assertEqual(metrics['volatility_score'], 100.0)
        # avg of current window still 50 -> pct change (50-25)/25 = 100 -> Growing
        self.assertEqual(metrics['trend_direction'], 'Growing')

    def test_percentage_change_handles_zero_baseline(self):
        # Previous window all zeros, current positive -> treated as no baseline (0% change).
        values = [0] * 60 + [40] * 30
        metrics = self.engine.calculate_metrics(build_series(values))
        self.assertEqual(metrics['percentage_change'], 0.0)

    def test_percentage_change_both_zero(self):
        values = [0] * 90
        metrics = self.engine.calculate_metrics(build_series(values))
        self.assertEqual(metrics['percentage_change'], 0.0)

    def test_metrics_use_latest_date_as_reference(self):
        # Values = [first 30 = 0] + [previous 30 = 10] + [current 30 = 50]
        values = [0] * 30 + [10] * 30 + [50] * 30
        metrics = self.engine.calculate_metrics(build_series(values))
        self.assertEqual(metrics['current_period_avg'], 50.0)
        self.assertEqual(metrics['previous_period_avg'], 10.0)
        self.assertEqual(metrics['latest_date'], datetime.date.today().isoformat())

    def test_confidence_full_for_stable_growth(self):
        insight = self.engine.analyze_timeseries('Widget', build_series([40] * 60 + [80] * 30))
        self.assertEqual(insight['confidence_score'], 100.0)
        self.assertEqual(insight['insight_type'], 'Opportunity')

    def test_confidence_reduced_when_no_baseline(self):
        values = [50] * 30
        insight = self.engine.analyze_timeseries('Widget', build_series(values, days_back_start=29))
        self.assertLessEqual(insight['confidence_score'], 50.0)
        self.assertEqual(insight['trend_direction'], 'Stable')
        self.assertEqual(insight['percentage_change'], 0.0)

    def test_confidence_reduced_by_volatility(self):
        fluctuating = []
        for i in range(90):
            if i >= 60:
                fluctuating.append(0 if (i % 2 == 0) else 100)
            else:
                fluctuating.append(25)
        insight = self.engine.analyze_timeseries('Widget', build_series(fluctuating))
        self.assertEqual(insight['volatility_score'], 100.0)
        self.assertEqual(insight['confidence_score'], 50.0)

    def test_analyze_timeseries_contains_required_fields(self):
        insight = self.engine.analyze_timeseries('Wireless Earbuds', build_series([30] * 60 + [60] * 30))
        required = {
            'keyword', 'trend_score', 'percentage_change', 'trend_direction',
            'volatility_score', 'insight_type', 'title', 'description',
            'recommended_actions', 'confidence_score',
        }
        self.assertTrue(required.issubset(insight.keys()))
        self.assertEqual(insight['keyword'], 'Wireless Earbuds')


class TrendInsightEngineKeywordParsingTest(unittest.TestCase):
    def test_parse_keywords_from_string(self):
        engine = TrendInsightEngine.__new__(TrendInsightEngine)
        result = engine._parse_keywords('Wireless Earbuds, Smartphones, ')
        self.assertEqual(result, ['Wireless Earbuds', 'Smartphones'])

    def test_parse_keywords_from_list(self):
        engine = TrendInsightEngine.__new__(TrendInsightEngine)
        result = engine._parse_keywords(['A', ' B ', ''])
        self.assertEqual(result, ['A', 'B'])

    def test_parse_keywords_empty(self):
        engine = TrendInsightEngine.__new__(TrendInsightEngine)
        self.assertEqual(engine._parse_keywords(''), [])
        self.assertEqual(engine._parse_keywords([]), [])


if __name__ == '__main__':
    unittest.main()
