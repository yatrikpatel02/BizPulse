import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from businesses.models import Business
from integrations.models import GoogleTrendsData
from products.models import Product
from analytics.models import SalesRecord, InventorySnapshot
from analytics.models import Insight

User = get_user_model()


class MarketInsightsApiTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='market@test.com',
            username='market_user',
            password='password123',
        )
        self.business = Business.objects.create(
            owner=self.user,
            name='Market Business',
            industry='Retail',
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('market-insights')

    def _seed_trend_data(self, keyword, interest_values, days_back_start=89, region='worldwide'):
        today = timezone.now().date()
        start = today - datetime.timedelta(days=days_back_start)
        for i, v in enumerate(interest_values):
            GoogleTrendsData.objects.create(
                business=self.business,
                keyword=keyword,
                region=region,
                date=start + datetime.timedelta(days=i),
                interest_score=int(v),
            )

    def test_returns_insights_for_keywords(self):
        values = [30] * 76 + [60] * 14
        self._seed_trend_data('Wireless Earbuds', values)

        response = self.client.get(self.url, {'keywords': 'Wireless Earbuds', 'business_id': self.business.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('insights', response.data)
        self.assertEqual(len(response.data['insights']), 1)
        insight = response.data['insights'][0]
        self.assertEqual(insight['keyword'], 'Wireless Earbuds')
        self.assertEqual(insight['insight_type'], 'Opportunity')
        self.assertIn('recommended_actions', insight)
        self.assertIn('confidence_score', insight)
        self.assertEqual(insight['market_intelligence']['intelligence_type'], 'market')
        self.assertEqual(insight['market_intelligence']['title'], 'Rising Market Interest')
        self.assertEqual(Insight.objects.filter(business=self.business, insight_type='market_intelligence').count(), 1)

    def test_requires_keywords(self):
        response = self.client.get(self.url, {'business_id': self.business.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_no_business(self):
        Business.objects.filter(owner=self.user).delete()
        response = self.client.get(self.url, {'keywords': 'Smartphones'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_multiple_keywords_return_multiple_insights(self):
        self._seed_trend_data('A', [30] * 76 + [60] * 14)
        self._seed_trend_data('B', [60] * 76 + [20] * 14)

        response = self.client.get(self.url, {
            'keywords': 'A,B',
            'business_id': self.business.id,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['insights']), 2)
        keywords = {i['keyword'] for i in response.data['insights']}
        self.assertEqual(keywords, {'A', 'B'})

    def test_duplicate_keyword_generates_one_insight(self):
        self._seed_trend_data('Vitamin C Face Serum 30ml', [30] * 76 + [60] * 14)
        response = self.client.get(self.url, {
            'keywords': 'Vitamin C Face Serum 30ml, vitamin c face serum 30ML',
            'business_id': self.business.id,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['insights']), 1)

    def test_business_product_combines_trends_sales_and_inventory(self):
        keyword = 'Nike Running Shoes'
        self._seed_trend_data(keyword, [30] * 76 + [60] * 14)
        product = Product.objects.create(business=self.business, name=keyword, sku='nike-1', price=100)
        today = timezone.now().date()
        for offset in range(60):
            quantity = 10 if offset < 30 else 20
            SalesRecord.objects.create(business=self.business, product=product,
                date=today - datetime.timedelta(days=59 - offset), quantity=quantity, revenue=quantity * 100)
        InventorySnapshot.objects.create(business=self.business, product=product,
            date=today - datetime.timedelta(days=30), quantity_on_hand=100)
        InventorySnapshot.objects.create(business=self.business, product=product,
            date=today, quantity_on_hand=70)

        response = self.client.get(self.url, {'keywords': keyword, 'business_id': self.business.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['insights'][0]['market_intelligence']['title'], 'High Demand & Stock Risk')
