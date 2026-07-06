import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

import pandas as pd
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from businesses.models import Business
from integrations.models import ColumnMapping
from integrations.services import (
    TemporaryStorageService,
    ColumnDetectionService,
    ColumnMappingService
)

User = get_user_model()


class TemporaryStorageServiceTest(TestCase):
    def setUp(self):
        # Create a temporary directory for MEDIA_ROOT to avoid clobbering real media
        self.temp_media = tempfile.TemporaryDirectory()
        self.override_media = override_settings(MEDIA_ROOT=self.temp_media.name)
        self.override_media.enable()

    def tearDown(self):
        self.override_media.disable()
        self.temp_media.cleanup()

    def test_save_temp_file_valid_csv(self):
        uploaded_file = SimpleUploadedFile("test_data.csv", b"col1,col2\n1,2")
        temp_file_id = TemporaryStorageService.save_temp_file(uploaded_file)

        self.assertTrue(temp_file_id.endswith(".csv"))
        file_path = TemporaryStorageService.get_temp_file_path(temp_file_id)
        self.assertTrue(file_path.exists())
        self.assertTrue(file_path.is_file())

    def test_save_temp_file_invalid_extension(self):
        uploaded_file = SimpleUploadedFile("test_data.txt", b"some plain text")
        with self.assertRaises(ValidationError) as ctx:
            TemporaryStorageService.save_temp_file(uploaded_file)
        self.assertIn("Unsupported file format", str(ctx.exception))

    def test_get_temp_file_path_validation(self):
        # Traversal attempts
        with self.assertRaises(ValidationError):
            TemporaryStorageService.get_temp_file_path("../malicious.csv")
        with self.assertRaises(ValidationError):
            TemporaryStorageService.get_temp_file_path("sub/folder/file.csv")

    def test_delete_temp_file(self):
        uploaded_file = SimpleUploadedFile("test_data.csv", b"col1,col2")
        temp_file_id = TemporaryStorageService.save_temp_file(uploaded_file)
        file_path = TemporaryStorageService.get_temp_file_path(temp_file_id)
        self.assertTrue(file_path.exists())

        deleted = TemporaryStorageService.delete_temp_file(temp_file_id)
        self.assertTrue(deleted)
        self.assertFalse(file_path.exists())


class ColumnDetectionServiceTest(TestCase):
    def setUp(self):
        self.temp_media = tempfile.TemporaryDirectory()
        self.override_media = override_settings(MEDIA_ROOT=self.temp_media.name)
        self.override_media.enable()

    def tearDown(self):
        self.override_media.disable()
        self.temp_media.cleanup()

    def test_detect_csv_headers(self):
        csv_content = b"  Date, Product SKU, Quantity,  Revenue \n2023-01-01,prod-1,5,100"
        uploaded_file = SimpleUploadedFile("sales.csv", csv_content)
        temp_file_id = TemporaryStorageService.save_temp_file(uploaded_file)
        file_path = TemporaryStorageService.get_temp_file_path(temp_file_id)

        headers = ColumnDetectionService.detect_headers(file_path)
        self.assertEqual(headers, ["Date", "Product SKU", "Quantity", "Revenue"])

    def test_detect_excel_headers(self):
        excel_path = Path(self.temp_media.name) / "test.xlsx"
        df = pd.DataFrame(columns=["Transaction Date", "Item Name", "Qty"])
        df.to_excel(excel_path, index=False)

        headers = ColumnDetectionService.detect_headers(excel_path)
        self.assertEqual(headers, ["Transaction Date", "Item Name", "Qty"])


class ColumnMappingServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@bizpulse.com", username="testuser", password="password123")
        self.business = Business.objects.create(owner=self.user, name="Test Business", industry="Retail")

    def test_suggest_mappings_with_exact_matches(self):
        headers = ["date", "product_name", "quantity", "revenue"]
        suggestions = ColumnMappingService.get_suggestions(self.business, "sales", headers)

        # Exact match should have confidence 1.0
        self.assertEqual(len(suggestions), 4)
        for s in suggestions:
            self.assertEqual(s['confidence'], 1.0)
            self.assertEqual(s['original_column'], s['mapped_column'])

    def test_suggest_mappings_with_aliases(self):
        headers = ["Qty Sold", "Item SKU", "Total Amount"]
        suggestions = ColumnMappingService.get_suggestions(self.business, "sales", headers)

        qty_suggestion = next(s for s in suggestions if s['original_column'] == "Qty Sold")
        self.assertEqual(qty_suggestion['mapped_column'], "quantity")
        self.assertEqual(qty_suggestion['confidence'], 1.0)

        sku_suggestion = next(s for s in suggestions if s['original_column'] == "Item SKU")
        self.assertEqual(sku_suggestion['mapped_column'], "product_name")
        self.assertEqual(sku_suggestion['confidence'], 1.0)

        rev_suggestion = next(s for s in suggestions if s['original_column'] == "Total Amount")
        self.assertEqual(rev_suggestion['mapped_column'], "revenue")
        self.assertEqual(rev_suggestion['confidence'], 1.0)

    def test_suggest_mappings_fuzzy_fallback(self):
        headers = ["prod name fuzzy", "unrelated column here"]
        suggestions = ColumnMappingService.get_suggestions(self.business, "sales", headers)

        fuzzy_prod = next(s for s in suggestions if s['original_column'] == "prod name fuzzy")
        self.assertEqual(fuzzy_prod['mapped_column'], "product_name")
        self.assertTrue(0.4 <= fuzzy_prod['confidence'] < 1.0)

        unrelated = next(s for s in suggestions if s['original_column'] == "unrelated column here")
        self.assertIsNone(unrelated['mapped_column'])
        self.assertEqual(unrelated['confidence'], 0.0)

    def test_suggest_mappings_db_saved_priority(self):
        # Create a database mapping
        ColumnMapping.objects.create(
            business=self.business,
            source_type="sales",
            original_column="unrelated column here",
            mapped_column="cost",
            confidence=0.5
        )

        headers = ["unrelated column here"]
        suggestions = ColumnMappingService.get_suggestions(self.business, "sales", headers)

        # Should retrieve from DB and assign confidence 1.0
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]['mapped_column'], "cost")
        self.assertEqual(suggestions[0]['confidence'], 1.0)


class UploadWorkflowAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@bizpulse.com", username="testuser", password="password123")
        self.business = Business.objects.create(owner=self.user, name="Test Business", industry="Retail")
        self.client.force_authenticate(user=self.user)

        self.temp_media = tempfile.TemporaryDirectory()
        self.override_media = override_settings(MEDIA_ROOT=self.temp_media.name)
        self.override_media.enable()

    def tearDown(self):
        self.override_media.disable()
        self.temp_media.cleanup()

    def test_upload_file_endpoint_success(self):
        csv_content = b"date,qty,revenue\n2023-01-01,5,100"
        uploaded_file = SimpleUploadedFile("sales.csv", csv_content, content_type="text/csv")

        url = reverse('file-upload')
        response = self.client.post(url, {'file': uploaded_file, 'source_type': 'sales'}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("temp_file_id", response.data)
        self.assertEqual(response.data["headers"], ["date", "qty", "revenue"])

        # Check suggestions
        suggestions = response.data["suggested_mappings"]
        self.assertEqual(len(suggestions), 3)
        qty_suggest = next(s for s in suggestions if s['original_column'] == 'qty')
        self.assertEqual(qty_suggest['mapped_column'], 'quantity')

    def test_upload_file_no_business_fails(self):
        user_no_biz = User.objects.create_user(email="nobiz@bizpulse.com", username="nobizuser", password="password123")
        self.client.force_authenticate(user=user_no_biz)

        csv_content = b"date,qty,revenue\n2023-01-01,5,100"
        uploaded_file = SimpleUploadedFile("sales.csv", csv_content, content_type="text/csv")

        url = reverse('file-upload')
        response = self.client.post(url, {'file': uploaded_file, 'source_type': 'sales'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Business profile not found", response.data["detail"])

    def test_bulk_save_column_mappings(self):
        url = reverse('column-mapping-bulk-save')
        data = {
            "source_type": "sales",
            "mappings": [
                {"original_column": "Date of transaction", "mapped_column": "date"},
                {"original_column": "Qty", "mapped_column": "quantity"}
            ]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Verify database record exists
        mappings = ColumnMapping.objects.filter(business=self.business, source_type='sales')
        self.assertEqual(mappings.count(), 2)

        # Test validation on bulk save (invalid target column name)
        invalid_data = {
            "source_type": "sales",
            "mappings": [
                {"original_column": "bad column", "mapped_column": "invalid_target_field"}
            ]
        }
        response = self.client.post(url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
