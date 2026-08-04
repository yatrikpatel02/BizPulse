"""
Machine Learning Pipeline for BizPulse Analytics.

This module orchestrates the full ML workflow including:
- Data preparation (preprocessing, feature engineering, aggregation, time series)
- Model training (Linear Regression, Polynomial Regression, Decision Tree, Random Forest)
- Model evaluation (MSE, RMSE, MAE, R2)
- Model versioning (save with Joblib)
- Prediction (Sales and Revenue forecasting)
- Risk scoring and Business Health scoring

The pipeline is designed to be modular, with each step delegated to a
dedicated service class.
"""
import logging
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np
from datetime import datetime

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

logger = logging.getLogger(__name__)


class TrainAllModelsPipeline:
    """
    Pipeline for training all ML models for a business.

    This pipeline trains models for:
    1. Sales Forecasting (Linear Regression, Polynomial Regression, Decision Tree, Random Forest)
    2. Demand Forecasting (Decision Tree, Random Forest)
    3. Product Risk Scoring (Rule-based)
    4. Business Health Score (Rule-based)
    """

    def __init__(self, business_id: int):
        self.business_id = business_id
        self.agg_service = DataAggregationService()
        self.feature_service = FeatureEngineeringService()
        self.ts_service = TimeSeriesPreparationService()
        self.split_service = TrainTestSplitService()
        self.training_service = ModelTrainingService()
        self.evaluation_service = ModelEvaluationService()
        self.versioning_service = ModelVersioningService()

    def run(self) -> Dict[str, Any]:
        """
        Execute the full training pipeline for the business.

        Returns:
            A dictionary containing training results for each model type.
        """
        logger.info(f"Starting full training pipeline for business {self.business_id}")

        results = {}

        # Step 1: Train sales forecasting models
        sales_results = self._train_sales_forecast_models()
        results['sales_forecast'] = sales_results

        # Step 2: Train demand forecasting models
        demand_results = self._train_demand_forecast_models()
        results['demand_forecast'] = demand_results

        # Step 3: Product risk scoring
        risk_service = RiskScoringService()
        risk_results = risk_service.calculate_risk_for_business(self.business_id)
        results['product_risk'] = risk_results

        # Step 4: Business health score
        health_service = BusinessHealthService()
        health_score = health_service.calculate_health_for_business(self.business_id)
        results['business_health'] = {'health_score': health_score}

        logger.info(f"Training pipeline complete for business {self.business_id}")
        return results

    def _train_sales_forecast_models(self) -> Dict[str, Any]:
        """
        Train and evaluate multiple regression models for sales forecasting.
        """
        logger.info("Training sales forecast models")

        # Load and prepare data
        df = self.agg_service.aggregate_data(self.business_id)
        df = self.feature_service.engineer_features(df)

        if df.empty:
            logger.warning("No data available for training sales forecast models")
            return {}

        # Prepare time series data with target = quantity_sold
        ts_df = self.ts_service.prepare_time_series(df, target_column='quantity_sold')
        ts_df = ts_df.fillna(0)

        # Define features and target
        # Exclude the target and date/product_id columns from features
        exclude_cols = ['quantity_sold', 'date', 'product_id']
        # Keep only numeric columns for training
        numeric_cols = ts_df.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [col for col in numeric_cols if col not in exclude_cols]
        X = ts_df[feature_cols]
        y = ts_df['quantity_sold']

        if len(ts_df) < 5:
            logger.warning("Insufficient data for training")
            return {}

        # Try multiple test sizes and select the best one
        best_test_size = 0.2
        best_avg_r2 = -np.inf

        splits = self.split_service.multiple_splits(X, y)

        # Train all models with the best test size
        for test_size, (X_train, X_test, y_train, y_test) in splits.items():
            models = {
                'linear_regression': self.training_service.train_linear_regression(X_train, y_train),
                'polynomial_regression': self.training_service.train_polynomial_regression(X_train, y_train, degree=2),
                'decision_tree': self.training_service.train_decision_tree_regressor(X_train, y_train),
                'random_forest': self.training_service.train_random_forest_regressor(X_train, y_train),
            }
            results = self.evaluation_service.compare_models(
                models, X_test, y_test, problem_type='regression'
            )
            avg_r2 = np.mean([m['r2'] for m in results.values()])
            if avg_r2 > best_avg_r2:
                best_avg_r2 = avg_r2
                best_test_size = test_size

        # Re-train all models with the best test size
        X_train, X_test, y_train, y_test = splits[best_test_size]
        models = {
            'linear_regression': self.training_service.train_linear_regression(X_train, y_train),
            'polynomial_regression': self.training_service.train_polynomial_regression(X_train, y_train, degree=2),
            'decision_tree': self.training_service.train_decision_tree_regressor(X_train, y_train),
            'random_forest': self.training_service.train_random_forest_regressor(X_train, y_train),
        }

        # Evaluate all models
        metrics = self.evaluation_service.compare_models(
            models, X_test, y_test, problem_type='regression'
        )

        # Select the best model
        best_model_name = max(metrics, key=lambda k: metrics[k]['r2'])
        best_model = models[best_model_name]
        best_metrics = metrics[best_model_name]

        # Save the best model
        filepath = self.versioning_service.save_model(
            model=best_model,
            model_name='sales_forecast',
            version='1.0',
            metrics=best_metrics,
            dataset_size=len(ts_df),
            best_test_size=best_test_size,
            feature_names=feature_cols
        )

        logger.info(f"Sales forecast best model: {best_model_name} with R2={best_metrics['r2']:.4f}")

        return {
            'models': {name: {'metrics': metrics[name]} for name in models},
            'best_model': best_model_name,
            'best_metrics': best_metrics,
            'best_test_size': best_test_size,
            'model_path': filepath
        }

    def _train_demand_forecast_models(self) -> Dict[str, Any]:
        """
        Train decision tree and random forest regressors for demand forecasting.
        Automatically selects the better model.
        """
        logger.info("Training demand forecast models")

        # Load and prepare data
        df = self.agg_service.aggregate_data(self.business_id)
        df = self.feature_service.engineer_features(df)

        if df.empty:
            logger.warning("No data available for training demand forecast models")
            return {}

        # Prepare time series data with target = quantity_sold (demand)
        ts_df = self.ts_service.prepare_time_series(df, target_column='quantity_sold')
        ts_df = ts_df.fillna(0)

        # Define features and target - keep only numeric columns
        exclude_cols = ['quantity_sold', 'date', 'product_id']
        numeric_cols = ts_df.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [col for col in numeric_cols if col not in exclude_cols]
        X = ts_df[feature_cols]
        y = ts_df['quantity_sold']

        if len(ts_df) < 5:
            logger.warning("Insufficient data for training")
            return {}

        # Use default test size 0.2 for demand forecast
        X_train, X_test, y_train, y_test = self.split_service.split_data(
            X, y, test_size=0.2, random_state=42
        )

        models = {
            'decision_tree': self.training_service.train_decision_tree_regressor(X_train, y_train),
            'random_forest': self.training_service.train_random_forest_regressor(X_train, y_train),
        }

        metrics = self.evaluation_service.compare_models(
            models, X_test, y_test, problem_type='regression'
        )

        best_model_name = max(metrics, key=lambda k: metrics[k]['r2'])
        best_model = models[best_model_name]
        best_metrics = metrics[best_model_name]

        filepath = self.versioning_service.save_model(
            model=best_model,
            model_name='demand_forecast',
            version='1.0',
            metrics=best_metrics,
            dataset_size=len(ts_df),
            best_test_size=0.2,
            feature_names=feature_cols
        )

        logger.info(f"Demand forecast best model: {best_model_name} with R2={best_metrics['r2']:.4f}")

        return {
            'models': {name: {'metrics': metrics[name]} for name in models},
            'best_model': best_model_name,
            'best_metrics': best_metrics,
            'model_path': filepath
        }


class RunPredictionsPipeline:
    """
    Pipeline for generating predictions for a business.

    This pipeline orchestrates:
    - Sales and Revenue forecasting
    - Product risk scoring
    - Business health scoring
    - Storing predictions in the database
    """

    def __init__(self, business_id: int):
        self.business_id = business_id
        self.versioning_service = ModelVersioningService()
        self.prediction_service = PredictionService(self.versioning_service)
        self.risk_service = RiskScoringService()
        self.health_service = BusinessHealthService()

    def run(self) -> Dict[str, Any]:
        """
        Execute the prediction pipeline for the business.

        Returns:
            A dictionary containing prediction results.
        """
        logger.info(f"Starting prediction pipeline for business {self.business_id}")

        results = {}

        from analytics.models import Prediction
        from businesses.models import Business
        from products.models import Product

        business = Business.objects.get(id=self.business_id)
        products = Product.objects.filter(business=business)

        # 1. Sales and Revenue predictions for each product
        sales_predictions = []
        revenue_predictions = []

        for product in products:
            try:
                # Sales prediction
                sales_result = self.prediction_service.predict_sales(
                    business_id=self.business_id, product_id=product.id
                )
                sales_predictions.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'prediction': sales_result
                })

                # Save to database
                Prediction.objects.create(
                    business=business,
                    product=product,
                    prediction_type='sales_forecast',
                    predicted_at=datetime.now(),
                    period_start=datetime.now().date(),
                    period_end=(datetime.now().date()),
                    value=sales_result['predicted_value'],
                    confidence=sales_result['confidence_score'],
                    model_name=sales_result['model_used'],
                    model_version=sales_result['model_version'],
                )

                # Revenue prediction
                revenue_result = self.prediction_service.predict_revenue(
                    business_id=self.business_id, product_id=product.id
                )
                revenue_predictions.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'prediction': revenue_result
                })

                Prediction.objects.create(
                    business=business,
                    product=product,
                    prediction_type='demand_forecast',
                    predicted_at=datetime.now(),
                    period_start=datetime.now().date(),
                    period_end=datetime.now().date(),
                    value=revenue_result['predicted_value'],
                    confidence=revenue_result['confidence_score'],
                    model_name=revenue_result['model_used'],
                    model_version=revenue_result['model_version'],
                )

            except Exception as e:
                logger.error(f"Error predicting for product {product.id}: {e}")
                sales_predictions.append({
                    'product_id': product.id,
                    'error': str(e)
                })

        results['sales_predictions'] = sales_predictions
        results['revenue_predictions'] = revenue_predictions

        # 2. Product risk scoring
        risk_scores = self.risk_service.calculate_risk_for_business(self.business_id)
        for product_id, risk_data in risk_scores.items():
            try:
                product = Product.objects.get(id=int(product_id))
                Prediction.objects.create(
                    business=business,
                    product=product,
                    prediction_type='product_risk',
                    predicted_at=datetime.now(),
                    period_start=datetime.now().date(),
                    period_end=datetime.now().date(),
                    value=risk_data['risk_score'],
                    confidence=1.0,  # Rule-based, confidence is not applicable in same way
                    model_name='RiskScoringService',
                    model_version='1.0',
                )
            except Exception as e:
                logger.error(f"Error saving risk prediction for product {product_id}: {e}")

        results['product_risk_scores'] = risk_scores

        # 3. Business health score
        health_score = self.health_service.calculate_health_for_business(self.business_id)

        # Save business health prediction for the first product (or a placeholder)
        if products.exists():
            Prediction.objects.create(
                business=business,
                product=products.first(),
                prediction_type='business_health',
                predicted_at=datetime.now(),
                period_start=datetime.now().date(),
                period_end=datetime.now().date(),
                value=health_score['health_score'],
                confidence=1.0,
                model_name='BusinessHealthService',
                model_version='1.0',
            )

        results['business_health_score'] = health_score

        logger.info(f"Prediction pipeline complete for business {self.business_id}")
        return results
