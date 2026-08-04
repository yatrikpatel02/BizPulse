"""
Business Health Score Service for BizPulse Analytics.
"""
import logging
from typing import Dict, Any
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class BusinessHealthService:
    """
    Service for calculating business health scores using a weighted rule-based approach.

    The health score considers five key factors, each weighted according to its
    relative importance to overall business well-being:
        - Revenue Growth (25%)
        - Inventory Health (20%)
        - Customer Sentiment (20%)
        - Sales Trend (20%)
        - Market Demand (15%)

    The score is normalized to a 0-100 scale with categories:
        Excellent (80-100), Good (60-79), Average (40-59), Poor (0-39)
    """

    # Weights for each factor (must sum to 1.0)
    FACTOR_WEIGHTS = {
        'revenue_growth': 0.25,
        'inventory_health': 0.20,
        'customer_sentiment': 0.20,
        'sales_trend': 0.20,
        'market_demand': 0.15,
    }

    def calculate_health_score(self, business_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate the business health score.

        Args:
            business_data: A dictionary containing:
                - revenue_growth: float (percentage change in revenue, e.g., 0.1 for 10% growth)
                - inventory_health: float (0-1, ratio of products with healthy stock levels)
                - customer_sentiment: float (average review rating 0-5)
                - sales_trend: float (percentage change in sales)
                - market_demand: float (average Google Trends interest score 0-100)

        Returns:
            A dictionary with 'health_score', 'health_category', and 'factors'.
        """
        logger.info(f"Calculating business health score for data: {business_data}")

        factors = self._normalize_factors(business_data)

        # Weighted sum of normalized factors (each factor is 0-1)
        health_score = sum(
            factors[factor] * weight
            for factor, weight in self.FACTOR_WEIGHTS.items()
        )

        # Convert to 0-100 scale
        health_score = health_score * 100

        # Determine health category
        if health_score >= 80:
            health_category = 'Excellent'
        elif health_score >= 60:
            health_category = 'Good'
        elif health_score >= 40:
            health_category = 'Average'
        else:
            health_category = 'Poor'

        return {
            'health_score': round(health_score, 2),
            'health_category': health_category,
            'factors': {k: round(v, 4) for k, v in factors.items()}
        }

    def _normalize_factors(self, business_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Normalize each factor to a 0-1 scale (higher = healthier).
        """
        factors = {}

        # 1. Revenue Growth: positive growth is healthy
        revenue_growth = business_data.get('revenue_growth', 0.0)
        # -50% growth = 0, +50% growth = 1
        if revenue_growth >= 0:
            factors['revenue_growth'] = min(1.0, revenue_growth / 0.5)
        else:
            factors['revenue_growth'] = max(0.0, (1 + revenue_growth / 0.5) / 2)

        # 2. Inventory Health: ratio of healthy stock (0-1)
        factors['inventory_health'] = max(0.0, min(1.0, business_data.get('inventory_health', 0.5)))

        # 3. Customer Sentiment: average rating 0-5, normalized
        customer_sentiment = business_data.get('customer_sentiment', 2.5)
        factors['customer_sentiment'] = max(0.0, min(1.0, customer_sentiment / 5.0))

        # 4. Sales Trend: positive trend is healthy (same as revenue growth)
        sales_trend = business_data.get('sales_trend', 0.0)
        if sales_trend >= 0:
            factors['sales_trend'] = min(1.0, sales_trend / 0.5)
        else:
            factors['sales_trend'] = max(0.0, (1 + sales_trend / 0.5) / 2)

        # 5. Market Demand: Google Trends interest (0-100)
        market_demand = business_data.get('market_demand', 50.0)
        factors['market_demand'] = max(0.0, min(1.0, market_demand / 100.0))

        return factors

    def calculate_health_for_business(self, business_id: int, use_predictions: bool = False) -> Dict[str, Any]:
        """
        Calculate the business health score using actual data from the database.

        Args:
            business_id: The ID of the business
            use_predictions: If True, calculates health using predicted future sales/revenue

        Returns:
            A dictionary with 'health_score', 'health_category', and 'factors'.
        """
        from analytics.services.ml_service import DataPreprocessingService

        preprocessor = DataPreprocessingService()
        data_dict = preprocessor.preprocess_data(business_id)

        sales_df = data_dict.get('sales', pd.DataFrame())
        inventory_df = data_dict.get('inventory', pd.DataFrame())
        reviews_df = data_dict.get('reviews', pd.DataFrame())
        trends_df = data_dict.get('google_trends', pd.DataFrame())

        # Calculate revenue growth and sales trend
        if use_predictions:
            from analytics.services.ml_service import PredictionService, ModelVersioningService
            from products.models import Product

            versioning_service = ModelVersioningService()
            prediction_service = PredictionService(versioning_service)
            products = Product.objects.filter(business_id=business_id)

            predicted_revenue = 0.0
            predicted_quantity = 0.0

            for prod in products:
                try:
                    sales_pred = prediction_service.predict_sales(business_id, prod.id)
                    predicted_revenue += sales_pred.get('predicted_value', 0.0)
                except Exception:
                    pass
                try:
                    demand_pred = prediction_service.predict_revenue(business_id, prod.id)
                    predicted_quantity += demand_pred.get('predicted_value', 0.0)
                except Exception:
                    pass

            if not sales_df.empty and 'revenue' in sales_df.columns:
                sales_sorted = sales_df.sort_values('date')
                midpoint = len(sales_sorted) // 2
                recent_half_revenue = sales_sorted['revenue'][midpoint:].sum()
                recent_half_quantity = sales_sorted['quantity_sold'][midpoint:].mean()

                # Scale predicted revenue to be comparable if needed, or compute percent growth
                if recent_half_revenue > 0:
                    revenue_growth = (predicted_revenue * 4.0 - recent_half_revenue) / recent_half_revenue
                else:
                    revenue_growth = 0.15

                if recent_half_quantity > 0:
                    sales_trend = (predicted_quantity * 4.0 - recent_half_quantity) / recent_half_quantity
                else:
                    sales_trend = 0.10
            else:
                revenue_growth = 0.18
                sales_trend = 0.12
        else:
            # Calculate actual historical revenue growth
            if not sales_df.empty and 'revenue' in sales_df.columns:
                sales_sorted = sales_df.sort_values('date')
                midpoint = len(sales_sorted) // 2
                first_half_revenue = sales_sorted['revenue'][:midpoint].sum()
                second_half_revenue = sales_sorted['revenue'][midpoint:].sum()
                if first_half_revenue > 0:
                    revenue_growth = (second_half_revenue - first_half_revenue) / first_half_revenue
                else:
                    revenue_growth = 0.0
            else:
                revenue_growth = 0.0

            # Calculate actual historical sales trend (quantity)
            if not sales_df.empty and 'quantity_sold' in sales_df.columns:
                sales_sorted = sales_df.sort_values('date')
                midpoint = len(sales_sorted) // 2
                first_half_sales = sales_sorted['quantity_sold'][:midpoint].mean()
                second_half_sales = sales_sorted['quantity_sold'][midpoint:].mean()
                if first_half_sales > 0:
                    sales_trend = (second_half_sales - first_half_sales) / first_half_sales
                else:
                    sales_trend = 0.0
            else:
                sales_trend = 0.0

        # Calculate inventory health (ratio of products with adequate stock)
        if not inventory_df.empty and 'inventory_level' in inventory_df.columns and 'reorder_level' in inventory_df.columns:
            latest_inventory = inventory_df.sort_values('date').groupby('product_id').last()
            healthy = (latest_inventory['inventory_level'] >= latest_inventory['reorder_level']).sum()
            total = len(latest_inventory)
            inventory_health = healthy / total if total > 0 else 0.0
        else:
            inventory_health = 0.0

        # Calculate customer sentiment
        if not reviews_df.empty and 'review_rating' in reviews_df.columns:
            customer_sentiment = reviews_df['review_rating'].mean()
        else:
            customer_sentiment = 2.5

        # Calculate market demand (average Google Trends interest)
        if not trends_df.empty and 'google_trends_interest' in trends_df.columns:
            market_demand = trends_df['google_trends_interest'].mean()
        else:
            market_demand = 50.0

        business_data = {
            'revenue_growth': revenue_growth,
            'inventory_health': inventory_health,
            'customer_sentiment': customer_sentiment,
            'sales_trend': sales_trend,
            'market_demand': market_demand,
        }

        return self.calculate_health_score(business_data)
