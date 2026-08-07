import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from products.models import Product
from integrations.models import CompetitorPrice
from businesses.models import Business

from integrations.services.competitor_price_service import CompetitorPriceService

class Command(BaseCommand):
    help = "Seed competitor prices for all products in the database"

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
            self.stdout.write("Starting mock competitor price seeding...")

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
            competitors = [
                {"name": "Amazon", "domain": "amazon.in", "range": (0.90, 1.10)},
                {"name": "Flipkart", "domain": "flipkart.com", "range": (0.88, 1.08)},
                {"name": "Google Shopping", "domain": "google.com/shopping", "range": (0.92, 1.12)}
            ]
            for product in products:
                price = float(product.price or 100.0)
                if price <= 0:
                    price = 100.0

                for comp in competitors:
                    factor = random.uniform(comp["range"][0], comp["range"][1])
                    comp_price = round(price * factor, 2)
                    clean_name = product.name.lower().replace(" ", "-")
                    url = f"https://www.{comp['domain']}/search?q={clean_name}"

                    CompetitorPrice.objects.create(
                        business=product.business,
                        product=product,
                        competitor_name=comp["name"],
                        price=Decimal(str(comp_price)),
                        url=url
                    )
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_count} competitor price records for {products.count()} products!"
            )
        )
