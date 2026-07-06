import os
import tempfile
from pathlib import Path
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from businesses.models import Business
from products.models import Product
from integrations.models import ImportBatch, ColumnMapping
from integrations.services import TemporaryStorageService
from analytics.models import SalesRecord, InventorySnapshot, CustomerReview

User = get_user_model()


class DataImportEndpointsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@bizpulse.com", username="testuser", password="password123")
        self.business = Business.objects.create(owner=self.user, name="Test Business", industry="Retail")
        self.client.force_authenticate(user=self.user)

        self.temp_media = tempfile.TemporaryDirectory()
        self.override_media = override_settings(MEDIA_ROOT=self.temp_media.name)
        self.override_media.enable()

        # Create a mock CSV file to run tests with
        self.csv_content = b"Date,Product,Qty,Rev,Cost\n2023-01-01,prod-x,10,200.00,80.00\n2023-01-02,prod-y,5,100.00,40.00"
        self.uploaded_file = SimpleUploadedFile("sales.csv", self.csv_content, content_type="text/csv")
        self.temp_file_id = TemporaryStorageService.save_temp_file(self.uploaded_file)

        self.mapping = {
            "Date": "date",
            "Product": "product_name",
            "Qty": "quantity",
            "Rev": "revenue",
            "Cost": "cost"
        }

    def tearDown(self):
        self.override_media.disable()
        self.temp_media.cleanup()

    def test_import_preview_endpoint(self):
        url = reverse('import-preview')
        data = {
            "temp_file_id": self.temp_file_id,
            "source_type": "sales",
            "mapping": self.mapping
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_rows"], 2)
        self.assertEqual(response.data["cleaned_rows_count"], 2)
        self.assertEqual(len(response.data["preview_data"]), 2)
        self.assertIn("validation_report", response.data)

    def test_sales_import_commit_success(self):
        url = reverse('import-sales')
        data = {
            "temp_file_id": self.temp_file_id,
            "mapping": self.mapping,
            "original_filename": "monthly_sales.csv"
        }

        # Assert no products or sales records exist yet
        self.assertEqual(Product.objects.filter(business=self.business).count(), 0)
        self.assertEqual(SalesRecord.objects.filter(business=self.business).count(), 0)

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["records_imported"], 2)

        # Verify ImportBatch creation
        batch_id = response.data["import_batch_id"]
        batch = ImportBatch.objects.get(id=batch_id)
        self.assertEqual(batch.original_filename, "monthly_sales.csv")
        self.assertEqual(batch.dataset_type, "sales")

        # Verify Products and SalesRecords are created
        self.assertEqual(Product.objects.filter(business=self.business).count(), 2)
        self.assertEqual(SalesRecord.objects.filter(business=self.business).count(), 2)

        # Verify that the temporary file has been deleted
        temp_path = Path(settings.MEDIA_ROOT) / TemporaryStorageService.TEMP_DIR_NAME / self.temp_file_id
        self.assertFalse(temp_path.exists())

    def test_inventory_import_commit_success(self):
        # Setup inventory data
        csv_inv = b"Date,Item,Stock,Reorder\n2023-01-01,prod-i,100,20\n2023-01-02,prod-j,150,30"
        uploaded_inv = SimpleUploadedFile("inv.csv", csv_inv, content_type="text/csv")
        temp_id_inv = TemporaryStorageService.save_temp_file(uploaded_inv)

        mapping_inv = {
            "Date": "date",
            "Item": "product_name",
            "Stock": "quantity_on_hand",
            "Reorder": "reorder_point"
        }

        url = reverse('import-inventory')
        data = {
            "temp_file_id": temp_id_inv,
            "mapping": mapping_inv,
            "original_filename": "inv_data.csv"
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["records_imported"], 2)

        # Verify snapshots exist in database
        self.assertEqual(InventorySnapshot.objects.filter(business=self.business).count(), 2)

        # Verify temp file is deleted
        temp_path = Path(settings.MEDIA_ROOT) / TemporaryStorageService.TEMP_DIR_NAME / temp_id_inv
        self.assertFalse(temp_path.exists())

    def test_reviews_import_commit_success(self):
        # Setup reviews data
        csv_rev = b"Date,Stars,ReviewText,Reviewer\n2023-01-01,5,Great service!,John Doe\n2023-01-02,4,Loved it,Jane"
        uploaded_rev = SimpleUploadedFile("reviews.csv", csv_rev, content_type="text/csv")
        temp_id_rev = TemporaryStorageService.save_temp_file(uploaded_rev)

        mapping_rev = {
            "Date": "date",
            "Stars": "rating",
            "ReviewText": "text",
            "Reviewer": "author_name"
        }

        url = reverse('import-reviews')
        data = {
            "temp_file_id": temp_id_rev,
            "mapping": mapping_rev,
            "original_filename": "reviews_data.csv"
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["records_imported"], 2)

        # Verify CustomerReview entries exist in database
        self.assertEqual(CustomerReview.objects.filter(business=self.business).count(), 2)

        # Verify temp file is deleted
        temp_path = Path(settings.MEDIA_ROOT) / TemporaryStorageService.TEMP_DIR_NAME / temp_id_rev
        self.assertFalse(temp_path.exists())

    def test_transaction_rollback_on_failure(self):
        # Trigger an integrity error during loops (e.g. by providing duplicate unique keys inside mapping or throwing exception)
        # We will map "Qty" to "date" which will cause date parsing to fail inside row processing, or we can map columns to duplicate dates.
        # But wait, date parsing fails in cleaning. What if we insert a row that violates the unique constraint but cleaning didn't drop it?
        # Better yet, let's pass a mapping where we have duplicate products on the same date, but we mock the Product.objects.create to raise an exception.
        # We want to verify that no records are saved to the database.
        
        # We'll trigger a rollback by mapping to an invalid column during base commit,
        # or we mock the model creation. Let's do a mock.
        from unittest.mock import patch
        
        url = reverse('import-sales')
        data = {
            "temp_file_id": self.temp_file_id,
            "mapping": self.mapping,
            "original_filename": "monthly_sales.csv"
        }

        with patch('analytics.models.SalesRecord.objects.update_or_create') as mock_update:
            mock_update.side_effect = Exception("Mocked database write error")

            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("Mocked database write error", response.data["detail"])

            # Verify no ImportBatch or SalesRecord was committed
            self.assertEqual(ImportBatch.objects.filter(business=self.business).count(), 0)
            self.assertEqual(SalesRecord.objects.filter(business=self.business).count(), 0)

            # Temp file should NOT be deleted if transaction fails
            temp_path = Path(settings.MEDIA_ROOT) / TemporaryStorageService.TEMP_DIR_NAME / self.temp_file_id
            self.assertTrue(temp_path.exists())
