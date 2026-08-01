import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from businesses.models import Business
from products.models import Product
from analytics.models import CustomerReview, ReviewSentiment, ComplaintCategory
from analytics.services.nlp_service import NLPService
from analytics.services.customer_intelligence import CustomerIntelligenceService

User = get_user_model()


class CustomerIntelligenceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='cust_user',
            email='cust@test.com',
            password='password123'
        )
        self.business = Business.objects.create(
            owner=self.user,
            name='Cust Business',
            industry='Retail'
        )
        self.product = Product.objects.create(
            business=self.business,
            name='Soap',
            sku='SOAP-01',
            price=5.0
        )

        # Create positive, negative and neutral reviews
        # Review 1: Positive rating, positive words -> Positive
        CustomerReview.objects.create(
            business=self.business,
            product=self.product,
            source='Google',
            review_date=datetime.date(2026, 8, 1),
            rating=5,
            text="This soap is amazing! Very helpful and friendly support too.",
            author_name="Alice"
        )
        # Review 2: Low rating, negative keywords -> Negative
        CustomerReview.objects.create(
            business=self.business,
            product=self.product,
            source='Google',
            review_date=datetime.date(2026, 8, 2),
            rating=1,
            text="Worst product ever! It broke immediately, very disappointed.",
            author_name="Bob"
        )
        # Review 3: Neutral rating, no strongly positive/negative words -> Neutral
        CustomerReview.objects.create(
            business=self.business,
            product=self.product,
            source='Yelp',
            review_date=datetime.date(2026, 7, 15),
            rating=3,
            text="Okay product, but expensive price and shipping was slow.",
            author_name="Charlie"
        )

    def test_nlp_sentiment_analysis(self):
        # 1. Test positive text
        sentiment, conf = NLPService.analyze_sentiment("This is a great and awesome product", rating=5)
        self.assertEqual(sentiment, 'positive')

        # 2. Test negative text
        sentiment, conf = NLPService.analyze_sentiment("Bad service and slow delivery", rating=1)
        self.assertEqual(sentiment, 'negative')

        # 3. Test neutral
        sentiment, conf = NLPService.analyze_sentiment("It is okay", rating=3)
        self.assertEqual(sentiment, 'neutral')

    def test_nlp_complaint_classification(self):
        # Review 2 text: "Worst product ever! It broke immediately, very disappointed."
        # Keywords matched: "broke" -> Product Quality
        cats = NLPService.classify_complaints(
            "Worst product ever! It broke immediately, very disappointed.",
            sentiment='negative',
            rating=1
        )
        self.assertIn('Product Quality', cats)

        # Review 3 text: "Okay product, but expensive price and shipping was slow."
        # Keywords matched: "price" -> Pricing & Billing, "shipping" -> Shipping & Delivery
        cats_3 = NLPService.classify_complaints(
            "Okay product, but expensive price and shipping was slow.",
            sentiment='neutral',
            rating=3
        )
        self.assertIn('Pricing & Billing', cats_3)
        self.assertIn('Shipping & Delivery', cats_3)

    def test_calculate_satisfaction_metrics(self):
        # Trigger NLP processing & metric calculation
        metrics = CustomerIntelligenceService.calculate_satisfaction_metrics(self.business)

        # Verify average rating: (5 + 1 + 3) / 3 = 3.0
        self.assertEqual(metrics['average_rating'], 3.0)
        # CSAT: rating >= 4 is 1 review (Alice's). Total reviews = 3. CSAT = 33.33%
        self.assertEqual(metrics['csat_score_pct'], 33.33)
        self.assertEqual(metrics['total_reviews'], 3)

        # Verify sentiment counts: 1 positive, 2 negative, 0 neutral
        self.assertEqual(metrics['sentiment_distribution']['positive'], 1)
        self.assertEqual(metrics['sentiment_distribution']['negative'], 2)
        self.assertEqual(metrics['sentiment_distribution']['neutral'], 0)

        # Verify complaint category counts
        # Alice's review should not trigger complaint categories (positive sentiment, 5 stars)
        # Bob's review -> Product Quality
        # Charlie's review -> Pricing & Billing, Shipping & Delivery
        categories = [c['category'] for c in metrics['complaints_by_category']]
        self.assertIn('Product Quality', categories)
        self.assertIn('Pricing & Billing', categories)
        self.assertIn('Shipping & Delivery', categories)

        # Verify trends resampled by month
        self.assertEqual(len(metrics['trends']), 2) # July and August 2026


class CustomerIntelligenceViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='api_cust_user',
            email='api_cust@test.com',
            password='password123'
        )
        self.business = Business.objects.create(
            owner=self.user,
            name='API Cust Business',
            industry='Retail'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('customer-analysis')

    def test_get_customer_analytics_success(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_id'], self.business.id)
        self.assertIn('average_rating', response.data)
        self.assertIn('csat_score_pct', response.data)
        self.assertIn('sentiment_distribution', response.data)
        self.assertIn('complaints_by_category', response.data)
        self.assertIn('recent_complaints', response.data)
        self.assertIn('trends', response.data)
