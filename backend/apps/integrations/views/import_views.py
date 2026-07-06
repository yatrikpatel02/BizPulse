import pandas as pd
from django.db import transaction
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from integrations.models import ImportBatch
from integrations.services import TemporaryStorageService
from analytics.services import DataValidationService, DataCleaningService
from products.models import Product
from analytics.models import SalesRecord, InventorySnapshot, CustomerReview


class ImportPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        business = getattr(request.user, 'business', None)
        if not business:
            return Response(
                {"detail": "Business profile not found. Please create a business profile first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        temp_file_id = request.data.get('temp_file_id')
        source_type = request.data.get('source_type')
        mapping = request.data.get('mapping')

        if not temp_file_id or not source_type or mapping is None:
            return Response(
                {"detail": "temp_file_id, source_type, and mapping are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            temp_path = TemporaryStorageService.get_temp_file_path(temp_file_id)
            ext = temp_path.suffix.lower()

            if ext == '.csv':
                df = pd.read_csv(temp_path)
            else:
                df = pd.read_excel(temp_path)

            validation_report = DataValidationService.validate_dataset(df, source_type, mapping)
            df_cleaned = DataCleaningService.clean_dataset(df, source_type, mapping)

            # Extract first 10 rows for preview
            preview_records = df_cleaned.head(10).to_dict(orient='records')

            # Clean float NaN values to None for JSON compliance
            cleaned_preview = []
            for rec in preview_records:
                cleaned_rec = {}
                for k, v in rec.items():
                    if pd.isna(v):
                        cleaned_rec[k] = None
                    else:
                        cleaned_rec[k] = v
                cleaned_preview.append(cleaned_rec)

            return Response({
                "total_rows": len(df),
                "cleaned_rows_count": len(df_cleaned),
                "invalid_rows_count": len(df) - len(df_cleaned),
                "validation_report": validation_report,
                "preview_data": cleaned_preview
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"Failed to generate import preview: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class BaseImportCommitView(APIView):
    permission_classes = [IsAuthenticated]

    def get_df_cleaned(self, business, temp_file_id, source_type, mapping):
        temp_path = TemporaryStorageService.get_temp_file_path(temp_file_id)
        ext = temp_path.suffix.lower()

        if ext == '.csv':
            df = pd.read_csv(temp_path)
        else:
            df = pd.read_excel(temp_path)

        df_cleaned = DataCleaningService.clean_dataset(df, source_type, mapping)
        return df_cleaned


class SalesImportCommitView(BaseImportCommitView):
    def post(self, request, *args, **kwargs):
        business = getattr(request.user, 'business', None)
        if not business:
            return Response(
                {"detail": "Business profile not found. Please create a business profile first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        temp_file_id = request.data.get('temp_file_id')
        mapping = request.data.get('mapping')
        original_filename = request.data.get('original_filename', 'uploaded_sales_file.csv')

        if not temp_file_id or mapping is None:
            return Response(
                {"detail": "temp_file_id and mapping are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            df_cleaned = self.get_df_cleaned(business, temp_file_id, 'sales', mapping)

            with transaction.atomic():
                batch = ImportBatch.objects.create(
                    business=business,
                    dataset_type='sales',
                    original_filename=original_filename
                )

                records_created = 0
                for _, row in df_cleaned.iterrows():
                    prod_name = row['product_name']

                    # Resolve or create Product model dynamically
                    product = Product.objects.filter(business=business, name=prod_name).first()
                    if not product:
                        product = Product.objects.filter(business=business, sku=prod_name).first()
                    if not product:
                        sku = prod_name.strip().upper().replace(' ', '_')[:100]
                        base_sku = sku
                        counter = 1
                        while Product.objects.filter(business=business, sku=sku).exists():
                            sku = f"{base_sku[:90]}_{counter}"
                            counter += 1
                        product = Product.objects.create(
                            business=business,
                            name=prod_name,
                            sku=sku,
                            price=0.0
                        )

                    date_val = row['date']
                    qty = int(row['quantity'])
                    rev = float(row['revenue'])
                    unit_price = rev / qty if qty > 0 else 0.0

                    SalesRecord.objects.update_or_create(
                        business=business,
                        product=product,
                        date=date_val,
                        defaults={
                            'quantity': qty,
                            'revenue': rev,
                            'unit_price': unit_price,
                            'import_batch': batch
                        }
                    )
                    records_created += 1

            # Delete temporary file from disk upon successful commit
            TemporaryStorageService.delete_temp_file(temp_file_id)

            return Response({
                "message": "Sales records imported successfully.",
                "import_batch_id": batch.id,
                "records_imported": records_created
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": f"Import execution failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class InventoryImportCommitView(BaseImportCommitView):
    def post(self, request, *args, **kwargs):
        business = getattr(request.user, 'business', None)
        if not business:
            return Response(
                {"detail": "Business profile not found. Please create a business profile first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        temp_file_id = request.data.get('temp_file_id')
        mapping = request.data.get('mapping')
        original_filename = request.data.get('original_filename', 'uploaded_inventory_file.csv')

        if not temp_file_id or mapping is None:
            return Response(
                {"detail": "temp_file_id and mapping are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            df_cleaned = self.get_df_cleaned(business, temp_file_id, 'inventory', mapping)

            with transaction.atomic():
                batch = ImportBatch.objects.create(
                    business=business,
                    dataset_type='inventory',
                    original_filename=original_filename
                )

                records_created = 0
                for _, row in df_cleaned.iterrows():
                    prod_name = row['product_name']

                    # Resolve or create Product
                    product = Product.objects.filter(business=business, name=prod_name).first()
                    if not product:
                        product = Product.objects.filter(business=business, sku=prod_name).first()
                    if not product:
                        sku = prod_name.strip().upper().replace(' ', '_')[:100]
                        base_sku = sku
                        counter = 1
                        while Product.objects.filter(business=business, sku=sku).exists():
                            sku = f"{base_sku[:90]}_{counter}"
                            counter += 1
                        product = Product.objects.create(
                            business=business,
                            name=prod_name,
                            sku=sku,
                            price=0.0
                        )

                    date_val = row['date']
                    qty_on_hand = int(row['quantity_on_hand'])
                    reorder_val = row.get('reorder_point')
                    reorder_point = int(reorder_val) if reorder_val is not None else None

                    InventorySnapshot.objects.update_or_create(
                        business=business,
                        product=product,
                        date=date_val,
                        defaults={
                            'quantity_on_hand': qty_on_hand,
                            'reorder_point': reorder_point,
                            'import_batch': batch
                        }
                    )
                    records_created += 1

            # Delete temporary file
            TemporaryStorageService.delete_temp_file(temp_file_id)

            return Response({
                "message": "Inventory snapshots imported successfully.",
                "import_batch_id": batch.id,
                "records_imported": records_created
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": f"Import execution failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReviewsImportCommitView(BaseImportCommitView):
    def post(self, request, *args, **kwargs):
        business = getattr(request.user, 'business', None)
        if not business:
            return Response(
                {"detail": "Business profile not found. Please create a business profile first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        temp_file_id = request.data.get('temp_file_id')
        mapping = request.data.get('mapping')
        original_filename = request.data.get('original_filename', 'uploaded_reviews_file.csv')

        if not temp_file_id or mapping is None:
            return Response(
                {"detail": "temp_file_id and mapping are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            df_cleaned = self.get_df_cleaned(business, temp_file_id, 'reviews', mapping)

            with transaction.atomic():
                batch = ImportBatch.objects.create(
                    business=business,
                    dataset_type='reviews',
                    original_filename=original_filename
                )

                records_created = 0
                for _, row in df_cleaned.iterrows():
                    prod_name = row.get('product_name')

                    # Resolve or create Product (optional for reviews)
                    product = None
                    if prod_name and str(prod_name).strip() != '':
                        product = Product.objects.filter(business=business, name=prod_name).first()
                        if not product:
                            product = Product.objects.filter(business=business, sku=prod_name).first()
                        if not product:
                            sku = prod_name.strip().upper().replace(' ', '_')[:100]
                            base_sku = sku
                            counter = 1
                            while Product.objects.filter(business=business, sku=sku).exists():
                                sku = f"{base_sku[:90]}_{counter}"
                                counter += 1
                            product = Product.objects.create(
                                business=business,
                                name=prod_name,
                                sku=sku,
                                price=0.0
                            )

                    date_val = row['date']
                    rating = int(row['rating'])
                    text = str(row['text'])
                    author = row.get('author_name', '')

                    CustomerReview.objects.create(
                        business=business,
                        product=product,
                        import_batch=batch,
                        source=row.get('source', 'CSV Import'),
                        external_id=row.get('external_id', ''),
                        review_date=date_val,
                        rating=rating,
                        text=text,
                        author_name=author
                    )
                    records_created += 1

            # Delete temporary file
            TemporaryStorageService.delete_temp_file(temp_file_id)

            return Response({
                "message": "Customer reviews imported successfully.",
                "import_batch_id": batch.id,
                "records_imported": records_created
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": f"Import execution failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
