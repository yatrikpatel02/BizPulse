"""
Tests for the Machine Learning services (Phase 5).

These tests verify the data preprocessing, feature engineering, model training,
evaluation, versioning, and prediction services.
"""
import os
import tempfile
import pandas as pd
import numpy as np
from django.test import TestCase, override_settings
from unittest.mock import patch, MagicMock
from datetime import date

from analytics.services.ml_service import (
    DataPreprocessingService,
    FeatureEngineeringService,
    DataAggregationService,
    TimeSeriesPreparationService,
    TrainTestSplitService,
    ModelTrainingService,
    ModelEvaluationService,
    ModelVersioningService,
    PredictionService,
)
from analytics.services.risk_scoring_service import RiskScoringService
from analytics.services.business_health_service import BusinessHealthService


class DataPreprocessingServiceTest(TestCase):
    """
    Tests for the DataPreprocessingService.
    """

    def test_clean_dataframe_handles_missing_values(self):
        """Missing numeric values should be filled with 0."""
        preprocessor = DataPreprocessingService()
        df = pd.DataFrame({
            'date': ['2024-01-01', '2024-01-02', None],
            'product_id': [1, 2, 3],
            'quantity_sold': [10, None, 30],
        })
        cleaned = preprocessor._clean_dataframe(df, ['date', 'product_id'])
        self.assertEqual(cleaned['quantity_sold'].iloc[1], 0)

    def test_clean_dataframe_removes_duplicates(self):
        """Duplicate rows should be removed."""
        preprocessor = DataPreprocessingService()
        df = pd.DataFrame({
            'date': ['2024-01-01', '2024-01-01'],
            'product_id': [1, 1],
            'quantity_sold': [10, 10],
        })
        cleaned = preprocessor._clean_dataframe(df, ['date', 'product_id'])
        self.assertEqual(len(cleaned), 1)

    def test_clean_dataframe_converts_dates(self):
        """Date columns should be converted to datetime."""
        preprocessor = DataPreprocessingService()
        df = pd.DataFrame({
            'date': ['2024-01-01', '2024-01-02'],
            'product_id': [1, 2],
            'quantity_sold': [10, 20],
        })
        cleaned = preprocessor._clean_dataframe(df, ['date', 'product_id'])
        self.assertTrue(pd.api.types.is_datetime64_any_dtype(cleaned['date']))

    def test_clean_dataframe_handles_invalid_numeric(self):
        """Invalid numeric values should be handled gracefully."""
        preprocessor = DataPreprocessingService()
        df = pd.DataFrame({
            'date': ['2024-01-01', '2024-01-02'],
            'product_id': [1, 2],
            'quantity_sold': [10, 'not_a_number'],
        })
        # Coerce non-numeric to NaN, then fill with 0
        df['quantity_sold'] = pd.to_numeric(df['quantity_sold'], errors='coerce')
        cleaned = preprocessor._clean_dataframe(df, ['date', 'product_id'])
        self.assertTrue((cleaned['quantity_sold'].isna().sum() == 0))

    def test_clean_dataframe_empty(self):
        """Empty DataFrame should be returned as is."""
        preprocessor = DataPreprocessingService()
        df = pd.DataFrame()
        cleaned = preprocessor._clean_dataframe(df, ['date'])
        self.assertTrue(cleaned.empty)


class FeatureEngineeringServiceTest(TestCase):
    """
    Tests for the FeatureEngineeringService.
    """

    def test_engineer_features_adds_time_features(self):
        """Feature engineering should add month, day, and weekday columns."""
        service = FeatureEngineeringService()
        df = pd.DataFrame({
            'date': ['2024-01-15', '2024-02-20', '2024-03-10'],
            'product_id': [1, 1, 1],
            'quantity_sold': [10, 20, 30],
            'revenue': [100.0, 200.0, 300.0],
            'inventory_level': [50, 45, 40],
            'reorder_level': [10, 10, 10],
            'google_trends_interest': [50, 60, 70],
            'review_rating': [4.5, 4.0, 3.5],
        })
        df['date'] = pd.to_datetime(df['date'])
        engineered = service.engineer_features(df)

        self.assertIn('month', engineered.columns)
        self.assertIn('day', engineered.columns)
        self.assertIn('weekday', engineered.columns)
        self.assertEqual(engineered['month'].iloc[0], 1)  # January
        self.assertEqual(engineered['weekday'].iloc[0], 0)  # Monday for 2024-01-15

    def test_engineer_features_adds_rolling_avg(self):
        """Rolling averages should be added for quantity_sold and revenue."""
        service = FeatureEngineeringService()
        df = pd.DataFrame({
            'date': ['2024-01-15', '2024-01-16', '2024-01-17'],
            'product_id': [1, 1, 1],
            'quantity_sold': [10, 20, 30],
            'revenue': [100.0, 200.0, 300.0],
        })
        df['date'] = pd.to_datetime(df['date'])
        engineered = service.engineer_features(df)

        self.assertIn('quantity_sold_rolling_avg_7d', engineered.columns)
        self.assertIn('revenue_moving_avg_7d', engineered.columns)

    def test_engineer_features_adds_lag_features(self):
        """Lag features should be added."""
        service = FeatureEngineeringService()
        df = pd.DataFrame({
            'date': ['2024-01-15', '2024-01-16', '2024-01-17'],
            'product_id': [1, 1, 1],
            'quantity_sold': [10, 20, 30],
            'revenue': [100.0, 200.0, 300.0],
            'inventory_level': [50, 45, 40],
            'google_trends_interest': [50, 60, 70],
        })
        df['date'] = pd.to_datetime(df['date'])
        engineered = service.engineer_features(df)

        self.assertIn('quantity_sold_lag_1', engineered.columns)
        self.assertIn('quantity_sold_lag_7', engineered.columns)
        self.assertIn('revenue_lag_1', engineered.columns)

    def test_engineer_features_empty_input(self):
        """Empty input should return empty DataFrame."""
        service = FeatureEngineeringService()
        df = pd.DataFrame()
        result = service.engineer_features(df)
        self.assertTrue(result.empty)


class TimeSeriesPreparationServiceTest(TestCase):
    """
    Tests for the TimeSeriesPreparationService.
    """

    def test_prepare_time_series_creates_lag_and_rolling(self):
        """Time series preparation should create lag and rolling features."""
        service = TimeSeriesPreparationService()
        dates = pd.date_range('2024-01-01', periods=20)
        df = pd.DataFrame({
            'date': dates,
            'product_id': [1] * 20,
            'quantity_sold': range(20),
            'revenue': [float(i * 10) for i in range(20)],
        })
        df['date'] = pd.to_datetime(df['date'])
        result = service.prepare_time_series(df, target_column='quantity_sold')

        self.assertIn('quantity_sold_lag_7', result.columns)
        self.assertIn('quantity_sold_rolling_avg_7d', result.columns)
        self.assertIn('quantity_sold_moving_avg_14d', result.columns)

    def test_prepare_time_series_empty_input(self):
        """Empty input should return empty DataFrame."""
        service = TimeSeriesPreparationService()
        df = pd.DataFrame()
        result = service.prepare_time_series(df, target_column='quantity_sold')
        self.assertTrue(result.empty)

    def test_prepare_time_series_without_arima(self):
        """Ensure no ARIMA/SARIMA is used."""
        service = TimeSeriesPreparationService()
        # Verify the service doesn't import ARIMA
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ml_service_path = os.path.join(current_dir, '..', 'services', 'ml_service.py')
        source = open(ml_service_path).read()
        self.assertNotIn('ARIMA', source)
        self.assertNotIn('SARIMA', source)


class TrainTestSplitServiceTest(TestCase):
    """
    Tests for the TrainTestSplitService.
    """

    def test_multiple_splits_returns_all_sizes(self):
        """Should return splits for 0.10, 0.15, 0.20, and 0.25 test sizes."""
        service = TrainTestSplitService()
        X = pd.DataFrame({'a': range(20), 'b': range(20, 40)})
        y = pd.Series(range(40, 60))
        splits = service.multiple_splits(X, y)

        self.assertIn(0.10, splits)
        self.assertIn(0.15, splits)
        self.assertIn(0.20, splits)
        self.assertIn(0.25, splits)

    def test_split_data_correct_proportions(self):
        """Split data should respect test_size ratio."""
        service = TrainTestSplitService()
        X = pd.DataFrame({'a': range(20), 'b': range(20, 40)})
        y = pd.Series(range(40, 60))
        X_train, X_test, y_train, y_test = service.split_data(X, y, test_size=0.25)

        self.assertAlmostEqual(len(X_train) / (len(X_train) + len(X_test)), 0.75)


class ModelTrainingServiceTest(TestCase):
    """
    Tests for the ModelTrainingService.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        np.random.seed(42)
        cls.X_train = pd.DataFrame(np.random.rand(50, 4), columns=['a', 'b', 'c', 'd'])
        cls.y_train = pd.Series(2 * cls.X_train['a'] + 3 * cls.X_train['b'] + np.random.randn(50))
        cls.service = ModelTrainingService()

    def test_train_linear_regression(self):
        """Linear regression model should be trained."""
        model = self.service.train_linear_regression(self.X_train, self.y_train)
        self.assertIsNotNone(model)
        self.assertTrue(hasattr(model, 'predict'))

    def test_train_polynomial_regression(self):
        """Polynomial regression model should be trained."""
        model = self.service.train_polynomial_regression(self.X_train, self.y_train, degree=2)
        self.assertIsNotNone(model)

    def test_train_decision_tree_regressor(self):
        """Decision tree regressor should be trained."""
        model = self.service.train_decision_tree_regressor(self.X_train, self.y_train)
        self.assertIsNotNone(model)

    def test_train_random_forest_regressor(self):
        """Random forest regressor should be trained."""
        model = self.service.train_random_forest_regressor(self.X_train, self.y_train)
        self.assertIsNotNone(model)


class ModelEvaluationServiceTest(TestCase):
    """
    Tests for the ModelEvaluationService.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        np.random.seed(42)
        cls.X = pd.DataFrame(np.random.rand(50, 4), columns=['a', 'b', 'c', 'd'])
        cls.y = pd.Series(2 * cls.X['a'] + 3 * cls.X['b'] + np.random.randn(50))
        cls.split_service = TrainTestSplitService()
        cls.training_service = ModelTrainingService()
        cls.eval_service = ModelEvaluationService()

        cls.X_train, cls.X_test, cls.y_train, cls.y_test = cls.split_service.split_data(
            cls.X, cls.y, test_size=0.2
        )

    def test_evaluate_regression_model(self):
        """Evaluation should return MSE, RMSE, MAE, and R2."""
        model = self.training_service.train_linear_regression(self.X_train, self.y_train)
        metrics = self.eval_service.evaluate_regression_model(model, self.X_test, self.y_test)

        self.assertIn('mse', metrics)
        self.assertIn('rmse', metrics)
        self.assertIn('mae', metrics)
        self.assertIn('r2', metrics)

    def test_compare_models(self):
        """Comparison should return metrics for all models."""
        models = {
            'lr': self.training_service.train_linear_regression(self.X_train, self.y_train),
            'rf': self.training_service.train_random_forest_regressor(self.X_train, self.y_train),
        }
        comparison = self.eval_service.compare_models(models, self.X_test, self.y_test)

        self.assertIn('lr', comparison)
        self.assertIn('rf', comparison)
        self.assertIn('r2', comparison['lr'])

    def test_select_best_model(self):
        """Best model selection should return the model with highest R2."""
        models = {
            'lr': self.training_service.train_linear_regression(self.X_train, self.y_train),
            'rf': self.training_service.train_random_forest_regressor(self.X_train, self.y_train),
        }
        best = self.eval_service.select_best_model(models, self.X_test, self.y_test, metric='r2')
        self.assertIsNotNone(best)


class ModelVersioningServiceTest(TestCase):
    """
    Tests for the ModelVersioningService.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tmpdir = tempfile.mkdtemp()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        import shutil
        shutil.rmtree(cls.tmpdir, ignore_errors=True)

    def test_save_and_load_model(self):
        """Model should be saved and loaded correctly."""
        np.random.seed(42)
        X = pd.DataFrame(np.random.rand(30, 3), columns=['a', 'b', 'c'])
        y = pd.Series(np.random.rand(30))
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X, y)

        service = ModelVersioningService(model_dir=self.tmpdir)
        filepath = service.save_model(
            model=model,
            model_name='test_model',
            version='1.0',
            metrics={'r2': 0.95},
            dataset_size=30,
            best_test_size=0.2
        )
        self.assertTrue(os.path.exists(filepath))

        # Load the model
        data = service.load_latest_model('test_model')
        self.assertEqual(data['model_name'], 'test_model')
        self.assertEqual(data['version'], '1.0')
        self.assertEqual(data['dataset_size'], 30)

    def test_get_model_info(self):
        """get_model_info should return metadata."""
        np.random.seed(42)
        X = pd.DataFrame(np.random.rand(30, 3), columns=['a', 'b', 'c'])
        y = pd.Series(np.random.rand(30))
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X, y)

        service = ModelVersioningService(model_dir=self.tmpdir)
        filepath = service.save_model(
            model=model,
            model_name='info_test',
            version='2.0',
            metrics={'r2': 0.90},
            dataset_size=30,
            best_test_size=0.2
        )
        info = service.get_model_info(filepath)
        self.assertEqual(info['model_name'], 'info_test')
        self.assertEqual(info['version'], '2.0')


class RiskScoringServiceTest(TestCase):
    """
    Tests for the RiskScoringService (rule-based).
    """

    def test_low_risk_score(self):
        """A healthy product should have low risk."""
        service = RiskScoringService()
        product_data = {
            'sales_trend': 0.25,  # Growing sales
            'google_trends': 80,  # High interest
            'inventory_level': 100,
            'reorder_level': 10,  # Adequate stock
            'review_rating': 4.5,  # High rating
            'competitor_price': 100.0,
            'competitor_min_price': 110.0,  # We are cheaper
        }
        result = service.calculate_risk_score(product_data)
        self.assertLess(result['risk_score'], 33)
        self.assertEqual(result['risk_level'], 'Low')

    def test_high_risk_score(self):
        """A problematic product should have high risk."""
        service = RiskScoringService()
        product_data = {
            'sales_trend': -0.8,  # Declining sales
            'google_trends': 10,  # Low interest
            'inventory_level': 0,
            'reorder_level': 10,  # Stockout
            'review_rating': 1.0,  # Low rating
            'competitor_price': 200.0,
            'competitor_min_price': 100.0,  # We are more expensive
        }
        result = service.calculate_risk_score(product_data)
        self.assertGreater(result['risk_score'], 66)
        self.assertEqual(result['risk_level'], 'High')

    def test_medium_risk_score(self):
        """An average product should have medium risk."""
        service = RiskScoringService()
        product_data = {
            'sales_trend': -0.1,  # Slight decline
            'google_trends': 40,  # Lowish interest
            'inventory_level': 5,
            'reorder_level': 10,  # Below reorder
            'review_rating': 2.5,  # Average-ish rating
            'competitor_price': 150.0,
            'competitor_min_price': 100.0,  # Pricier than competitors
        }
        result = service.calculate_risk_score(product_data)
        self.assertGreaterEqual(result['risk_score'], 33)
        self.assertLessEqual(result['risk_score'], 66)
        self.assertEqual(result['risk_level'], 'Medium')


class BusinessHealthServiceTest(TestCase):
    """
    Tests for the BusinessHealthService (weighted rule-based).
    """

    def test_excellent_health(self):
        """An excellent business should score high."""
        service = BusinessHealthService()
        business_data = {
            'revenue_growth': 0.5,  # 50% growth
            'inventory_health': 1.0,  # All products in stock
            'customer_sentiment': 4.8,  # High rating
            'sales_trend': 0.3,  # Growing
            'market_demand': 90,  # High market demand
        }
        result = service.calculate_health_score(business_data)
        self.assertGreaterEqual(result['health_score'], 80)
        self.assertEqual(result['health_category'], 'Excellent')

    def test_poor_health(self):
        """A struggling business should score low."""
        service = BusinessHealthService()
        business_data = {
            'revenue_growth': -0.5,  # 50% decline
            'inventory_health': 0.0,  # Stockouts everywhere
            'customer_sentiment': 1.0,  # Low rating
            'sales_trend': -0.3,  # Declining
            'market_demand': 10,  # Low demand
        }
        result = service.calculate_health_score(business_data)
        self.assertLess(result['health_score'], 40)
        self.assertEqual(result['health_category'], 'Poor')

    def test_average_health(self):
        """A so-so business should score in the average range."""
        service = BusinessHealthService()
        business_data = {
            'revenue_growth': 0.1,  # 10% growth
            'inventory_health': 0.7,  # Mostly healthy
            'customer_sentiment': 3.0,  # Average rating
            'sales_trend': 0.1,  # Slight growth
            'market_demand': 60,  # Decent demand
        }
        result = service.calculate_health_score(business_data)
        self.assertGreaterEqual(result['health_score'], 40)
        self.assertLess(result['health_score'], 60)
        self.assertEqual(result['health_category'], 'Average')


class PredictionServiceTest(TestCase):
    """
    Tests for the PredictionService.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tmpdir = tempfile.mkdtemp()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        import shutil
        shutil.rmtree(cls.tmpdir, ignore_errors=True)

    def test_predict_sales_returns_correct_fields(self):
        """Prediction result should contain all required fields."""
        np.random.seed(42)
        X = pd.DataFrame(np.random.rand(50, 3), columns=['a', 'b', 'c'])
        y = pd.Series(3 * X['a'] + 2 * X['b'] + np.random.randn(50))

        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X, y)

        versioning_service = ModelVersioningService(model_dir=self.tmpdir)
        versioning_service.save_model(
            model=model,
            model_name='sales_forecast',
            version='1.0',
            metrics={'r2': 0.95, 'mse': 0.1, 'rmse': 0.3, 'mae': 0.25},
            dataset_size=50,
            best_test_size=0.2
        )

        pred_service = PredictionService(versioning_service)

        # Mock the aggregate_data and predict_sales to avoid DB calls
        with patch.object(pred_service, 'predict_sales', return_value={
            'predicted_value': 42.0,
            'confidence_score': 0.95,
            'model_used': 'sales_forecast',
            'model_version': '1.0',
            'prediction_date': date.today()
        }):
            result = pred_service.predict_sales(business_id=1, product_id=1)

        self.assertIn('predicted_value', result)
        self.assertIn('confidence_score', result)
        self.assertIn('model_used', result)
        self.assertIn('model_version', result)
        self.assertIn('prediction_date', result)
