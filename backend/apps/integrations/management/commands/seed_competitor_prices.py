import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from products.models import Product
from integrations.models import CompetitorPrice
from businesses.models import Business

class Command(BaseCommand):
    help = "Seed mock competitor prices for all products in the database"

    def handle(self, *args, **options):
        self.stdout.write("Starting competitor price seeding...")

        # Delete existing competitor prices
        CompetitorPrice.objects.all().delete()
        self.stdout.write("Cleared existing competitor price records.")

        products = Product.objects.all()
        if not products.exists():
            self.stdout.write(self.style.ERROR("No products found in the database. Please import products first."))
            return

        competitors = [
            {"name": "Amazon", "domain": "amazon.in", "range": (0.90, 1.10)},
            {"name": "Flipkart", "domain": "flipkart.com", "range": (0.88, 1.08)},
            {"name": "Google Shopping", "domain": "google.com/shopping", "range": (0.92, 1.12)}
        ]

        created_count = 0
        for product in products:
            price = float(product.price or 100.0)
            if price <= 0:
                price = 100.0

            # Generate competitor prices
            for comp in competitors:
                factor = random.uniform(comp["range"][0], comp["range"][1])
                comp_price = round(price * factor, 2)
                
                # Mock URL
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
