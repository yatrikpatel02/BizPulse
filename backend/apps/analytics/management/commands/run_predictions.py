"""
Management command to run predictions for a business.

This command can be scheduled (e.g., via cron, Windows Task Scheduler)
to generate updated predictions on a regular basis.

Usage:
    python manage.py run_predictions --business-id <id>
"""
import logging
from django.core.management.base import BaseCommand, CommandError
from analytics.services.ml_pipeline import RunPredictionsPipeline

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run predictions for a given business and store results in the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--business-id",
            type=int,
            required=True,
            help="The ID of the business to generate predictions for"
        )

    def handle(self, *args, **options):
        business_id = options["business_id"]
        self.stdout.write(
            self.style.SUCCESS(f"Starting prediction pipeline for business {business_id}")
        )

        try:
            pipeline = RunPredictionsPipeline(business_id=business_id)
            results = pipeline.run()

            self.stdout.write(
                self.style.SUCCESS(f"Prediction pipeline complete for business {business_id}")
            )
            self.stdout.write(f"Results: {results}")
        except Exception as e:
            logger.error(f"Error running predictions for business {business_id}: {e}")
            raise CommandError(f"Error running predictions: {e}")
