"""
Tests for the Machine Learning API endpoints (Phase 5.3).
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch

from businesses.models import Business
from products.models import Product
from analytics.models import Prediction

User = get_user_model()


class MLAPIViewTest(TestCase):
    """
    Tests for the ML API endpoints.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        cls.business = Business.objects.create(name="Test Business", industry="Retail", owner=cls.user)
        cls.product = Product.objects.create(name="Test Product", business=cls.business, price=100.00)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_train_endpoint_requires_auth(self):
        """Unauthenticated requests should return 401."""
        client = APIClient()
        response = client.post(reverse('ml-train'), {'business_id': self.business.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("analytics.views.ml_views.TrainAllModelsPipeline")
    def test_train_endpoint_success(self, mock_pipeline_class):
        """Authenticated POST should trigger training and return results."""
        mock_pipeline = mock_pipeline_class.return_value
        mock_pipeline.run.return_value = {
            "sales_forecast": {"best_model": "random_forest"},
            "demand_forecast": {"best_model": "random_forest"},
        }
        response = self.client.post(
            reverse('ml-train'),
            {'business_id': self.business.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_train_endpoint_not_found(self):
        """Invalid business_id should return 404."""
        response = self.client.post(
            reverse('ml-train'),
            {'business_id': 99999},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("analytics.services.ml_service.PredictionService")
    def test_predict_endpoint_success(self, mock_pred_service_class):
        """Authenticated POST to predict should return a prediction."""
        mock_service = mock_pred_service_class.return_value
        mock_service.predict_sales.return_value = {
            'predicted_value': 42.0,
            'confidence_score': 0.95,
            'model_used': 'random_forest',
            'model_version': '1.0',
            'prediction_date': '2024-01-15',
        }
        response = self.client.post(
            reverse('ml-predict'),
            {
                'business_id': self.business.id,
                'product_id': self.product.id,
                'prediction_type': 'sales_forecast',
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('prediction', response.data)
        self.assertIn('confidence_score', response.data)
        self.assertIn('model_used', response.data)
        self.assertIn('model_version', response.data)

    def test_predict_endpoint_product_not_found(self):
        """Invalid product_id should return 404."""
        response = self.client.post(
            reverse('ml-predict'),
            {
                'business_id': self.business.id,
                'product_id': 99999,
                'prediction_type': 'sales_forecast',
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_predict_endpoint_no_model(self):
        """Prediction when no model is trained should return 404."""
        response = self.client.post(
            reverse('ml-predict'),
            {
                'business_id': self.business.id,
                'product_id': self.product.id,
                'prediction_type': 'sales_forecast',
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_predictions_list(self):
        """Authenticated GET should return prediction history."""
        Prediction.objects.create(
            business=self.business,
            product=self.product,
            prediction_type='sales_forecast',
            period_start='2024-01-01',
            period_end='2024-01-07',
            value=100.0,
            confidence=0.95,
            model_name='RandomForest',
            model_version='1.0',
        )
        response = self.client.get(reverse('ml-predictions'), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_models_list_no_models(self):
        """GET models should return empty when no models are saved."""
        response = self.client.get(
            reverse('ml-models') + f'?business_id={self.business.id}',
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
