import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from businesses.models import Business
from products.models import Product
from analytics.models import SalesRecord
from analytics.services.sales_analytics import SalesAnalyticsService

User = get_user_model()


class SalesAnalyticsServiceTest(TestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(
            username='analytics_user',
            email='analytics@test.com',
            password='password123'
        )
        self.other_user = User.objects.create_user(
            username='other_user',
            email='other@test.com',
            password='password123'
        )

        # Create businesses
        self.business = Business.objects.create(
            owner=self.user,
            name='My Business',
            industry='Retail'
        )
        self.other_business = Business.objects.create(
            owner=self.other_user,
            name='Other Business',
            industry='Tech'
        )

        # Create products
        self.prod_a = Product.objects.create(
            business=self.business,
            name='Product A',
            sku='PROD-A',
            price=10.0
        )
        self.prod_b = Product.objects.create(
            business=self.business,
            name='Product B',
            sku='PROD-B',
            price=20.0
        )
        self.other_prod = Product.objects.create(
            business=self.other_business,
            name='Other Product',
            sku='OTHER-P',
            price=15.0
        )

        # Setup Sales records for current period (e.g. 2026-08-01 to 2026-08-05)
        # Sales total revenue = 500 (Product A: 200, Product B: 300)
        # Sales total quantity = 25 (Product A: 20, Product B: 5)
        SalesRecord.objects.create(
            business=self.business,
            product=self.prod_a,
            date=datetime.date(2026, 8, 1),
            quantity=10,
            revenue=100.0,
            unit_price=10.0
        )
        SalesRecord.objects.create(
            business=self.business,
            product=self.prod_a,
            date=datetime.date(2026, 8, 3),
            quantity=10,
            revenue=100.0,
            unit_price=10.0
        )
        SalesRecord.objects.create(
            business=self.business,
            product=self.prod_b,
            date=datetime.date(2026, 8, 5),
            quantity=5,
            revenue=300.0,
            unit_price=60.0
        )

        # Sales records for previous period (e.g. 2026-07-27 to 2026-07-31)
        # Prev total revenue = 200 (Product A: 100, Product B: 100)
        # Prev total quantity = 15 (Product A: 10, Product B: 5)
        SalesRecord.objects.create(
            business=self.business,
            product=self.prod_a,
            date=datetime.date(2026, 7, 28),
            quantity=10,
            revenue=100.0,
            unit_price=10.0
        )
        SalesRecord.objects.create(
            business=self.business,
            product=self.prod_b,
            date=datetime.date(2026, 7, 30),
            quantity=5,
            revenue=100.0,
            unit_price=20.0
        )

    def test_calculate_revenue_metrics(self):
        # Query matching 2026-08-01 to 2026-08-05 (5 days)
        # Expected duration = 5 days
        # Previous period will be 2026-07-27 to 2026-07-31 (5 days)
        metrics = SalesAnalyticsService.calculate_revenue_metrics(
            business=self.business,
            start_date='2026-08-01',
            end_date='2026-08-05'
        )

        self.assertEqual(metrics['total_revenue'], 500.0)
        self.assertEqual(metrics['total_quantity'], 25)
        self.assertEqual(metrics['average_unit_price'], 20.0)  # 500 / 25
        self.assertEqual(metrics['transaction_count'], 3)
        self.assertEqual(metrics['previous_revenue'], 200.0)
        self.assertEqual(metrics['previous_quantity'], 15)
        # Revenue growth pct: (500 - 200) / 200 * 100 = 150.0
        self.assertEqual(metrics['revenue_growth_pct'], 150.0)
        # Quantity growth pct: (25 - 15) / 15 * 100 = 66.67
        self.assertEqual(metrics['quantity_growth_pct'], 66.67)

    def test_calculate_revenue_metrics_no_data(self):
        metrics = SalesAnalyticsService.calculate_revenue_metrics(
            business=self.business,
            start_date='2026-01-01',
            end_date='2026-01-05'
        )
        self.assertEqual(metrics['total_revenue'], 0.0)
        self.assertEqual(metrics['revenue_growth_pct'], 0.0)

    def test_analyze_sales_trends_daily(self):
        trends = SalesAnalyticsService.analyze_sales_trends(
            business=self.business,
            start_date='2026-08-01',
            end_date='2026-08-05',
            interval='daily'
        )
        # Daily should have exactly 5 elements (Aug 1, 2, 3, 4, 5)
        self.assertEqual(len(trends), 5)
        
        # Check specific values
        self.assertEqual(trends[0]['date'], '2026-08-01')
        self.assertEqual(trends[0]['revenue'], 100.0)
        
        self.assertEqual(trends[1]['date'], '2026-08-02')
        self.assertEqual(trends[1]['revenue'], 0.0)  # Padded/reindexed day
        
        self.assertEqual(trends[2]['date'], '2026-08-03')
        self.assertEqual(trends[2]['revenue'], 100.0)

        self.assertEqual(trends[4]['date'], '2026-08-05')
        self.assertEqual(trends[4]['revenue'], 300.0)

    def test_analyze_sales_trends_weekly(self):
        trends = SalesAnalyticsService.analyze_sales_trends(
            business=self.business,
            start_date='2026-08-01',
            end_date='2026-08-05',
            interval='weekly'
        )
        # It should aggregate daily values to Sundays.
        # Aug 1 (Saturday), Aug 3 (Monday), Aug 5 (Wednesday).
        # Weeks will be generated to cover Sunday bounds.
        self.assertTrue(len(trends) >= 1)

    def test_analyze_sales_trends_monthly(self):
        trends = SalesAnalyticsService.analyze_sales_trends(
            business=self.business,
            start_date='2026-07-01',
            end_date='2026-08-31',
            interval='monthly'
        )
        # Should have exactly 2 months (2026-07 and 2026-08)
        self.assertEqual(len(trends), 2)
        self.assertEqual(trends[0]['date'], '2026-07')
        self.assertEqual(trends[0]['revenue'], 200.0)
        self.assertEqual(trends[1]['date'], '2026-08')
        self.assertEqual(trends[1]['revenue'], 500.0)

    def test_calculate_product_performance(self):
        performance = SalesAnalyticsService.calculate_product_performance(
            business=self.business,
            start_date='2026-08-01',
            end_date='2026-08-05'
        )
        # We have 2 products.
        self.assertEqual(len(performance), 2)
        
        # Product B should be first because it has 300 revenue vs Product A's 200
        self.assertEqual(performance[0]['product_sku'], 'PROD-B')
        self.assertEqual(performance[0]['total_revenue'], 300.0)
        self.assertEqual(performance[0]['revenue_share_pct'], 60.0)  # 300 / 500 * 100

        self.assertEqual(performance[1]['product_sku'], 'PROD-A')
        self.assertEqual(performance[1]['total_revenue'], 200.0)
        self.assertEqual(performance[1]['revenue_share_pct'], 40.0)  # 200 / 500 * 100

    def test_analyze_seasonal_patterns(self):
        seasonality = SalesAnalyticsService.analyze_seasonal_patterns(self.business)
        
        # Check monthly seasonality (12 items)
        self.assertEqual(len(seasonality['monthly']), 12)
        # August month index is 8 (0-indexed 7)
        aug_data = next(m for m in seasonality['monthly'] if m['month'] == 'August')
        self.assertEqual(aug_data['revenue'], 500.0)
        self.assertEqual(aug_data['percentage'], 71.43) # 500 / 700 * 100

        # Check weekly seasonality (7 items)
        self.assertEqual(len(seasonality['weekly']), 7)

        # Check quarterly seasonality (4 items)
        self.assertEqual(len(seasonality['quarterly']), 4)
        q3_data = next(q for q in seasonality['quarterly'] if q['quarter'] == 'Q3')
        self.assertEqual(q3_data['revenue'], 700.0)  # July + August are in Q3
        self.assertEqual(q3_data['percentage'], 100.0)


class SalesAnalyticsViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create users
        self.user = User.objects.create_user(
            username='api_user',
            email='api@test.com',
            password='password123'
        )
        self.other_user = User.objects.create_user(
            username='other_api_user',
            email='other_api@test.com',
            password='password123'
        )

        # Create business
        self.business = Business.objects.create(
            owner=self.user,
            name='API Business',
            industry='Services'
        )
        self.other_business = Business.objects.create(
            owner=self.other_user,
            name='Other API Business',
            industry='Manufacturing'
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)
        self.url = reverse('sales-analytics')

    def test_get_analytics_success(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_id'], self.business.id)
        self.assertIn('metrics', response.data)
        self.assertIn('trends', response.data)
        self.assertIn('product_performance', response.data)
        self.assertIn('seasonality', response.data)

    def test_get_analytics_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_analytics_specific_business(self):
        # Accessing own business explicitly
        response = self.client.get(self.url, {'business_id': self.business.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Accessing someone else's business -> should return 404
        response = self.client.get(self.url, {'business_id': self.other_business.id})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_analytics_no_business(self):
        # Create user with no business
        no_biz_user = User.objects.create_user(
            username='no_biz_user',
            email='nobiz@test.com',
            password='password123'
        )
        self.client.force_authenticate(user=no_biz_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You must create a business before viewing analytics.", response.data['detail'])

    def test_get_analytics_invalid_params(self):
        # Invalid date
        response = self.client.get(self.url, {'start_date': 'invalid-date'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid interval
        response = self.client.get(self.url, {'interval': 'yearly'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid limit
        response = self.client.get(self.url, {'limit': '-5'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
