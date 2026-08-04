import datetime
import unittest
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from businesses.models import Business
from integrations.models import GoogleTrendsData
from integrations.services import GoogleTrendsService

User = get_user_model()


class GoogleTrendsServiceCollectionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='collection@test.com',
            username='collection_user',
            password='password123',
        )
        self.business = Business.objects.create(
            owner=self.user,
            name='Trend Business',
            industry='Retail',
        )

    def test_collect_trends_persists_records(self):
        service = GoogleTrendsService()
        idx = timezone.now().date() - datetime.timedelta(days=1)
        import pandas as pd
        df = pd.DataFrame(
            {
                'Wireless Earbuds': [10, 20, 30],
                'isPartial': [False, False, False],
            },
            index=[
                pd.Timestamp(idx - datetime.timedelta(days=2)),
                pd.Timestamp(idx - datetime.timedelta(days=1)),
                pd.Timestamp(idx),
            ],
        )

        mock_client = MagicMock()
        mock_client.interest_over_time.return_value = df
        service._client = mock_client

        series = service.collect_trends(self.business, ['Wireless Earbuds'], region='worldwide', days=3)
        self.assertEqual(len(series['Wireless Earbuds']), 3)
        self.assertEqual(GoogleTrendsData.objects.filter(business=self.business, keyword='Wireless Earbuds').count(), 3)

    def test_get_time_series_reads_from_db(self):
        today = timezone.now().date()
        GoogleTrendsData.objects.create(
            business=self.business,
            keyword='Running Shoes',
            region='worldwide',
            date=today - datetime.timedelta(days=1),
            interest_score=42,
        )
        GoogleTrendsData.objects.create(
            business=self.business,
            keyword='Running Shoes',
            region='worldwide',
            date=today,
            interest_score=55,
        )

        service = GoogleTrendsService()
        series = service.get_time_series(self.business, ['Running Shoes'], region='worldwide', days=2)
        self.assertEqual(len(series['Running Shoes']), 2)
        self.assertEqual(series['Running Shoes'][-1]['interest'], 55.0)

    def test_collect_upserts_on_recollection(self):
        today = timezone.now().date()
        GoogleTrendsData.objects.create(
            business=self.business,
            keyword='Smartphones',
            region='worldwide',
            date=today - datetime.timedelta(days=2),
            interest_score=10,
            fetched_at=timezone.now() - datetime.timedelta(days=5),
        )
        service = GoogleTrendsService()
        idx = today - datetime.timedelta(days=2)
        import pandas as pd
        df = pd.DataFrame(
            {'Smartphones': [99], 'isPartial': [False]},
            index=[pd.Timestamp(idx)],
        )
        mock_client = MagicMock()
        mock_client.interest_over_time.return_value = df
        service._client = mock_client

        service.collect_trends(self.business, ['Smartphones'], region='worldwide', days=3)
        self.assertEqual(GoogleTrendsData.objects.filter(business=self.business, keyword='Smartphones').count(), 1)
        refreshed = GoogleTrendsData.objects.get(business=self.business, keyword='Smartphones', date=idx)
        self.assertEqual(refreshed.interest_score, 99)
