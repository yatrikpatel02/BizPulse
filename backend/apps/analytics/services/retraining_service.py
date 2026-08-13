"""
Automatic ML Retraining Service.

The retraining decision is based purely on changes to the underlying
SalesRecord dataset (additions, modifications, deletions) — NOT on time.

- ``record_change`` / ``log_changes`` record dataset changes as they happen.
- ``evaluate`` applies the configured thresholds:
    * changed_records >= ML_RETRAIN_MIN_CHANGED_RECORDS
    * change_percentage >= ML_RETRAIN_CHANGE_THRESHOLD_PERCENT
- The existing ML model's minimum training-data requirement is respected
  (ML_RETRAIN_MIN_TRAINING_RECORDS).
"""
import logging
import time
from typing import Dict, Any

from django.conf import settings
from django.db.models import Sum

from analytics.models import SalesRecord, SalesRecordChangeLog, TrainingHistory

logger = logging.getLogger(__name__)

# Backoff for the Redis lock so a failing task does not block retraining forever.
LOCK_RETRAIN_TTL_SECONDS = 3600


def _redis_client():
    """Return a Redis client from the Celery broker URL."""
    import redis
    return redis.Redis.from_url(settings.CELERY_BROKER_URL)


# Cached availability of the Celery broker (Redis). Cached because pinging a
# dead broker on every dataset write would spam logs with connection
# tracebacks. Re-checked periodically so the app picks Redis back up once it
# is started.
_redis_available_flag = None  # None = unknown, True/False = cached
_redis_available_checked_at = 0.0
_REDIS_RECHECK_SECONDS = 60


def _redis_available() -> bool:
    """Return whether the Celery broker (Redis) is reachable.

    Caches the result for ``_REDIS_RECHECK_SECONDS`` and logs a single
    informative (non-traceback) warning when the broker is down.
    """
    global _redis_available_flag, _redis_available_checked_at

    now = time.monotonic()
    if _redis_available_flag is None or now - _redis_available_checked_at >= _REDIS_RECHECK_SECONDS:
        try:
            _redis_client().ping()
            _redis_available_flag = True
        except Exception:
            _redis_available_flag = False
            logger.warning(
                'Redis/Celery broker unavailable at %s. Retraining will '
                'run synchronously in a background thread instead of via '
                'Celery (will re-check in %ss).',
                settings.CELERY_BROKER_URL,
                int(_REDIS_RECHECK_SECONDS),
            )
        _redis_available_checked_at = now

    return _redis_available_flag


class RetrainingService:
    """Tracks dataset changes and decides when automatic retraining is needed."""

    def __init__(self, business_id: int):
        self.business_id = business_id

    # ------------------------------------------------------------------
    # Change tracking
    # ------------------------------------------------------------------
    @staticmethod
    def log_changes(business_id: int, added: int = 0, modified: int = 0, deleted: int = 0) -> None:
        """
        Record dataset changes for a business.

        Call from within the same transaction as the actual SalesRecord
        write so the log rolls back with the data change.
        """
        for change_type, count in (('added', added), ('modified', modified), ('deleted', deleted)):
            if count > 0:
                SalesRecordChangeLog.objects.create(
                    business_id=business_id,
                    change_type=change_type,
                    count=int(count),
                )

    # ------------------------------------------------------------------
    # Evaluation / decision
    # ------------------------------------------------------------------
    def evaluate(self) -> Dict[str, Any]:
        """
        Decide whether automatic retraining should happen for this business.

        Returns a dict with ``should_retrain`` and the supporting numbers.
        """
        latest_training = TrainingHistory.objects.filter(business_id=self.business_id).first()

        # Accumulate changes since the last successful training.
        change_totals = dict(
            SalesRecordChangeLog.objects
            .filter(business_id=self.business_id)
            .values('change_type')
            .annotate(total=Sum('count'))
            .values_list('change_type', 'total')
        )
        records_added = int(change_totals.get('added', 0) or 0)
        records_modified = int(change_totals.get('modified', 0) or 0)
        records_deleted = int(change_totals.get('deleted', 0) or 0)
        changed_records = records_added + records_modified + records_deleted

        current_count = SalesRecord.objects.filter(business_id=self.business_id).count()

        if latest_training is None:
            # No training baseline yet. For the very first run, automatically
            # generate an initial model + predictions if the dataset is large
            # enough. The existing ML pipeline's minimum training-data
            # requirement takes priority (small dataset exception).
            base = {
                'records_added': records_added,
                'records_deleted': records_deleted,
                'records_modified': records_modified,
                'changed_records': changed_records,
                'current_record_count': current_count,
                'previous_trained_record_count': None,
                'change_percentage': 0.0,
                'min_changed_records': self._min_changed_records,
                'change_threshold_percent': self._change_threshold_percent,
                'min_training_records': self._min_training_records,
            }
            if current_count >= self._min_training_records:
                base.update({
                    'should_retrain': True,
                    'reason': 'first_training_required',
                    'message': (
                        f'No previous training baseline exists and the dataset now has '
                        f'{current_count} records (>= minimum {self._min_training_records}). '
                        f'Running initial training and prediction generation.'
                    ),
                })
            else:
                base.update({
                    'should_retrain': False,
                    'reason': 'insufficient_records',
                    'message': (
                        f'No previous training baseline exists and the dataset has only '
                        f'{current_count} records (below minimum {self._min_training_records}).'
                    ),
                })
            return base

        previous_count = latest_training.trained_record_count

        if changed_records == 0:
            return self._result(False, 'no_changes', 'No sales data changes since last training.',
                                records_added, records_modified, records_deleted,
                                current_count, previous_count)

        # Small dataset exception: the existing model's minimum training-data
        # requirement takes priority. If the current dataset is too small,
        # do not train at all.
        if current_count < self._min_training_records:
            return self._result(False, 'insufficient_records',
                                f'Current dataset ({current_count} records) is below the minimum '
                                f'training data requirement ({self._min_training_records} records).',
                                records_added, records_modified, records_deleted,
                                current_count, previous_count)

        change_percentage = (changed_records / previous_count * 100.0) if previous_count else 0.0

        meets_min_records = changed_records >= self._min_changed_records
        meets_percentage = change_percentage >= self._change_threshold_percent

        if meets_min_records and meets_percentage:
            message = (
                f'Dataset changed by {changed_records} records '
                f'({change_percentage:.2f}% of {previous_count} trained records). '
                f'Thresholds: >= {self._min_changed_records} records and '
                f'>= {self._change_threshold_percent}%.'
            )
            should = True
            reason = 'thresholds_met'
        else:
            message = (
                f'Dataset changed by {changed_records} records '
                f'({change_percentage:.2f}% of {previous_count} trained records). '
                f'Required: >= {self._min_changed_records} records AND '
                f'>= {self._change_threshold_percent}%.'
            )
            should = False
            reason = 'thresholds_not_met'

        return self._result(should, reason, message,
                            records_added, records_modified, records_deleted,
                            current_count, previous_count, change_percentage)

    def _result(self, should_retrain: bool, reason: str, message: str,
                records_added: int, records_modified: int, records_deleted: int,
                current_count: int, previous_count: int, change_percentage: float = 0.0) -> Dict[str, Any]:
        return {
            'should_retrain': should_retrain,
            'reason': reason,
            'message': message,
            'records_added': records_added,
            'records_deleted': records_deleted,
            'records_modified': records_modified,
            'changed_records': records_added + records_modified + records_deleted,
            'current_record_count': current_count,
            'previous_trained_record_count': previous_count,
            'change_percentage': round(change_percentage, 4),
            'min_changed_records': self._min_changed_records,
            'change_threshold_percent': self._change_threshold_percent,
            'min_training_records': self._min_training_records,
        }

    # ------------------------------------------------------------------
    # Scheduling
    # ------------------------------------------------------------------
    def schedule_retraining(self) -> bool:
        """
        Queue the retraining + prediction regeneration task for this business.

        Uses a Redis lock keyed by business to avoid queueing multiple
        redundant retraining tasks for rapid consecutive changes.

        If the Celery broker (Redis) is unavailable, falls back to running
        the retraining + prediction generation synchronously in a
        background worker thread so the model is still generated.
        """
        from analytics.tasks import retrain_and_regenerate_predictions

        if not self._acquire_retrain_lock():
            logger.info('Retraining already scheduled for business %s; skipping.', self.business_id)
            return False

        # 1) Preferred path: queue via Celery when the broker is reachable.
        if _redis_available():
            try:
                retrain_and_regenerate_predictions.delay(self.business_id)
                logger.info('Scheduled automatic retraining for business %s.', self.business_id)
                return True
            except Exception:
                logger.warning(
                    'Failed to queue retraining via Celery for business %s; '
                    'falling back to synchronous background retraining.',
                    self.business_id,
                )
            self._release_retrain_lock(self.business_id)

        # 2) Broker unavailable / queueing failed -> run synchronously in a
        #    background daemon thread so the model is still generated.
        def _run_sync():
            try:
                retrain_and_regenerate_predictions(self.business_id)
            except Exception:
                logger.exception(
                    'Synchronous background retraining failed for business %s.',
                    self.business_id,
                )

        import threading
        thread = threading.Thread(
            target=_run_sync,
            name=f'retrain-sync-{self.business_id}',
            daemon=True,
        )
        thread.start()
        logger.info('Started synchronous background retraining for business %s.', self.business_id)
        return True

    def retrain_if_needed(self) -> Dict[str, Any]:
        """Evaluate and, if required, schedule an automatic retraining task."""
        decision = self.evaluate()
        if decision['should_retrain']:
            decision['scheduled'] = self.schedule_retraining()
        else:
            decision['scheduled'] = False
        return decision

    @staticmethod
    def _release_retrain_lock(business_id: int) -> None:
        if not _redis_available():
            return
        try:
            _redis_client().delete(_lock_key(business_id))
        except Exception:
            logger.warning('Could not release retrain lock for business %s', business_id)

    def _acquire_retrain_lock(self) -> bool:
        # If Redis is unavailable, treat the lock as acquirable and let the
        # synchronous fallback take over (no noisy connection tracebacks).
        if not _redis_available():
            return True
        try:
            return bool(_redis_client().set(_lock_key(self.business_id), '1', nx=True, ex=LOCK_RETRAIN_TTL_SECONDS))
        except Exception:
            logger.warning('Could not acquire retrain lock for business %s; allowing schedule anyway', self.business_id)
            return True

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @property
    def _min_changed_records(self) -> int:
        return int(getattr(settings, 'ML_RETRAIN_MIN_CHANGED_RECORDS', 100))

    @property
    def _change_threshold_percent(self) -> float:
        return float(getattr(settings, 'ML_RETRAIN_CHANGE_THRESHOLD_PERCENT', 10))

    @property
    def _min_training_records(self) -> int:
        return int(getattr(settings, 'ML_RETRAIN_MIN_TRAINING_RECORDS', 5))

    @staticmethod
    def record_training(business_id: int) -> None:
        """
        Record a successful training run and consume the accumulated change
        logs. Called after a training run that actually produced models.
        """
        current_count = SalesRecord.objects.filter(business_id=business_id).count()
        TrainingHistory.objects.create(
            business_id=business_id,
            trained_record_count=current_count,
        )
        SalesRecordChangeLog.objects.filter(business_id=business_id).delete()
        logger.info('Recorded training for business %s with %s records.', business_id, current_count)


# Module-level helper so callers do not need to know the lock key format.
def _lock_key(business_id: int) -> str:
    return f'ml_retrain_lock:{business_id}'