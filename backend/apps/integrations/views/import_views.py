import time
import datetime
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
from analytics.models import SalesRecord, InventorySnapshot, CustomerReview, ReviewSentiment, ComplaintCategory


class ImportPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        business_id = request.headers.get('X-Business-Id')
        business = request.user.businesses.filter(id=business_id).first() if business_id else request.user.businesses.first()
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
        """
        Reads the temp file and applies lightweight cleaning only.
        Skips full re-validation (already done during preview step) for speed.
        """
        temp_path = TemporaryStorageService.get_temp_file_path(temp_file_id)
        ext = temp_path.suffix.lower()

        if ext == '.csv':
            df = pd.read_csv(temp_path)
        else:
            df = pd.read_excel(temp_path)

        # Rename columns per mapping
        df = df.rename(columns=mapping)

        # Drop rows missing required fields (fast vectorized drop)
        required = {
            'sales': ['date', 'product_name', 'quantity', 'revenue'],
            'inventory': ['date', 'product_name', 'quantity_on_hand'],
            'reviews': ['date', 'rating', 'text'],
        }.get(source_type, [])
        existing_required = [c for c in required if c in df.columns]
        df = df.dropna(subset=existing_required)
        df = df[~(df[existing_required].astype(str).apply(lambda col: col.str.strip()) == '').any(axis=1)]

        # Normalize date
        df['date'] = pd.to_datetime(df['date'], errors='coerce', format='mixed').dt.strftime('%Y-%m-%d')
        df = df.dropna(subset=['date'])

        # Deduplicate
        if source_type in ('sales', 'inventory') and 'product_name' in df.columns:
            df['product_name'] = df['product_name'].astype(str).str.strip()
            df = df.drop_duplicates(subset=['product_name', 'date'], keep='first')
        elif source_type == 'reviews':
            subset = ['date', 'text']
            if 'author_name' in df.columns:
                subset.append('author_name')
            df = df.drop_duplicates(subset=subset, keep='first')

        return df.reset_index(drop=True)


class SalesImportCommitView(BaseImportCommitView):
    def post(self, request, *args, **kwargs):
        business_id = request.headers.get('X-Business-Id')
        business = request.user.businesses.filter(id=business_id).first() if business_id else request.user.businesses.first()
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
            t0 = time.time()
            df_cleaned = self.get_df_cleaned(business, temp_file_id, 'sales', mapping)
            print(f"[TIMING] get_df_cleaned: {time.time()-t0:.3f}s, rows={len(df_cleaned)}")

            with transaction.atomic():
                t1 = time.time()
                batch = ImportBatch.objects.create(
                    business=business,
                    dataset_type='sales',
                    original_filename=original_filename
                )
                print(f"[TIMING] batch create: {time.time()-t1:.3f}s")

                t2 = time.time()
                # Preload products to prevent N+1 queries
                all_products = list(Product.objects.filter(business=business))
                existing_products = {p.name: p for p in all_products}
                existing_products_by_sku = {p.sku: p for p in all_products}
                print(f"[TIMING] preload products ({len(all_products)}): {time.time()-t2:.3f}s")

                t3 = time.time()

                records_dict = {}
                for _, row in df_cleaned.iterrows():
                    prod_name = row['product_name']

                    product = existing_products.get(prod_name) or existing_products_by_sku.get(prod_name)
                    
                    if not product:
                        sku = prod_name.strip().upper().replace(' ', '_')[:100]
                        base_sku = sku
                        counter = 1
                        while sku in existing_products_by_sku:
                            sku = f"{base_sku[:90]}_{counter}"
                            counter += 1
                        product = Product.objects.create(
                            business=business,
                            name=prod_name,
                            sku=sku,
                            price=0.0
                        )
                        existing_products[prod_name] = product
                        existing_products_by_sku[sku] = product

                    date_val = row['date']
                    qty = int(row['quantity'])
                    rev = float(row['revenue'])
                    unit_price = rev / qty if qty > 0 else 0.0

                    # Deduplicate in memory in case CSV has multiple rows for same product/date
                    records_dict[(product.id, date_val)] = SalesRecord(
                        business=business,
                        product=product,
                        date=date_val,
                        quantity=qty,
                        revenue=rev,
                        unit_price=unit_price,
                        import_batch=batch
                    )
                print(f"[TIMING] loop + build records_dict: {time.time()-t3:.3f}s")
                    
                t4 = time.time()
                if records_dict:
                    SalesRecord.objects.bulk_create(
                        records_dict.values(),
                        update_conflicts=True,
                        unique_fields=['business', 'product', 'date'],
                        update_fields=['quantity', 'revenue', 'unit_price', 'import_batch']
                    )
                records_created = len(records_dict)
                print(f"[TIMING] bulk_create ({records_created} rows): {time.time()-t4:.3f}s")

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
        business_id = request.headers.get('X-Business-Id')
        business = request.user.businesses.filter(id=business_id).first() if business_id else request.user.businesses.first()
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

                # Preload products to prevent N+1 queries
                all_products = list(Product.objects.filter(business=business))
                existing_products = {p.name: p for p in all_products}
                existing_products_by_sku = {p.sku: p for p in all_products}

                records_dict = {}
                for _, row in df_cleaned.iterrows():
                    prod_name = row['product_name']

                    product = existing_products.get(prod_name) or existing_products_by_sku.get(prod_name)
                    
                    if not product:
                        sku = prod_name.strip().upper().replace(' ', '_')[:100]
                        base_sku = sku
                        counter = 1
                        while sku in existing_products_by_sku:
                            sku = f"{base_sku[:90]}_{counter}"
                            counter += 1
                        product = Product.objects.create(
                            business=business,
                            name=prod_name,
                            sku=sku,
                            price=0.0
                        )
                        existing_products[prod_name] = product
                        existing_products_by_sku[sku] = product

                    date_val = row['date']
                    qty_on_hand = int(row['quantity_on_hand'])
                    reorder_val = row.get('reorder_point')
                    reorder_point = int(reorder_val) if reorder_val is not None and not pd.isna(reorder_val) else None

                    records_dict[(product.id, date_val)] = InventorySnapshot(
                        business=business,
                        product=product,
                        date=date_val,
                        quantity_on_hand=qty_on_hand,
                        reorder_point=reorder_point,
                        import_batch=batch
                    )

                if records_dict:
                    InventorySnapshot.objects.bulk_create(
                        records_dict.values(),
                        update_conflicts=True,
                        unique_fields=['business', 'product', 'date'],
                        update_fields=['quantity_on_hand', 'reorder_point', 'import_batch']
                    )
                records_created = len(records_dict)

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
        business_id = request.headers.get('X-Business-Id')
        business = request.user.businesses.filter(id=business_id).first() if business_id else request.user.businesses.first()
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
            if df_cleaned.empty:
                return Response({
                    "message": "No valid customer reviews found in the uploaded file.",
                    "import_batch_id": None,
                    "records_imported": 0
                }, status=status.HTTP_200_OK)

            with transaction.atomic():
                batch = ImportBatch.objects.create(
                    business=business,
                    dataset_type='reviews',
                    original_filename=original_filename
                )

                # Preload products to prevent N+1 queries
                all_products = list(Product.objects.filter(business=business))
                existing_products = {p.name: p for p in all_products}
                existing_products_by_sku = {p.sku: p for p in all_products}

                # Optimised existing reviews fetch for the date range
                min_date = df_cleaned['date'].min()
                max_date = df_cleaned['date'].max()

                existing_reviews = CustomerReview.objects.filter(
                    business=business,
                    review_date__gte=min_date,
                    review_date__lte=max_date
                )

                existing_reviews_map = {}
                for r in existing_reviews:
                    r_date_str = r.review_date.strftime('%Y-%m-%d') if isinstance(r.review_date, datetime.date) else str(r.review_date)
                    existing_reviews_map[(r_date_str, r.author_name, r.text)] = r

                reviews_to_create = []
                reviews_to_update = []
                reviews_updated_ids = []

                for _, row in df_cleaned.iterrows():
                    prod_name = row.get('product_name')

                    product = None
                    if prod_name and str(prod_name).strip() != '' and not pd.isna(prod_name):
                        product = existing_products.get(prod_name) or existing_products_by_sku.get(prod_name)
                        if not product:
                            sku = prod_name.strip().upper().replace(' ', '_')[:100]
                            base_sku = sku
                            counter = 1
                            while sku in existing_products_by_sku:
                                sku = f"{base_sku[:90]}_{counter}"
                                counter += 1
                            product = Product.objects.create(
                                business=business,
                                name=prod_name,
                                sku=sku,
                                price=0.0
                            )
                            existing_products[prod_name] = product
                            existing_products_by_sku[sku] = product

                    date_val = row['date']
                    rating = int(row['rating'])
                    text = str(row['text'])
                    author = row.get('author_name', '')
                    if pd.isna(author): author = ''

                    source = row.get('source', 'CSV Import') if not pd.isna(row.get('source')) else 'CSV Import'
                    external_id = row.get('external_id', '') if not pd.isna(row.get('external_id')) else ''

                    key = (date_val, author, text)
                    if key in existing_reviews_map:
                        existing_review = existing_reviews_map[key]
                        existing_review.product = product
                        existing_review.rating = rating
                        existing_review.source = source
                        existing_review.external_id = external_id
                        existing_review.import_batch = batch
                        reviews_to_update.append(existing_review)
                        reviews_updated_ids.append(existing_review.id)
                    else:
                        reviews_to_create.append(CustomerReview(
                            business=business,
                            product=product,
                            import_batch=batch,
                            source=source,
                            external_id=external_id,
                            review_date=date_val,
                            rating=rating,
                            text=text,
                            author_name=author
                        ))

                # If reviews are being updated, clear their old sentiment/complaint categories
                # so the NLP engine will recalculate them
                if reviews_updated_ids:
                    ReviewSentiment.objects.filter(review_id__in=reviews_updated_ids).delete()
                    ComplaintCategory.objects.filter(review_id__in=reviews_updated_ids).delete()

                if reviews_to_update:
                    CustomerReview.objects.bulk_update(
                        reviews_to_update,
                        fields=['product', 'rating', 'source', 'external_id', 'import_batch']
                    )

                if reviews_to_create:
                    CustomerReview.objects.bulk_create(reviews_to_create)

                records_created = len(reviews_to_create) + len(reviews_to_update)

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
