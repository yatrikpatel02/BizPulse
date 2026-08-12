"""
Celery tasks for automatic ML retraining and prediction regeneration.
"""
import logging

from celery import shared_task

from analytics.services.retraining_service import RetrainingService, _lock_key, _redis_available, _redis_client

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def retrain_and_regenerate_predictions(self, business_id: int) -> dict:
    """
    Retrain all ML models for a business and regenerate predictions.

    The task is only scheduled when the dataset has changed meaningfully
    (thresholds met). On success, the new training baseline is recorded so
    future dataset changes are measured against this run.
    """
    from businesses.models import Business
    from analytics.services.ml_pipeline import TrainAllModelsPipeline, RunPredictionsPipeline

    try:
        Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        logger.error("Business %s not found for retraining.", business_id)
        _release_lock(business_id)
        return {"status": "error", "detail": "Business not found."}

    try:
        # 1. Retrain all models using the existing training pipeline.
        train_pipeline = TrainAllModelsPipeline(business_id=business_id)
        train_results = train_pipeline.run()

        sales_results = train_results.get('sales_forecast') or {}
        demand_results = train_results.get('demand_forecast') or {}

        if not sales_results and not demand_results:
            # The existing pipeline skips training when data is insufficient.
            logger.warning(
                "Retraining produced no models for business %s. "
                "Not recording a new baseline so retraining can re-trigger later.",
                business_id,
            )
            _release_lock(business_id)
            return {
                "status": "skipped",
                "detail": "No models produced. Dataset likely below minimum training size.",
            }

        # 2. Regenerate predictions using the freshly trained models.
        predict_pipeline = RunPredictionsPipeline(business_id=business_id)
        predict_results = predict_pipeline.run()

        # 3. Record the new training baseline and consume accumulated change
        #    logs so the next decision measures changes from this run forward.
        RetrainingService.record_training(business_id)

        _release_lock(business_id)
        logger.info("Automatic retraining completed for business %s.", business_id)
        return {
            "status": "success",
            "business_id": int(business_id),
            "message": "Automatic retraining and prediction regeneration completed successfully.",
        }
    except Exception as exc:
        logger.exception("Automatic retraining failed for business %s.", business_id)
        _release_lock(business_id)
        raise self.retry(exc=exc)


def _release_lock(business_id: int) -> None:
    """Best-effort release of the retraining lock."""
    if not _redis_available():
        return
    try:
        _redis_client().delete(_lock_key(business_id))
    except Exception:
        logger.warning("Could not release retrain lock for business %s", business_id)
