import pandas as pd
from django.core.exceptions import ValidationError
from analytics.services.validation_service import DataValidationService


class DataCleaningService:
    @classmethod
    def clean_dataset(cls, df: pd.DataFrame, source_type: str, mapping: dict) -> pd.DataFrame:
        """
        Cleans the dataset by renaming columns, dropping rows with missing/invalid data,
        removing duplicates, and normalizing data types.
        """
        # Run validation first to identify bad rows
        report = DataValidationService.validate_dataset(df, source_type, mapping)

        df_clean = df.copy()

        # 1. Rename columns
        df_clean = df_clean.rename(columns=mapping)

        # 2. Extract indices of invalid/missing rows to drop
        # Note: report indices are 1-based, we convert back to 0-based DataFrame indices
        drop_indices = set()
        for err in report.get('errors', []):
            drop_indices.add(err['row_index'] - 1)
        for miss in report.get('missing', []):
            drop_indices.add(miss['row_index'] - 1)

        # Filter out invalid indices
        valid_indices = [idx for idx in df_clean.index if idx not in drop_indices]
        df_clean = df_clean.loc[valid_indices].reset_index(drop=True)

        if df_clean.empty:
            return df_clean

        # 3. Clean and standardize Date
        df_clean['date'] = df_clean['date'].astype(str).str.strip()
        df_clean['date'] = pd.to_datetime(df_clean['date'], errors='coerce', format='mixed').dt.strftime('%Y-%m-%d')

        # 4. Standardize and cast fields by source type
        if source_type == 'sales':
            df_clean['product_name'] = df_clean['product_name'].astype(str).str.strip()
            df_clean['quantity'] = pd.to_numeric(df_clean['quantity']).astype(int)
            df_clean['revenue'] = pd.to_numeric(df_clean['revenue']).astype(float)
            if 'cost' in df_clean.columns:
                # Handle optional cost column
                df_clean['cost'] = pd.to_numeric(df_clean['cost'], errors='coerce')
                # Replace NaN with None
                df_clean['cost'] = df_clean['cost'].astype(object).where(df_clean['cost'].notna(), None)

        elif source_type == 'inventory':
            df_clean['product_name'] = df_clean['product_name'].astype(str).str.strip()
            df_clean['quantity_on_hand'] = pd.to_numeric(df_clean['quantity_on_hand']).astype(int)
            if 'reorder_point' in df_clean.columns:
                df_clean['reorder_point'] = pd.to_numeric(df_clean['reorder_point'], errors='coerce')
                # Cast to float/int if not null, otherwise None
                df_clean['reorder_point'] = df_clean['reorder_point'].astype(object).where(df_clean['reorder_point'].notna(), None)

        elif source_type == 'reviews':
            if 'product_name' in df_clean.columns:
                df_clean['product_name'] = df_clean['product_name'].astype(str).str.strip()
                df_clean['product_name'] = df_clean['product_name'].astype(object).replace('', None)
            df_clean['rating'] = pd.to_numeric(df_clean['rating']).astype(int)
            df_clean['text'] = df_clean['text'].astype(str).str.strip()
            if 'author_name' in df_clean.columns:
                df_clean['author_name'] = df_clean['author_name'].astype(str).str.strip()

        # 5. Remove duplicate entries
        # Remove exact duplicate rows
        df_clean = df_clean.drop_duplicates(keep='first')

        # Remove logical constraint duplicates
        if source_type in {'sales', 'inventory'}:
            df_clean = df_clean.drop_duplicates(subset=['product_name', 'date'], keep='first')
        elif source_type == 'reviews':
            # Drop duplicates based on author name, date and text
            subset = ['date', 'text']
            if 'author_name' in df_clean.columns:
                subset.append('author_name')
            df_clean = df_clean.drop_duplicates(subset=subset, keep='first')

        return df_clean.reset_index(drop=True)
