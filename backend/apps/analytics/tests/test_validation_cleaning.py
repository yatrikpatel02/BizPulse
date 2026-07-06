import pandas as pd
from django.test import TestCase
from django.core.exceptions import ValidationError
from analytics.services import DataValidationService, DataCleaningService


class DataValidationServiceTest(TestCase):
    def test_validate_sales_success(self):
        data = {
            'Trx Date': ['2023-01-01', '2023-01-02'],
            'Product': ['prod-a', 'prod-b'],
            'Qty': [5, 10],
            'Amount': [100.50, 200.00],
            'COGS': [40.00, 80.00]
        }
        df = pd.DataFrame(data)
        mapping = {
            'Trx Date': 'date',
            'Product': 'product_name',
            'Qty': 'quantity',
            'Amount': 'revenue',
            'COGS': 'cost'
        }

        report = DataValidationService.validate_dataset(df, 'sales', mapping)

        self.assertEqual(report['total_rows'], 2)
        self.assertEqual(report['valid_rows_count'], 2)
        self.assertEqual(report['invalid_rows_count'], 0)
        self.assertEqual(len(report['errors']), 0)
        self.assertEqual(len(report['missing']), 0)

    def test_validate_sales_missing_required(self):
        data = {
            'date': ['2023-01-01', ''],
            'product_name': [None, 'prod-b'],
            'quantity': [5, 10],
            'revenue': [100, 200]
        }
        df = pd.DataFrame(data)
        mapping = {}  # already renamed in dict

        report = DataValidationService.validate_dataset(df, 'sales', mapping)

        self.assertEqual(report['total_rows'], 2)
        self.assertEqual(report['valid_rows_count'], 0)
        self.assertEqual(report['invalid_rows_count'], 2)
        self.assertEqual(report['missing_values_count'], 2)
        # Check details
        self.assertEqual(report['missing'][0]['row_index'], 1)
        self.assertEqual(report['missing'][0]['column'], 'product_name')
        self.assertEqual(report['missing'][1]['row_index'], 2)
        self.assertEqual(report['missing'][1]['column'], 'date')

    def test_validate_sales_invalid_types(self):
        data = {
            'date': ['invalid-date', '2023-01-02'],
            'product_name': ['prod-a', 'prod-b'],
            'quantity': ['five', 10],
            'revenue': [100.50, 'one-hundred']
        }
        df = pd.DataFrame(data)

        report = DataValidationService.validate_dataset(df, 'sales', {})

        self.assertEqual(report['invalid_rows_count'], 2)
        self.assertEqual(len(report['errors']), 3)

        # Date error on row 1
        date_err = next(e for e in report['errors'] if e['column'] == 'date')
        self.assertEqual(date_err['row_index'], 1)

        # Quantity error on row 1
        qty_err = next(e for e in report['errors'] if e['column'] == 'quantity')
        self.assertEqual(qty_err['row_index'], 1)

        # Revenue error on row 2
        rev_err = next(e for e in report['errors'] if e['column'] == 'revenue')
        self.assertEqual(rev_err['row_index'], 2)

    def test_validate_duplicates_in_file(self):
        data = {
            'date': ['2023-01-01', '2023-01-01', '2023-01-02'],
            'product_name': ['prod-a', 'prod-a', 'prod-b'],
            'quantity': [5, 5, 10],
            'revenue': [100, 100, 200]
        }
        df = pd.DataFrame(data)

        report = DataValidationService.validate_dataset(df, 'sales', {})

        # Row 1 and Row 2 are exact duplicates
        self.assertEqual(report['duplicates_count'], 1)
        # Warning about key duplicates
        self.assertTrue(any("duplicates another entry" in w['message'] for w in report['warnings']))

    def test_validate_outliers_iqr(self):
        # We need at least 5 rows for IQR outlier checks
        data = {
            'date': ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05', '2023-01-06'],
            'product_name': ['prod-a'] * 6,
            'quantity': [5, 6, 5, 7, 1000, 5],  # 1000 is an outlier
            'revenue': [10, 12, 10, 14, 2000, 10]
        }
        df = pd.DataFrame(data)

        report = DataValidationService.validate_dataset(df, 'sales', {})

        self.assertEqual(report['outliers_count'], 2)  # both quantity 1000 and revenue 2000 are outliers
        self.assertEqual(report['outliers'][0]['row_index'], 5)
        self.assertEqual(report['outliers'][0]['column'], 'quantity')


class DataCleaningServiceTest(TestCase):
    def test_clean_sales_data(self):
        data = {
            'date': [' 2023-01-01 ', 'invalid-date', '2023-01-01', '2023-01-03'],
            'product_name': [' prod-a ', 'prod-b', 'prod-a', 'prod-c'],
            'quantity': ['5', 10, 5, 20],
            'revenue': [100.50, 200.00, 100.50, 400.00],
            'cost': ['', 50.00, None, 150.00]
        }
        df = pd.DataFrame(data)

        df_cleaned = DataCleaningService.clean_dataset(df, 'sales', {})

        # 'invalid-date' row should be dropped (was 1 error).
        # Row 3 is a duplicate of Row 1 (product_name + date), so it should be dropped.
        # Cleaned dataframe should have exactly 2 rows left: prod-a and prod-c.
        self.assertEqual(len(df_cleaned), 2)

        # Index reset should happen
        self.assertEqual(df_cleaned.loc[0, 'product_name'], 'prod-a')
        self.assertEqual(df_cleaned.loc[0, 'quantity'], 5)
        self.assertEqual(df_cleaned.loc[0, 'date'], '2023-01-01')
        self.assertIsNone(df_cleaned.loc[0, 'cost'])

        self.assertEqual(df_cleaned.loc[1, 'product_name'], 'prod-c')
        self.assertEqual(df_cleaned.loc[1, 'quantity'], 20)
        self.assertEqual(df_cleaned.loc[1, 'cost'], 150.00)
