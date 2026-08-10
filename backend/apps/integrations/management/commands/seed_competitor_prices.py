import logging
from django.core.management.base import BaseCommand
from products.models import Product
from businesses.models import Business
from integrations.models import CompetitorPrice

from integrations.services.competitor_price_service import CompetitorPriceService

class Command(BaseCommand):
    help = "Fetch live competitor prices for all products in the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--live',
            action='store_true',
            help='Fetch real prices from live scrapers instead of generating mock values',
        )

    def handle(self, *args, **options):
        is_live = options['live']
        if is_live:
            self.stdout.write("Starting live competitor price scraping (this might take a few minutes)...")
        else:
            self.stdout.write(self.style.WARNING("No --live flag provided. Could not find competitor prices. Use --live to fetch real prices."))

        # Delete existing competitor prices
        CompetitorPrice.objects.all().delete()
        self.stdout.write("Cleared existing competitor price records.")

        products = Product.objects.all()
        if not products.exists():
            self.stdout.write(self.style.ERROR("No products found in the database. Please import products first."))
            return

        created_count = 0
        
        if is_live:
            service = CompetitorPriceService()
            for product in products:
                try:
                    self.stdout.write(f"Scraping live prices for product: {product.name}...")
                    collected = service.collect_prices(product.business, product)
                    created_count += len(collected)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Failed to scrape live prices for {product.name}: {e}"))
        else:
            self.stdout.write(self.style.WARNING("No --live flag provided. Could not find competitor prices. Use --live to fetch real prices."))

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_count} competitor price records for {products.count()} products!"
            )
        )
