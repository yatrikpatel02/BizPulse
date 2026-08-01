import pandas as pd
from django.core.exceptions import ValidationError

class DataValidationService:
    REQUIRED_COLUMNS = {
        'sales': ['date', 'product_name', 'quantity', 'revenue'],
        'inventory': ['date', 'product_name', 'quantity_on_hand'],
        'reviews': ['date', 'rating', 'text']
    }

    @classmethod
    def validate_dataset(cls, df: pd.DataFrame, source_type: str, mapping: dict) -> dict:
        """
        Validates mapped dataset using vectorized operations for massive performance gains.
        Renames df using mapping first.
        Returns a structured dictionary of validation checks and metrics.
        """
        df = df.copy()
        df = df.rename(columns=mapping)

        report = {
            'total_rows': len(df),
            'valid_rows_count': 0,
            'invalid_rows_count': 0,
            'duplicates_count': 0,
            'missing_values_count': 0,
            'outliers_count': 0,
            'errors': [],
            'missing': [],
            'outliers': [],
            'warnings': []
        }

        if df.empty:
            return report

        required = cls.REQUIRED_COLUMNS.get(source_type, [])

        # 1. Exact duplicates
        report['duplicates_count'] = int(df.duplicated(keep='first').sum())

        invalid_row_indices = set()

        # Vectorized missing check
        for col in required:
            if col in df.columns:
                mask = df[col].isna() | (df[col].astype(str).str.strip() == '')
                missing_idx = df.index[mask]
                for idx in missing_idx:
                    report['missing'].append({
                        'row_index': int(idx) + 1,
                        'column': col,
                        'message': f"Required field '{col}' is missing."
                    })
                    report['missing_values_count'] += 1
                invalid_row_indices.update(missing_idx)
            else:
                # Entire column is missing
                report['missing'].append({
                    'row_index': 0,
                    'column': col,
                    'message': f"Required field '{col}' is missing entirely."
                })

        # Date parsing
        if 'date' in df.columns:
            date_col = pd.to_datetime(df['date'], errors='coerce')
            invalid_dates = df.index[date_col.isna() & df['date'].notna() & (df['date'].astype(str).str.strip() != '')]
            for idx in invalid_dates:
                report['errors'].append({
                    'row_index': int(idx) + 1,
                    'column': 'date',
                    'message': f"Invalid date value '{df.at[idx, 'date']}'."
                })
            invalid_row_indices.update(invalid_dates)

        # Vectorized validation by type
        if source_type == 'sales':
            if 'product_name' in df.columns:
                mask = df['product_name'].isna() | (df['product_name'].astype(str).str.strip() == '')
                inv_prod = df.index[mask]
                for idx in inv_prod:
                    report['errors'].append({
                        'row_index': int(idx) + 1,
                        'column': 'product_name',
                        'message': "Product name cannot be empty."
                    })
                invalid_row_indices.update(inv_prod)

            if 'quantity' in df.columns:
                q_num = pd.to_numeric(df['quantity'], errors='coerce')
                # Invalid format
                inv_q = df.index[q_num.isna() & df['quantity'].notna()]
                for idx in inv_q:
                    report['errors'].append({'row_index': int(idx) + 1, 'column': 'quantity', 'message': f"Quantity must be a valid integer."})
                invalid_row_indices.update(inv_q)
                
                # Negative warning
                neg_q = df.index[q_num < 0]
                for idx in neg_q:
                    report['warnings'].append({'row_index': int(idx) + 1, 'column': 'quantity', 'message': "Quantity is negative."})

            if 'revenue' in df.columns:
                r_num = pd.to_numeric(df['revenue'], errors='coerce')
                inv_r = df.index[r_num.isna() & df['revenue'].notna()]
                for idx in inv_r:
                    report['errors'].append({'row_index': int(idx) + 1, 'column': 'revenue', 'message': f"Revenue must be a valid number."})
                invalid_row_indices.update(inv_r)
                
                neg_r = df.index[r_num < 0]
                for idx in neg_r:
                    report['warnings'].append({'row_index': int(idx) + 1, 'column': 'revenue', 'message': "Revenue is negative."})

            if 'cost' in df.columns:
                c_num = pd.to_numeric(df['cost'], errors='coerce')
                inv_c = df.index[c_num.isna() & df['cost'].notna()]
                for idx in inv_c:
                    report['errors'].append({'row_index': int(idx) + 1, 'column': 'cost', 'message': f"Cost must be a valid number."})
                invalid_row_indices.update(inv_c)

        elif source_type == 'inventory':
            if 'product_name' in df.columns:
                mask = df['product_name'].isna() | (df['product_name'].astype(str).str.strip() == '')
                inv_prod = df.index[mask]
                for idx in inv_prod:
                    report['errors'].append({'row_index': int(idx) + 1, 'column': 'product_name', 'message': "Product name cannot be empty."})
                invalid_row_indices.update(inv_prod)

            if 'quantity_on_hand' in df.columns:
                q_num = pd.to_numeric(df['quantity_on_hand'], errors='coerce')
                inv_q = df.index[q_num.isna() & df['quantity_on_hand'].notna()]
                for idx in inv_q:
                    report['errors'].append({'row_index': int(idx) + 1, 'column': 'quantity_on_hand', 'message': f"Quantity must be a valid integer."})
                invalid_row_indices.update(inv_q)

            if 'reorder_point' in df.columns:
                r_num = pd.to_numeric(df['reorder_point'], errors='coerce')
                inv_r = df.index[r_num.isna() & df['reorder_point'].notna()]
                for idx in inv_r:
                    report['errors'].append({'row_index': int(idx) + 1, 'column': 'reorder_point', 'message': f"Reorder point must be a valid integer."})
                invalid_row_indices.update(inv_r)

        elif source_type == 'reviews':
            if 'rating' in df.columns:
                r_num = pd.to_numeric(df['rating'], errors='coerce')
                inv_r = df.index[(r_num.isna() | (r_num < 1) | (r_num > 5)) & df['rating'].notna()]
                for idx in inv_r:
                    report['errors'].append({'row_index': int(idx) + 1, 'column': 'rating', 'message': f"Rating must be between 1 and 5."})
                invalid_row_indices.update(inv_r)

        # In-file uniqueness constraint check
        valid_df = df.drop(index=list(invalid_row_indices))
        if source_type in {'sales', 'inventory'} and 'product_name' in valid_df.columns and 'date' in valid_df.columns:
            dups = valid_df[valid_df.duplicated(subset=['product_name', 'date'], keep='first')]
            for idx in dups.index:
                report['warnings'].append({
                    'row_index': int(idx) + 1,
                    'column': 'N/A',
                    'message': "Row duplicates another entry in the same file."
                })
        elif source_type == 'reviews' and 'date' in valid_df.columns and 'text' in valid_df.columns:
            subset = ['date', 'text']
            if 'author_name' in valid_df.columns:
                subset.append('author_name')
            dups = valid_df[valid_df.duplicated(subset=subset, keep='first')]
            for idx in dups.index:
                report['warnings'].append({'row_index': int(idx) + 1, 'column': 'N/A', 'message': "Row duplicates another entry in the same file."})

        report['invalid_rows_count'] = len(invalid_row_indices)
        report['valid_rows_count'] = len(df) - len(invalid_row_indices)

        return report
