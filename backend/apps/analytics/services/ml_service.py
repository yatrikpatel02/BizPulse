"""
Machine Learning Services for BizPulse Analytics.
"""
import logging
import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
from datetime import datetime, timedelta
from django.db.models import QuerySet
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import os
from django.conf import settings

logger = logging.getLogger(__name__)

class DataPreprocessingService:
    """
    Service for loading and preprocessing historical data.
    """

    def load_sales_data(self, business_id: int) -> pd.DataFrame:
        """
        Load sales data for a given business.
        """
        from analytics.models import SalesRecord
        qs = SalesRecord.objects.filter(business_id=business_id).values(
            'date', 'product_id', 'quantity', 'revenue'
        )
        df = pd.DataFrame.from_records(qs)
        if df.empty:
            return df
        df.rename(columns={
            'date': 'date',
            'product_id': 'product_id',
            'quantity': 'quantity_sold',
            'revenue': 'revenue'
        }, inplace=True)
        # Explicitly convert revenue to numeric (handles Decimal)
        df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce')
        # Convert product_id to integer (it should be an ID, not a date)
        df['product_id'] = pd.to_numeric(df['product_id'], errors='coerce').astype('Int64')
        return df

    def load_inventory_data(self, business_id: int) -> pd.DataFrame:
        """
        Load inventory data for a given business.
        """
        from analytics.models import InventorySnapshot
        qs = InventorySnapshot.objects.filter(business_id=business_id).values(
            'date', 'product_id', 'quantity_on_hand', 'reorder_point'
        )
        df = pd.DataFrame.from_records(qs)
        if df.empty:
            return df
        df.rename(columns={
            'date': 'date',
            'product_id': 'product_id',
            'quantity_on_hand': 'inventory_level',
            'reorder_point': 'reorder_level'
        }, inplace=True)
        return df

    def load_reviews_data(self, business_id: int) -> pd.DataFrame:
        """
        Load reviews data for a given business.
        """
        from analytics.models import CustomerReview
        qs = CustomerReview.objects.filter(business_id=business_id).values(
            'review_date', 'product_id', 'rating', 'text'
        )
        df = pd.DataFrame.from_records(qs)
        if df.empty:
            return df
        df.rename(columns={
            'review_date': 'date',
            'product_id': 'product_id',
            'rating': 'review_rating',
            'text': 'review_text'
        }, inplace=True)
        return df

    def load_google_trends_data(self, business_id: int) -> pd.DataFrame:
        """
        Load Google Trends data for a given business.
        """
        from integrations.models import GoogleTrendsData
        qs = GoogleTrendsData.objects.filter(business_id=business_id).values(
            'date', 'keyword', 'interest_score'
        )
        df = pd.DataFrame.from_records(qs)
        if df.empty:
            return df
        # We assume there might be multiple keywords per day; we'll take the average interest per day
        df_grouped = df.groupby('date').agg({
            'interest_score': 'mean'
        }).reset_index()
        df_grouped.rename(columns={
            'date': 'date',
            'interest_score': 'google_trends_interest'
        }, inplace=True)
        return df_grouped

    def preprocess_data(self, business_id: int) -> Dict[str, pd.DataFrame]:
        """
        Load and preprocess all data sources for a business.
        Returns a dictionary of DataFrames.
        """
        logger.info(f"Loading data for business {business_id}")
        sales_df = self.load_sales_data(business_id)
        inventory_df = self.load_inventory_data(business_id)
        reviews_df = self.load_reviews_data(business_id)
        trends_df = self.load_google_trends_data(business_id)

        # Handle missing values, duplicates, invalid numeric values, and date conversion
        dfs = {
            'sales': self._clean_dataframe(sales_df, date_columns=['date'], id_columns=['product_id']),
            'inventory': self._clean_dataframe(inventory_df, date_columns=['date'], id_columns=['product_id']),
            'reviews': self._clean_dataframe(reviews_df, date_columns=['date'], id_columns=['product_id']),
            'google_trends': self._clean_dataframe(trends_df, date_columns=['date'])
        }
        return dfs

    def _clean_dataframe(self, df: pd.DataFrame, date_columns: List[str] = None, id_columns: List[str] = None) -> pd.DataFrame:
        """
        Clean a DataFrame: handle missing values, remove duplicates, handle invalid numeric values, convert date columns.
        
        Args:
            df: The DataFrame to clean
            date_columns: List of columns to convert to datetime
            id_columns: List of columns to convert to integers (e.g., product_id, business_id)
        """
        if df.empty:
            return df
        
        if date_columns is None:
            date_columns = []
        if id_columns is None:
            id_columns = []

        # Convert date columns to datetime
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')

        # Drop rows with NaT in date columns (if date is essential)
        for col in date_columns:
            if col in df.columns:
                df = df[~df[col].isna()]

        # Convert id columns to integer (pandas may infer them as datetime)
        for col in id_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').astype('Int64')

        # Fill missing numeric values with 0
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(0)

        # Remove duplicates
        df = df.drop_duplicates()

        return df


class FeatureEngineeringService:
    """
    Service for feature engineering.
    """

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer features from the input DataFrame.
        Expected columns: date, product_id, quantity_sold, revenue, inventory_level, reorder_level, google_trends_interest, review_rating
        """
        if df.empty:
            return df

        df = df.copy()

        # Ensure date is datetime
        df['date'] = pd.to_datetime(df['date'])

        # Sort by date and product for time series operations
        df = df.sort_values(['product_id', 'date'])

        # Revenue (if not already present)
        if 'revenue' not in df.columns:
            # Assuming we have quantity_sold and unit_price? We'll compute if needed.
            # For simplicity, we assume revenue is provided or we skip.
            pass

        # Quantity Sold (already present as quantity_sold)
        # Inventory Level (already present as inventory_level)
        # Reorder Level (already present as reorder_level)
        # Google Trends Interest (already present as google_trends_interest)

        # Month, Day, Weekday
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['weekday'] = df['date'].dt.weekday  # Monday=0, Sunday=6

        # Rolling Average and Moving Average (for quantity_sold and revenue)
        for col in ['quantity_sold', 'revenue']:
            if col in df.columns:
                # Rolling average with window of 7 days
                df[f'{col}_rolling_avg_7d'] = df.groupby('product_id')[col].transform(
                    lambda x: x.rolling(window=7, min_periods=1).mean()
                )
                # Moving average (same as rolling average in this context)
                df[f'{col}_moving_avg_7d'] = df[f'{col}_rolling_avg_7d']

        # Lag features (for time series)
        for col in ['quantity_sold', 'revenue', 'inventory_level', 'google_trends_interest']:
            if col in df.columns:
                for lag in [1, 2, 3, 7, 14]:  # 1-day, 2-day, 3-day, 1-week, 2-week lags
                    df[f'{col}_lag_{lag}'] = df.groupby('product_id')[col].shift(lag)

        # Additional features: revenue per unit (if unit price available) - skip for now

        # Drop rows with NaN due to lag features (if we want to keep only complete rows)
        # But we can keep them and handle in modeling.
        return df


class DataAggregationService:
    """
    Service for aggregating data from multiple sources into a single dataset.
    """

    def aggregate_data(self, business_id: int) -> pd.DataFrame:
        """
        Aggregate sales, inventory, reviews, and Google Trends data for a business.
        """
        preprocessor = DataPreprocessingService()
        data_dict = preprocessor.preprocess_data(business_id)

        sales_df = data_dict.get('sales', pd.DataFrame())
        inventory_df = data_dict.get('inventory', pd.DataFrame())
        reviews_df = data_dict.get('reviews', pd.DataFrame())
        trends_df = data_dict.get('google_trends', pd.DataFrame())

        # Start with sales as the base
        df = sales_df.copy()

        # Merge with inventory on date and product_id
        if not inventory_df.empty:
            df = pd.merge(df, inventory_df, on=['date', 'product_id'], how='left')

        # Merge with reviews on date and product_id
        if not reviews_df.empty:
            df = pd.merge(df, reviews_df, on=['date', 'product_id'], how='left')

        # Merge with Google Trends on date (assuming trends are not product-specific)
        if not trends_df.empty:
            df = pd.merge(df, trends_df, on=['date'], how='left')

        return df


class TimeSeriesPreparationService:
    """
    Service for preparing time-series data for modeling.
    """

    def prepare_time_series(self, df: pd.DataFrame, target_column: str, freq: str = 'D') -> pd.DataFrame:
        """
        Prepare time-series data by sorting, creating lag features, rolling averages, and moving averages.
        Assumes df has a datetime index or a 'date' column.
        Does not resample - works with existing dates.
        """
        if df.empty:
            return df

        df = df.copy()

        # Ensure date column is datetime and set as index for time series operations
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            # Drop rows where date conversion failed
            df = df[~df['date'].isna()]
            if df.empty:
                return df
            df = df.set_index('date')
        elif not isinstance(df.index, pd.DatetimeIndex):
            raise ValueError("DataFrame must have a 'date' column or DatetimeIndex.")

        # Sort index
        df = df.sort_index()

        # If we have multiple products, we need to handle each product separately.
        # We'll group by product_id if present.
        if 'product_id' in df.columns:
            # We'll create features per product
            grouped = df.groupby('product_id')
            processed_dfs = []
            for product_id, group in grouped:
                # Drop product_id for the time series operations on this group
                group = group.drop(columns=['product_id'])
                
                # Remove duplicate index entries by keeping the last (most recent)
                if group.index.duplicated().any():
                    group = group[~group.index.duplicated(keep='last')]
                
                # Ensure we have a DatetimeIndex
                if not isinstance(group.index, pd.DatetimeIndex):
                    continue
                
                # Sort index
                group = group.sort_index()
                
                # Now compute features directly without resampling
                group = self._create_time_series_features(group, target_column)
                group['product_id'] = product_id
                processed_dfs.append(group)
            
            if processed_dfs:
                # Concatenate and reset index to avoid duplicate index issues
                df = pd.concat(processed_dfs)
                # Reset index to bring date back as a column
                df = df.reset_index()
            else:
                df = pd.DataFrame()
        else:
            # No product_id, treat as a single time series
            # Remove duplicate index entries
            if df.index.duplicated().any():
                df = df[~df.index.duplicated(keep='last')]
            df = self._create_time_series_features(df, target_column)
            df = df.reset_index()

        return df

    def _create_time_series_features(self, df: pd.DataFrame, target_column: str) -> pd.DataFrame:
        """
        Create time-series features: lag features, rolling averages, moving averages.
        """
        if target_column not in df.columns:
            logger.warning(f"Target column {target_column} not found in DataFrame.")
            return df

        # Lag features
        for lag in [1, 2, 3, 7, 14]:
            df[f'{target_column}_lag_{lag}'] = df[target_column].shift(lag)

        # Rolling average (moving average)
        for window in [7, 14, 30]:
            df[f'{target_column}_rolling_avg_{window}d'] = df[target_column].rolling(window=window, min_periods=1).mean()
            df[f'{target_column}_moving_avg_{window}d'] = df[f'{target_column}_rolling_avg_{window}d']

        return df


class TrainTestSplitService:
    """
    Service for splitting data into training and testing sets.
    """

    def split_data(self, X: pd.DataFrame, y: pd.Series, test_size: float = 0.2, random_state: int = 42) -> Tuple:
        """
        Split data into training and testing sets.
        """
        return train_test_split(X, y, test_size=test_size, random_state=random_state, shuffle=False)  # For time series, we might not want to shuffle

    def multiple_splits(self, X: pd.DataFrame, y: pd.Series) -> Dict[float, Tuple]:
        """
        Create multiple train/test splits for different test sizes.
        """
        test_sizes = [0.10, 0.15, 0.20, 0.25]
        splits = {}
        for size in test_sizes:
            splits[size] = self.split_data(X, y, test_size=size, random_state=42)
        return splits


class ModelTrainingService:
    """
    Service for training machine learning models.
    """

    def train_linear_regression(self, X_train: pd.DataFrame, y_train: pd.Series):
        """
        Train a Multiple Linear Regression model.
        """
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X_train, y_train)
        return model

    def train_polynomial_regression(self, X_train: pd.DataFrame, y_train: pd.Series, degree: int = 2):
        """
        Train a Polynomial Regression model.
        """
        from sklearn.preprocessing import PolynomialFeatures
        from sklearn.linear_model import LinearRegression
        from sklearn.pipeline import make_pipeline

        model = make_pipeline(PolynomialFeatures(degree), LinearRegression())
        model.fit(X_train, y_train)
        return model

    def train_decision_tree_regressor(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs):
        """
        Train a Decision Tree Regressor.
        """
        from sklearn.tree import DecisionTreeRegressor
        model = DecisionTreeRegressor(**kwargs)
        model.fit(X_train, y_train)
        return model

    def train_random_forest_regressor(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs):
        """
        Train a Random Forest Regressor.
        """
        from sklearn.ensemble import RandomForestRegressor
        model = RandomForestRegressor(**kwargs)
        model.fit(X_train, y_train)
        return model

    def train_decision_tree_classifier(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs):
        """
        Train a Decision Tree Classifier (for product risk scoring).
        """
        from sklearn.tree import DecisionTreeClassifier
        model = DecisionTreeClassifier(**kwargs)
        model.fit(X_train, y_train)
        return model

    def train_random_forest_classifier(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs):
        """
        Train a Random Forest Classifier (for product risk scoring).
        """
        from sklearn.ensemble import RandomForestClassifier
        model = RandomForestClassifier(**kwargs)
        model.fit(X_train, y_train)
        return model


class ModelEvaluationService:
    """
    Service for evaluating machine learning models.
    """

    def evaluate_regression_model(self, model, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """
        Evaluate a regression model and return metrics.
        """
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        return {
            'mse': mse,
            'rmse': rmse,
            'mae': mae,
            'r2': r2
        }

    def evaluate_classification_model(self, model, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """
        Evaluate a classification model and return metrics.
        For simplicity, we'll use accuracy, precision, recall, f1.
        Note: for risk scoring we might want a probability score.
        """
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        y_pred = model.predict(X_test)
        return {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
            'f1': f1_score(y_test, y_pred, average='weighted', zero_division=0)
        }

    def compare_models(self, models: Dict[str, Any], X_test: pd.DataFrame, y_test: pd.Series, problem_type: str = 'regression') -> Dict[str, Dict]:
        """
        Compare multiple models and return a dictionary of metrics.
        """
        results = {}
        for name, model in models.items():
            if problem_type == 'regression':
                metrics = self.evaluate_regression_model(model, X_test, y_test)
            else:
                metrics = self.evaluate_classification_model(model, X_test, y_test)
            results[name] = metrics
        return results

    def select_best_model(self, models: Dict[str, Any], X_test: pd.DataFrame, y_test: pd.Series, problem_type: str = 'regression', metric: str = 'r2') -> Any:
        """
        Select the best model based on a given metric.
        For regression, higher R2 is better.
        For classification, higher f1 is better.
        """
        if problem_type == 'regression':
            best_score = -np.inf
            best_model = None
            for name, model in models.items():
                metrics = self.evaluate_regression_model(model, X_test, y_test)
                score = metrics[metric]
                if score > best_score:
                    best_score = score
                    best_model = model
            return best_model
        else:
            best_score = -np.inf
            best_model = None
            for name, model in models.items():
                metrics = self.evaluate_classification_model(model, X_test, y_test)
                score = metrics[metric]
                if score > best_score:
                    best_score = score
                    best_model = model
            return best_model


class ModelVersioningService:
    """
    Service for saving and loading models using Joblib.
    """

    def __init__(self, model_dir: str = None):
        if model_dir is None:
            import sys
            is_testing = 'test' in sys.argv or getattr(settings, 'TESTING', False)
            if is_testing:
                self.model_dir = os.path.join(settings.BASE_DIR, 'test_ml_models')
            else:
                self.model_dir = os.path.join(settings.BASE_DIR, 'ml_models')
        else:
            self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)

    def save_model(self, model, model_name: str, version: str, metrics: Dict[str, float], dataset_size: int, best_test_size: float, feature_names: List[str] = None):
        """
        Save a trained model to disk.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{model_name}_{version}_{timestamp}.joblib"
        filepath = os.path.join(self.model_dir, filename)
        data = {
            'model': model,
            'model_name': model_name,
            'version': version,
            'training_date': datetime.now(),
            'dataset_size': dataset_size,
            'metrics': metrics,
            'best_test_size': best_test_size,
            'feature_names': feature_names
        }
        joblib.dump(data, filepath)
        logger.info(f"Model saved to {filepath}")
        return filepath

    def load_latest_model(self, model_name: str) -> Dict:
        """
        Load the latest model for a given model name.
        """
        pattern = f"{model_name}_*.joblib"
        files = [f for f in os.listdir(self.model_dir) if f.startswith(model_name) and f.endswith('.joblib')]
        if not files:
            raise FileNotFoundError(f"No model found for {model_name}")
        # Sort by timestamp in filename (assuming format includes timestamp)
        files.sort(reverse=True)
        latest_file = files[0]
        filepath = os.path.join(self.model_dir, latest_file)
        data = joblib.load(filepath)
        logger.info(f"Loaded model from {filepath}")
        return data

    def get_model_info(self, model_path: str) -> Dict:
        """
        Get information about a saved model.
        """
        data = joblib.load(model_path)
        return {
            'model_name': data.get('model_name'),
            'version': data.get('version'),
            'training_date': data.get('training_date'),
            'dataset_size': data.get('dataset_size'),
            'metrics': data.get('metrics'),
            'best_test_size': data.get('best_test_size'),
            'feature_names': data.get('feature_names')
        }


class PredictionService:
    """
    Service for making predictions using the latest best model.
    """

    def __init__(self, model_versioning_service: ModelVersioningService):
        self.model_versioning_service = model_versioning_service

    def _align_features(self, prepared_df: pd.DataFrame, feature_names: List[str]) -> pd.DataFrame:
        """
        Align the prepared DataFrame features with the training features.
        Adds missing columns with default values and drops extra columns.
        """
        # Get only numeric columns (exclude text/object columns)
        numeric_cols = prepared_df.select_dtypes(include=[np.number]).columns.tolist()
        # Also exclude target columns
        exclude = ['quantity_sold', 'revenue', 'date', 'product_id', 'review_text']
        available_features = [c for c in numeric_cols if c not in exclude]
        
        # Start with available features
        aligned = prepared_df[available_features].copy() if available_features else pd.DataFrame()
        
        # Add missing features (that were in training but not in prediction) with default value 0
        for feat in feature_names:
            if feat not in aligned.columns:
                aligned[feat] = 0.0
        
        # Select only the features the model was trained on
        aligned = aligned[feature_names]
        return aligned

    def predict_sales(self, business_id: int, product_id: int, days_ahead: int = 7) -> Dict[str, Any]:
        """
        Predict future sales for a product.
        """
        # 1. Load the latest sales forecasting model
        model_data = self.model_versioning_service.load_latest_model('sales_forecast')
        model = model_data['model']
        model_name = model_data['model_name']
        model_version = model_data['version']
        feature_names = model_data.get('feature_names', [])

        # 2. Prepare the input data for the product
        agg_service = DataAggregationService()
        df = agg_service.aggregate_data(business_id)
        # Filter for the product (convert product_id to integer for comparison)
        df = df[df['product_id'].astype('Int64') == product_id]
        if df.empty:
            raise ValueError(f"No data found for product {product_id} in business {business_id}")

        # Prepare time series data
        ts_service = TimeSeriesPreparationService()
        prepared_df = ts_service.prepare_time_series(df, target_column='quantity_sold')
        prepared_df = prepared_df.fillna(0)
        if prepared_df.empty:
            raise ValueError(f"No data after time series preparation for product {product_id}")
        # Get the last row for prediction
        last_row = prepared_df.iloc[[-1]].copy()

        # 3. Align features with training data
        X = self._align_features(last_row, feature_names)

        # 4. Make prediction
        prediction = model.predict(X)[0]

        # 5. Calculate confidence score (using model's R2 on training data as a proxy)
        confidence = model_data['metrics'].get('r2', 0.0)
        confidence = max(0.0, min(1.0, confidence))

        return {
            'predicted_value': float(prediction),
            'confidence_score': float(confidence),
            'model_used': model_name,
            'model_version': model_version,
            'prediction_date': datetime.now().date()
        }

    def predict_revenue(self, business_id: int, product_id: int, days_ahead: int = 7) -> Dict[str, Any]:
        """
        Predict future revenue for a product.
        """
        model_data = self.model_versioning_service.load_latest_model('demand_forecast')
        model = model_data['model']
        model_name = model_data['model_name']
        model_version = model_data['version']
        feature_names = model_data.get('feature_names', [])

        agg_service = DataAggregationService()
        df = agg_service.aggregate_data(business_id)
        df = df[df['product_id'].astype('Int64') == product_id]
        if df.empty:
            raise ValueError(f"No data found for product {product_id} in business {business_id}")

        ts_service = TimeSeriesPreparationService()
        prepared_df = ts_service.prepare_time_series(df, target_column='quantity_sold')
        prepared_df = prepared_df.fillna(0)
        if prepared_df.empty:
            raise ValueError(f"No data after time series preparation for product {product_id}")
        last_row = prepared_df.iloc[[-1]].copy()

        X = self._align_features(last_row, feature_names)

        prediction = model.predict(X)[0]

        confidence = model_data['metrics'].get('r2', 0.0)
        confidence = max(0.0, min(1.0, confidence))

        return {
            'predicted_value': float(prediction),
            'confidence_score': float(confidence),
            'model_used': model_name,
            'model_version': model_version,
            'prediction_date': datetime.now().date()
        }


# Example usage (not to be run in production)
if __name__ == "__main__":
    # This is just for demonstration
    pass
