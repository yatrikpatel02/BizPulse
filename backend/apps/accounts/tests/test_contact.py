from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from ..models import ContactSubmission

class ContactSubmissionAPITests(APITestCase):
    def setUp(self):
        self.url = reverse('contact_submit')
        self.valid_payload = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'subject': 'Inquiry about Services',
            'message': 'Hello, I would like to know more about BizPulse.'
        }
        self.invalid_payload = {
            'name': '',
            'email': 'invalid-email',
            'subject': '',
            'message': ''
        }

    def test_contact_submission_success(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('detail', response.data)
        self.assertEqual(ContactSubmission.objects.count(), 1)
        
        submission = ContactSubmission.objects.first()
        self.assertEqual(submission.name, 'John Doe')
        self.assertEqual(submission.email, 'john@example.com')
        self.assertEqual(submission.subject, 'Inquiry about Services')
        self.assertEqual(submission.message, 'Hello, I would like to know more about BizPulse.')

    def test_contact_submission_invalid_data(self):
        response = self.client.post(self.url, self.invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('email', response.data)
        self.assertIn('subject', response.data)
        self.assertIn('message', response.data)
        self.assertEqual(ContactSubmission.objects.count(), 0)
