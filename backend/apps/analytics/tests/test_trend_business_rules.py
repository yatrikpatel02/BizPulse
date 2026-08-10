import unittest

from analytics.services.trend_business_rules import TrendBusinessRulesService


class TrendBusinessRulesServiceTest(unittest.TestCase):
    def setUp(self):
        self.rules = TrendBusinessRulesService()

    def test_trend_direction_boundaries(self):
        self.assertEqual(self.rules.determine_trend_direction(5.01), 'Growing')
        self.assertEqual(self.rules.determine_trend_direction(50), 'Growing')
        self.assertEqual(self.rules.determine_trend_direction(0), 'Stable')
        self.assertEqual(self.rules.determine_trend_direction(5), 'Stable')
        self.assertEqual(self.rules.determine_trend_direction(-5), 'Stable')
        self.assertEqual(self.rules.determine_trend_direction(-5.01), 'Declining')
        self.assertEqual(self.rules.determine_trend_direction(-50), 'Declining')

    def test_classify_opportunity_above_threshold(self):
        result = self.rules.classify(percentage_change=25)
        self.assertEqual(result['insight_type'], 'Opportunity')
        self.assertEqual(result['title'], 'Rapid Search Demand Increase')

    def test_classify_opportunity_boundary_strict(self):
        # Exactly 20 is NOT an Opportunity (strict > 20), it is Positive Trend.
        result = self.rules.classify(percentage_change=20)
        self.assertEqual(result['insight_type'], 'Positive Trend')
        result_above = self.rules.classify(percentage_change=20.01)
        self.assertEqual(result_above['insight_type'], 'Opportunity')

    def test_classify_positive_trend_band(self):
        result = self.rules.classify(percentage_change=10)
        self.assertEqual(result['insight_type'], 'Positive Trend')
        self.assertIn('Monitor inventory', result['recommended_actions'][0])

    def test_classify_positive_trend_boundary_at_five_is_stable(self):
        # 5 is the Stable boundary (strict_min=True for Positive Trend).
        self.assertEqual(self.rules.classify(percentage_change=5)['insight_type'], 'Stable')
        self.assertEqual(self.rules.classify(percentage_change=5.01)['insight_type'], 'Positive Trend')

    def test_classify_stable_band(self):
        result = self.rules.classify(percentage_change=0)
        self.assertEqual(result['insight_type'], 'Stable')
        self.assertEqual(self.rules.classify(percentage_change=-5)['insight_type'], 'Stable')
        self.assertEqual(self.rules.classify(percentage_change=5)['insight_type'], 'Stable')

    def test_classify_warning_band(self):
        result = self.rules.classify(percentage_change=-10)
        self.assertEqual(result['insight_type'], 'Warning')
        self.assertEqual(result['title'], 'Declining Search Demand')

    def test_classify_warning_negative_twenty_is_not_risk(self):
        # Exactly -20 is Warning (Risk is strict < -20).
        self.assertEqual(self.rules.classify(percentage_change=-20)['insight_type'], 'Warning')
        self.assertEqual(self.rules.classify(percentage_change=-20.01)['insight_type'], 'Risk')

    def test_classify_risk_below_threshold(self):
        result = self.rules.classify(percentage_change=-35)
        self.assertEqual(result['insight_type'], 'Risk')
        self.assertEqual(result['title'], 'Significant Demand Drop')

    def test_classify_returns_recommended_actions(self):
        result = self.rules.classify(percentage_change=30)
        self.assertIsInstance(result['recommended_actions'], list)
        self.assertTrue(len(result['recommended_actions']) >= 2)

    def test_all_rules_cover_full_number_line(self):
        # Every real percentage should map to a known insight type.
        for pct in [-100, -25, -20, -19.9, -10, -5, -4.9, 0, 5, 5.01, 10, 20, 20.01, 50, 100]:
            result = self.rules.classify(pct)
            self.assertIsNotNone(result)
            self.assertIn(result['insight_type'], TrendBusinessRulesService.INSIGHT_TYPES)


if __name__ == '__main__':
    unittest.main()
