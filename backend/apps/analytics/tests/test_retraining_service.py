
"""
Tests for the automatic ML retraining service.

The core requirement: retraining decisions are based on meaningful changes to
the underlying SalesRecord dataset (additions, modifications, deletions) —
NOT on time/calendar.
"""
from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model

from businesses.models import Business
from products.models import Product
from analytics.models import SalesRecord, SalesRecordChangeLog, TrainingHistory
from analytics.services.retraining_service import RetrainingService

User = get_user_model()


class RetrainingServiceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='retrain_user',
            email='retrain@test.com',
            password='password123'
        )
        self.business = Business.objects.create(
            owner=self.user,
            name='Retrain Business',
            industry='Retail'
        )
        self.product = Product.objects.create(
            business=self.business,
            name='Product A',
            sku='PROD-A',
            price=10.0
        )

    def _create_sales(self, count, start_day=1):
        """Create ``count`` SalesRecords with distinct dates."""
        base_date = date(2024, 1, 1) + timedelta(days=start_day - 1)
        for i in range(count):
            SalesRecord.objects.create(
                business=self.business,
                product=self.product,
                date=base_date + timedelta(days=i),
                quantity=10,
                revenue=100.0,
            )

    def _record_training(self, count):
        """Simulate a successful training run with ``count`` records."""
        TrainingHistory.objects.create(
            business=self.business,
            trained_record_count=count,
        )


class RetrainingDecisionTests(RetrainingServiceTestCase):
    def test_no_previous_training_and_small_dataset_no_retrain(self):
        """Without a training baseline and dataset below minimum, no retrain."""
        decision = RetrainingService(self.business.id).evaluate()
        self.assertFalse(decision['should_retrain'])
        self.assertEqual(decision['reason'], 'insufficient_records')

    @override_settings(
        ML_RETRAIN_CHANGE_THRESHOLD_PERCENT=10,
        ML_RETRAIN_MIN_CHANGED_RECORDS=100,
        ML_RETRAIN_MIN_TRAINING_RECORDS=5,
    )
    def test_first_training_required_when_dataset_large_enough(self):
        """No baseline + dataset >= minimum training size -> initial training."""
        self._create_sales(50)
        RetrainingService.log_changes(self.business.id, added=50)

        decision = RetrainingService(self.business.id).evaluate()
        self.assertTrue(decision['should_retrain'])
        self.assertEqual(decision['reason'], 'first_training_required')
        self.assertEqual(decision['current_record_count'], 50)

    def test_no_changes_does_not_retrain(self):
        """No dataset changes since last training -> no retrain."""
        self._create_sales(1000)
        self._record_training(1000)
        decision = RetrainingService(self.business.id).evaluate()
        self.assertFalse(decision['should_retrain'])
        self.assertEqual(decision['reason'], 'no_changes')

    @override_settings(
        ML_RETRAIN_CHANGE_THRESHOLD_PERCENT=10,
        ML_RETRAIN_MIN_CHANGED_RECORDS=100,
        ML_RETRAIN_MIN_TRAINING_RECORDS=5,
    )
    def test_thresholds_met_retrains(self):
        """Both thresholds met (>= 100 records AND >= 10%) -> retrain."""
        self._create_sales(1000)
        self._record_training(1000)

        # Add 150 records -> 150 changed, 15% change.
        self._create_sales(150, start_day=1001)
        RetrainingService.log_changes(self.business.id, added=150)

        decision = RetrainingService(self.business.id).evaluate()
        self.assertTrue(decision['should_retrain'])
        self.assertEqual(decision['reason'], 'thresholds_met')
        self.assertEqual(decision['records_added'], 150)
        self.assertEqual(decision['changed_records'], 150)
        self.assertAlmostEqual(decision['change_percentage'], 15.0, places=2)

    @override_settings(
        ML_RETRAIN_CHANGE_THRESHOLD_PERCENT=10,
        ML_RETRAIN_MIN_CHANGED_RECORDS=100,
        ML_RETRAIN_MIN_TRAINING_RECORDS=5,
    )
    def test_percentage_met_but_min_records_not(self):
        """10% change but fewer than 100 changed records -> no retrain."""
        self._create_sales(20)
        self._record_training(20)

        # 2 changed records = 10%, but below MIN_CHANGED_RECORDS=100.
        RetrainingService.log_changes(self.business.id, modified=2)

        decision = RetrainingService(self.business.id).evaluate()
        self.assertFalse(decision['should_retrain'])
        self.assertEqual(decision['reason'], 'thresholds_not_met')

    @override_settings(
        ML_RETRAIN_CHANGE_THRESHOLD_PERCENT=10,
        ML_RETRAIN_MIN_CHANGED_RECORDS=100,
        ML_RETRAIN_MIN_TRAINING_RECORDS=5,
    )
    def test_min_records_met_but_percentage_not(self):
        """100+ changed records but < 10% change -> no retrain."""
        self._create_sales(2000)
        self._record_training(2000)

        # 100 changed records = 5% change, meets min records but not percentage.
        RetrainingService.log_changes(self.business.id, added=100)

        decision = RetrainingService(self.business.id).evaluate()
        self.assertFalse(decision['should_retrain'])
        self.assertEqual(decision['reason'], 'thresholds_not_met')

    @override_settings(
        ML_RETRAIN_CHANGE_THRESHOLD_PERCENT=10,
        ML_RETRAIN_MIN_CHANGED_RECORDS=100,
        ML_RETRAIN_MIN_TRAINING_RECORDS=5,
    )
    def test_small_dataset_exception(self):
        """If current dataset is below minimum training size, do not train."""
        self._create_sales(50)
        self._record_training(50)

        # Delete 10 records -> 20% change, way above thresholds, but current
        # dataset (40) is still above the 5-record minimum here. To test the
        # small-dataset exception, we need current count below the minimum.
        # Delete enough to drop below 5.
        RetrainingService.log_changes(self.business.id, deleted=47)
        SalesRecord.objects.filter(business=self.business).delete()

        decision = RetrainingService(self.business.id).evaluate()
        self.assertFalse(decision['should_retrain'])
        self.assertEqual(decision['reason'], 'insufficient_records')

    def test_combined_added_modified_deleted(self):
        """Changed records = added + modified + deleted."""
        self._create_sales(1000)
        self._record_training(1000)

        RetrainingService.log_changes(
            self.business.id,
            added=50,
            modified=30,
            deleted=20,
        )

        decision = RetrainingService(self.business.id).evaluate()
        self.assertEqual(decision['records_added'], 50)
        self.assertEqual(decision['records_modified'], 30)
        self.assertEqual(decision['records_deleted'], 20)
        self.assertEqual(decision['changed_records'], 100)


class RetrainingSchedulingTests(RetrainingServiceTestCase):
    @override_settings(
        ML_RETRAIN_CHANGE_THRESHOLD_PERCENT=10,
        ML_RETRAIN_MIN_CHANGED_RECORDS=100,
        ML_RETRAIN_MIN_TRAINING_RECORDS=5,
    )
    @patch('analytics.services.retraining_service._redis_available', return_value=True)
    @patch('analytics.services.retraining_service.RetrainingService._acquire_retrain_lock', return_value=True)
    @patch('analytics.tasks.retrain_and_regenerate_predictions.delay')
    def test_retrain_if_needed_schedules_task(self, mock_delay, mock_lock, mock_redis):
        """When thresholds are met, retraining task is scheduled via Celery."""
        self._create_sales(1000)
        self._record_training(1000)
        self._create_sales(150, start_day=1001)
        RetrainingService.log_changes(self.business.id, added=150)

        decision = RetrainingService(self.business.id).retrain_if_needed()
        self.assertTrue(decision['should_retrain'])
        self.assertTrue(decision['scheduled'])
        mock_delay.assert_called_once_with(self.business.id)

    @override_settings(
        ML_RETRAIN_CHANGE_THRESHOLD_PERCENT=10,
        ML_RETRAIN_MIN_CHANGED_RECORDS=100,
        ML_RETRAIN_MIN_TRAINING_RECORDS=5,
    )
    @patch('analytics.services.retraining_service._redis_available', return_value=True)
    @patch('analytics.services.retraining_service.RetrainingService._acquire_retrain_lock', return_value=False)
    @patch('analytics.tasks.retrain_and_regenerate_predictions.delay')
    def test_retrain_if_needed_lock_prevents_duplicate(self, mock_delay, mock_lock, mock_redis):
        """If retraining already scheduled (lock held), don't queue again."""
        self._create_sales(1000)
        self._record_training(1000)
        self._create_sales(150, start_day=1001)
        RetrainingService.log_changes(self.business.id, added=150)

        decision = RetrainingService(self.business.id).retrain_if_needed()
        self.assertTrue(decision['should_retrain'])
        self.assertFalse(decision['scheduled'])
        mock_delay.assert_not_called()


class RetrainingRecordTrainingTests(RetrainingServiceTestCase):
    def test_record_training_consumes_change_logs(self):
        """record_training records baseline and clears change logs."""
        self._create_sales(100)
        RetrainingService.log_changes(self.business.id, added=100)

        RetrainingService.record_training(self.business.id)

        self.assertEqual(TrainingHistory.objects.filter(business=self.business).count(), 1)
        latest = TrainingHistory.objects.filter(business=self.business).latest('trained_at')
        self.assertEqual(latest.trained_record_count, 100)
        # Change logs consumed.
        self.assertEqual(SalesRecordChangeLog.objects.filter(business=self.business).count(), 0)