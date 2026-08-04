"""
Management command to trigger model training for a business.

Usage:
    python manage.py train_models --business-id <id>
"""
import logging
from django.core.management.base import BaseCommand, CommandError
from analytics.services.ml_pipeline import TrainAllModelsPipeline

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Train all ML models for a given business"

    def add_arguments(self, parser):
        parser.add_argument(
            "--business-id",
            type=int,
            required=True,
            help="The ID of the business to train models for"
        )

    def handle(self, *args, **options):
        business_id = options["business_id"]
        self.stdout.write(
            self.style.SUCCESS(f"Starting model training for business {business_id}")
        )

        try:
            pipeline = TrainAllModelsPipeline(business_id=business_id)
            results = pipeline.run()

            self.stdout.write(
                self.style.SUCCESS(f"Model training complete for business {business_id}")
            )
            self.stdout.write(f"Results: {results}")
        except Exception as e:
            logger.error(f"Error training models for business {business_id}: {e}")
            raise CommandError(f"Error training models: {e}")
