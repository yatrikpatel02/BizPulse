import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from businesses.models import Business
from integrations.models import GoogleTrendsData

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
        values = [30] * 60 + [60] * 30
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

    def test_requires_keywords(self):
        response = self.client.get(self.url, {'business_id': self.business.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returns_400_when_no_business(self):
        Business.objects.filter(owner=self.user).delete()
        response = self.client.get(self.url, {'keywords': 'Smartphones'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_multiple_keywords_return_multiple_insights(self):
        self._seed_trend_data('A', [30] * 60 + [60] * 30)
        self._seed_trend_data('B', [60] * 60 + [20] * 30)

        response = self.client.get(self.url, {
            'keywords': 'A,B',
            'business_id': self.business.id,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['insights']), 2)
        keywords = {i['keyword'] for i in response.data['insights']}
        self.assertEqual(keywords, {'A', 'B'})
