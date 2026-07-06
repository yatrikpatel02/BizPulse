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
        Validates mapped dataset. Renames df using mapping first.
        Returns a structured dictionary of validation checks and metrics.
        """
        df = df.copy()

        # Rename columns based on mapping
        df = df.rename(columns=mapping)

        report = {
            'total_rows': len(df),
            'valid_rows_count': 0,
            'invalid_rows_count': 0,
            'duplicates_count': 0,
            'missing_values_count': 0,
            'outliers_count': 0,
            'errors': [],          # Fatal errors preventing import
            'missing': [],         # Missing required fields
            'outliers': [],        # Statistical outliers (warn only)
            'warnings': []         # Warnings (not fatal, e.g. negative values)
        }

        if df.empty:
            return report

        required = cls.REQUIRED_COLUMNS.get(source_type, [])

        # 1. Check duplicate rows (exact duplicates in the file)
        exact_dups = df.duplicated(keep='first')
        report['duplicates_count'] = int(exact_dups.sum())

        # 2. Outlier Detection using IQR method
        outlier_indices = set()
        numeric_cols = {
            'sales': ['quantity', 'revenue'],
            'inventory': ['quantity_on_hand']
        }.get(source_type, [])

        for col in numeric_cols:
            if col in df.columns:
                # Convert to numeric, dropping NaNs for IQR calculation
                series = pd.to_numeric(df[col], errors='coerce').dropna()
                if len(series) >= 5:  # Require minimum data points for statistical analysis
                    q25 = series.quantile(0.25)
                    q75 = series.quantile(0.75)
                    iqr = q75 - q25
                    lower_bound = q25 - 1.5 * iqr
                    upper_bound = q75 + 1.5 * iqr

                    for idx, val in series.items():
                        if val < lower_bound or val > upper_bound:
                            outlier_indices.add(idx)
                            report['outliers'].append({
                                'row_index': int(idx) + 1,  # 1-indexed for readability
                                'column': col,
                                'value': float(val),
                                'message': f"Value {val} in '{col}' is a potential outlier (bounds: [{round(lower_bound, 2)}, {round(upper_bound, 2)}])."
                            })
        report['outliers_count'] = len(report['outliers'])

        # 3. Row-by-row validation
        invalid_row_indices = set()
        seen_keys = set()

        for idx, row in df.iterrows():
            row_num = int(idx) + 1
            has_error = False

            # Check missing required fields
            for col in required:
                val = row.get(col)
                if pd.isna(val) or str(val).strip() == '':
                    report['missing'].append({
                        'row_index': row_num,
                        'column': col,
                        'message': f"Required field '{col}' is missing."
                    })
                    report['missing_values_count'] += 1
                    has_error = True

            if has_error:
                invalid_row_indices.add(idx)
                continue

            # Date parsing check
            date_val = row.get('date')
            parsed_date = None
            try:
                parsed_date = pd.to_datetime(date_val)
                if pd.isna(parsed_date):
                    raise ValueError()
            except Exception:
                report['errors'].append({
                    'row_index': row_num,
                    'column': 'date',
                    'message': f"Invalid date value '{date_val}'."
                })
                has_error = True

            # Product name verification
            prod_val = row.get('product_name')
            if source_type in {'sales', 'inventory'} and (not prod_val or str(prod_val).strip() == ''):
                report['errors'].append({
                    'row_index': row_num,
                    'column': 'product_name',
                    'message': "Product name cannot be empty."
                })
                has_error = True

            # DataType validations
            if source_type == 'sales':
                qty_val = row.get('quantity')
                rev_val = row.get('revenue')
                cost_val = row.get('cost')

                # Quantity must be a valid integer
                try:
                    qty_f = float(qty_val)
                    if not qty_f.is_integer():
                        raise ValueError()
                    qty_i = int(qty_f)
                    if qty_i < 0:
                        report['warnings'].append({
                            'row_index': row_num,
                            'column': 'quantity',
                            'message': f"Quantity is negative ({qty_i})."
                        })
                except Exception:
                    report['errors'].append({
                        'row_index': row_num,
                        'column': 'quantity',
                        'message': f"Quantity must be a valid integer, got '{qty_val}'."
                    })
                    has_error = True

                # Revenue must be decimal/float
                try:
                    rev_f = float(rev_val)
                    if rev_f < 0:
                        report['warnings'].append({
                            'row_index': row_num,
                            'column': 'revenue',
                            'message': f"Revenue is negative ({rev_f})."
                        })
                except Exception:
                    report['errors'].append({
                        'row_index': row_num,
                        'column': 'revenue',
                        'message': f"Revenue must be a valid number, got '{rev_val}'."
                    })
                    has_error = True

                # Optional cost validation
                if not pd.isna(cost_val) and str(cost_val).strip() != '':
                    try:
                        cost_f = float(cost_val)
                        if cost_f < 0:
                            report['warnings'].append({
                                'row_index': row_num,
                                'column': 'cost',
                                'message': f"Cost is negative ({cost_f})."
                            })
                    except Exception:
                        report['errors'].append({
                            'row_index': row_num,
                            'column': 'cost',
                            'message': f"Cost must be a valid number, got '{cost_val}'."
                        })
                        has_error = True

            elif source_type == 'inventory':
                qty_hand_val = row.get('quantity_on_hand')
                reorder_val = row.get('reorder_point')

                try:
                    qty_f = float(qty_hand_val)
                    if not qty_f.is_integer():
                        raise ValueError()
                    qty_i = int(qty_f)
                    if qty_i < 0:
                        report['warnings'].append({
                            'row_index': row_num,
                            'column': 'quantity_on_hand',
                            'message': f"Quantity on hand is negative ({qty_i})."
                        })
                except Exception:
                    report['errors'].append({
                        'row_index': row_num,
                        'column': 'quantity_on_hand',
                        'message': f"Quantity on hand must be a valid integer, got '{qty_hand_val}'."
                    })
                    has_error = True

                if not pd.isna(reorder_val) and str(reorder_val).strip() != '':
                    try:
                        reorder_f = float(reorder_val)
                        if not reorder_f.is_integer():
                            raise ValueError()
                        reorder_i = int(reorder_f)
                        if reorder_i < 0:
                            report['warnings'].append({
                                'row_index': row_num,
                                'column': 'reorder_point',
                                'message': f"Reorder point is negative ({reorder_i})."
                            })
                    except Exception:
                        report['errors'].append({
                            'row_index': row_num,
                            'column': 'reorder_point',
                            'message': f"Reorder point must be a valid integer, got '{reorder_val}'."
                        })
                        has_error = True

            elif source_type == 'reviews':
                rating_val = row.get('rating')
                try:
                    rat_f = float(rating_val)
                    if not rat_f.is_integer():
                        raise ValueError()
                    rat_i = int(rat_f)
                    if rat_i < 1 or rat_i > 5:
                        report['errors'].append({
                            'row_index': row_num,
                            'column': 'rating',
                            'message': f"Rating must be between 1 and 5, got {rat_i}."
                        })
                        has_error = True
                except Exception:
                    report['errors'].append({
                        'row_index': row_num,
                        'column': 'rating',
                        'message': f"Rating must be an integer, got '{rating_val}'."
                    })
                    has_error = True

            # In-file uniqueness constraint check
            if not has_error:
                date_str = parsed_date.strftime('%Y-%m-%d') if parsed_date else ''
                if source_type in {'sales', 'inventory'}:
                    key = (str(prod_val).strip(), date_str)
                else:
                    author_val = row.get('author_name', '')
                    text_val = row.get('text', '')
                    key = (str(author_val).strip(), date_str, str(text_val).strip())

                if key in seen_keys:
                    report['warnings'].append({
                        'row_index': row_num,
                        'column': 'N/A',
                        'message': f"Row duplicates another entry in the same file with key {key}."
                    })
                else:
                    seen_keys.add(key)

            if has_error:
                invalid_row_indices.add(idx)

        report['invalid_rows_count'] = len(invalid_row_indices)
        report['valid_rows_count'] = len(df) - len(invalid_row_indices)

        return report
