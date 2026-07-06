import pandas as pd
from pathlib import Path
from django.core.exceptions import ValidationError


class ColumnDetectionService:
    @classmethod
    def detect_headers(cls, file_path: Path) -> list:
        """
        Reads the headers (first row) from the file at file_path.
        Supports CSV, XLSX, XLS.
        """
        ext = file_path.suffix.lower()
        if not file_path.exists():
            raise ValidationError("File not found.")

        try:
            if ext == '.csv':
                # Try commas, semicolons, and tabs as delimiters
                delimiters = [',', ';', '\t']
                df = None
                for delim in delimiters:
                    try:
                        df = pd.read_csv(file_path, nrows=0, sep=delim)
                        # If we have multiple columns, or if we are at comma, accept it.
                        # (Checking if delimiter is in the column names of a single-column result)
                        if len(df.columns) > 1:
                            break
                    except Exception:
                        continue
                if df is None:
                    # Fallback to default behavior
                    df = pd.read_csv(file_path, nrows=0)
            elif ext in {'.xlsx', '.xls'}:
                # Read header row only
                df = pd.read_excel(file_path, nrows=0)
            else:
                raise ValidationError(f"Unsupported file extension '{ext}' for header detection.")

            # Clean column names (strip whitespace)
            headers = [str(col).strip() for col in df.columns]
            # Exclude empty column headers
            return [h for h in headers if h]

        except Exception as e:
            raise ValidationError(f"Failed to parse file headers: {str(e)}")
