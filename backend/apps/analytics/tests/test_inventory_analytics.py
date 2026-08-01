import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from businesses.models import Business
from products.models import Product
from analytics.models import InventorySnapshot
from analytics.services.inventory_analytics import InventoryAnalyticsService

User = get_user_model()


class InventoryAnalyticsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='inv_user',
            email='inv@test.com',
            password='password123'
        )
        self.business = Business.objects.create(
            owner=self.user,
            name='Inv Business',
            industry='Retail'
        )

        # Products with prices
        self.prod_a = Product.objects.create(
            business=self.business,
            name='Product A',
            sku='PROD-A',
            price=10.00
        )
        self.prod_b = Product.objects.create(
            business=self.business,
            name='Product B',
            sku='PROD-B',
            price=20.00
        )
        self.prod_c = Product.objects.create(
            business=self.business,
            name='Product C',
            sku='PROD-C',
            price=30.00
        )

        # Snapshots:
        # Product A: Qty = 10, Reorder = 5 (Normal)
        # Product B: Qty = 2, Reorder = 5 (Understock)
        # Product C: Qty = 0, Reorder = 5 (Out of stock)
        # Valuation: 10 * 10.00 + 2 * 20.00 + 0 * 30.00 = 140.00
        # Normal count: 1, Total: 3 -> health score: 33.33%
        InventorySnapshot.objects.create(
            business=self.business,
            product=self.prod_a,
            date=datetime.date(2026, 8, 1),
            quantity_on_hand=10,
            reorder_point=5
        )
        InventorySnapshot.objects.create(
            business=self.business,
            product=self.prod_b,
            date=datetime.date(2026, 8, 1),
            quantity_on_hand=2,
            reorder_point=5
        )
        InventorySnapshot.objects.create(
            business=self.business,
            product=self.prod_c,
            date=datetime.date(2026, 8, 1),
            quantity_on_hand=0,
            reorder_point=5
        )

        # Create historical snapshots for day before (2026-07-31)
        # Product A: Qty = 10, Reorder = 5
        InventorySnapshot.objects.create(
            business=self.business,
            product=self.prod_a,
            date=datetime.date(2026, 7, 31),
            quantity_on_hand=10,
            reorder_point=5
        )

    def test_calculate_inventory_health(self):
        health = InventoryAnalyticsService.calculate_inventory_health(
            business=self.business,
            date='2026-08-01'
        )
        self.assertEqual(health['health_score'], 33.33)
        self.assertEqual(health['out_of_stock_count'], 1)
        self.assertEqual(health['understock_count'], 1)
        self.assertEqual(health['normal_count'], 1)
        self.assertEqual(health['overstock_count'], 0)
        self.assertEqual(health['total_items'], 12)
        self.assertEqual(health['total_value'], 140.00)

    def test_detect_stock_anomalies(self):
        anomalies = InventoryAnalyticsService.detect_stock_anomalies(self.business)
        # Expected anomalies: Product B (understock) and Product C (out of stock)
        self.assertEqual(len(anomalies), 2)
        skus = [item['product_sku'] for item in anomalies]
        self.assertIn('PROD-B', skus)
        self.assertIn('PROD-C', skus)

    def test_get_inventory_history(self):
        history = InventoryAnalyticsService.get_inventory_history(
            business=self.business,
            start_date='2026-07-30',
            end_date='2026-08-02'
        )
        # Should contain entries for 2026-07-31 and 2026-08-01
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]['date'], '2026-07-31')
        self.assertEqual(history[0]['total_quantity'], 10)
        self.assertEqual(history[0]['total_value'], 100.0)

        self.assertEqual(history[1]['date'], '2026-08-01')
        self.assertEqual(history[1]['total_quantity'], 12)
        self.assertEqual(history[1]['total_value'], 140.0)


class InventoryAnalyticsViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='api_inv_user',
            email='api_inv@test.com',
            password='password123'
        )
        self.business = Business.objects.create(
            owner=self.user,
            name='API Inv Business',
            industry='Retail'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('inventory-analytics')

    def test_get_inventory_analytics_success(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_id'], self.business.id)
        self.assertIn('health', response.data)
        self.assertIn('anomalies', response.data)
        self.assertIn('history', response.data)
