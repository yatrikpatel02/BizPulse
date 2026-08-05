from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from businesses.models import Business
from reports.models import Report

User = get_user_model()


class ReportViewSetTest(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpassword')
        self.other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='otherpassword')

        # Create businesses
        self.business = Business.objects.create(name='Test Business', owner=self.user)
        self.other_business = Business.objects.create(name='Other Business', owner=self.other_user)

        # Authenticate main user
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_report(self):
        url = reverse('report-list')
        data = {
            'report_type': 'sales',
            'parameters': {
                'start_date': '2023-01-01',
                'end_date': '2025-12-31',
                'file_format': 'PDF'
            }
        }
        # Include custom header X-Business-Id
        self.client.credentials(HTTP_X_BUSINESS_ID=self.business.id)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)
        
        report = Report.objects.first()
        self.assertEqual(report.business, self.business)
        self.assertEqual(report.report_type, 'sales')
        self.assertEqual(report.status, 'completed')
        self.assertEqual(report.file_path, f"/media/reports/{self.business.id}_sales.pdf")

    def test_list_reports(self):
        # Create reports
        Report.objects.create(business=self.business, report_type='sales', status='completed')
        Report.objects.create(business=self.business, report_type='inventory', status='completed')
        # Create other user's report (should not be visible)
        Report.objects.create(business=self.other_business, report_type='executive', status='completed')

        url = reverse('report-list')
        self.client.credentials(HTTP_X_BUSINESS_ID=self.business.id)
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that we only see reports belonging to our business
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
        report_types = [item['report_type'] for item in results]
        self.assertIn('sales', report_types)
        self.assertIn('inventory', report_types)
        self.assertNotIn('executive', report_types)

    def test_delete_report(self):
        report = Report.objects.create(business=self.business, report_type='sales', status='completed')
        url = reverse('report-detail', args=[report.id])
        
        self.client.credentials(HTTP_X_BUSINESS_ID=self.business.id)
        response = self.client.delete(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Report.objects.filter(id=report.id).count(), 0)

    def test_unauthenticated_access_denied(self):
        self.client.force_authenticate(user=None)
        url = reverse('report-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
