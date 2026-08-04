"""
Product Risk Scoring Service for BizPulse Analytics.
"""
import logging
from typing import Dict, Any
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class RiskScoringService:
    """
    Service for calculating product risk scores using rule-based logic.

    Since labelled data for risk classification may not be available, we use a
    rule-based approach that combines several business factors into a single
    risk score (0-100) and a categorical risk level (Low, Medium, High).
    """

    # Weights for each factor (must sum to 1.0)
    FACTOR_WEIGHTS = {
        'sales_trend': 0.30,
        'google_trends': 0.20,
        'inventory': 0.25,
        'customer_reviews': 0.15,
        'competitor_prices': 0.10,
    }

    def calculate_risk_score(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate the risk score for a single product.

        Args:
            product_data: A dictionary containing:
                - sales_trend: float (percentage change in sales, e.g., 0.1 for 10% growth)
                - google_trends: float (interest score 0-100)
                - inventory_level: int (current inventory)
                - reorder_level: int (reorder point)
                - review_rating: float (average rating 0-5)
                - competitor_price: float (our price)
                - competitor_min_price: float (lowest competitor price)

        Returns:
            A dictionary with 'risk_score', 'risk_level', and 'factors'.
        """
        logger.info(f"Calculating risk score for product data")

        factors = self._calculate_factors(product_data)

        # Weighted sum of normalized factors (each factor is 0-1)
        risk_score = (
            factors['sales_trend'] * self.FACTOR_WEIGHTS['sales_trend'] +
            factors['google_trends'] * self.FACTOR_WEIGHTS['google_trends'] +
            factors['inventory'] * self.FACTOR_WEIGHTS['inventory'] +
            factors['customer_reviews'] * self.FACTOR_WEIGHTS['customer_reviews'] +
            factors['competitor_prices'] * self.FACTOR_WEIGHTS['competitor_prices']
        )

        # Convert to 0-100 scale
        risk_score = risk_score * 100

        # Determine risk level
        if risk_score <= 33:
            risk_level = 'Low'
        elif risk_score <= 66:
            risk_level = 'Medium'
        else:
            risk_level = 'High'

        return {
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'factors': {k: round(v, 4) for k, v in factors.items()}
        }

    def _calculate_factors(self, product_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Normalize each factor to a 0-1 scale (higher = higher risk).
        """
        factors = {}

        # 1. Sales Trend: negative growth is high risk (score close to 1)
        sales_trend = product_data.get('sales_trend', 0.0)
        # If sales are growing, risk is low (0); if declining by more than 50%, risk is high (1)
        if sales_trend >= 0:
            factors['sales_trend'] = 0.0
        else:
            factors['sales_trend'] = min(1.0, abs(sales_trend) / 0.5)

        # 2. Google Trends Interest: low interest is high risk
        google_trends = product_data.get('google_trends', 50.0)
        factors['google_trends'] = max(0.0, min(1.0, (100 - google_trends) / 100))

        # 3. Inventory: stockouts are high risk, overstock is medium risk
        inventory_level = product_data.get('inventory_level', 0)
        reorder_level = product_data.get('reorder_level', 10)
        if inventory_level < reorder_level:
            # Stockout risk - very high
            factors['inventory'] = 1.0
        elif inventory_level > reorder_level * 5:
            # Overstock risk - medium
            factors['inventory'] = 0.5
        else:
            # Optimal stock - low risk
            factors['inventory'] = 0.0

        # 4. Customer Reviews: low rating is high risk
        review_rating = product_data.get('review_rating', 2.5)
        # Normalize: 5 stars = 0 risk, 0 stars = 1 risk
        factors['customer_reviews'] = max(0.0, min(1.0, (5.0 - review_rating) / 5.0))

        # 5. Competitor Prices: if our price is much higher, risk is high
        our_price = product_data.get('competitor_price', 0.0)
        competitor_min_price = product_data.get('competitor_min_price', 0.0)
        if competitor_min_price > 0 and our_price > competitor_min_price:
            price_difference_pct = (our_price - competitor_min_price) / competitor_min_price
            factors['competitor_prices'] = min(1.0, price_difference_pct)
        else:
            factors['competitor_prices'] = 0.0

        return factors

    def calculate_risk_for_business(self, business_id: int) -> Dict[int, Dict[str, Any]]:
        """
        Calculate risk scores for all products of a business.

        Args:
            business_id: The ID of the business

        Returns:
            A dictionary mapping product_id to risk score info
        """
        from analytics.services.ml_service import DataPreprocessingService
        from integrations.models import CompetitorPrice

        preprocessor = DataPreprocessingService()
        data_dict = preprocessor.preprocess_data(business_id)

        sales_df = data_dict.get('sales', pd.DataFrame())
        trends_df = data_dict.get('google_trends', pd.DataFrame())
        reviews_df = data_dict.get('reviews', pd.DataFrame())
        inventory_df = data_dict.get('inventory', pd.DataFrame())

        risk_results = {}

        if sales_df.empty:
            logger.warning(f"No sales data for business {business_id}")
            return risk_results

        for product_id in sales_df['product_id'].unique():
            # Convert to plain int for database queries
            product_id_int = int(product_id)
            product_sales = sales_df[sales_df['product_id'] == product_id]
            product_inventory = inventory_df[
                inventory_df['product_id'] == product_id
            ] if not inventory_df.empty else pd.DataFrame()

            # Calculate sales trend (percentage change over last period)
            product_sales_sorted = product_sales.sort_values('date')
            if len(product_sales_sorted) >= 2:
                midpoint = len(product_sales_sorted) // 2
                first_half = product_sales_sorted['quantity_sold'][:midpoint].mean()
                second_half = product_sales_sorted['quantity_sold'][midpoint:].mean()
                if first_half > 0:
                    sales_trend = (second_half - first_half) / first_half
                else:
                    sales_trend = 0.0
            else:
                sales_trend = 0.0

            # Get latest inventory level
            if not product_inventory.empty:
                latest_inventory = product_inventory.sort_values('date').iloc[-1]
                inventory_level = latest_inventory.get('inventory_level', 0)
                reorder_level = latest_inventory.get('reorder_level', 10)
            else:
                inventory_level = 0
                reorder_level = 10

            # Get average Google Trends interest
            if not trends_df.empty and 'google_trends_interest' in trends_df.columns:
                google_trends = float(trends_df['google_trends_interest'].mean())
            else:
                google_trends = 50.0

            # Get average review rating
            product_reviews = reviews_df[
                reviews_df['product_id'] == product_id
            ] if not reviews_df.empty else pd.DataFrame()
            if not product_reviews.empty and 'review_rating' in product_reviews.columns:
                review_rating = float(product_reviews['review_rating'].mean())
            else:
                review_rating = 2.5

            # Get competitor price information
            try:
                competitor_prices = CompetitorPrice.objects.filter(
                    business_id=business_id, product_id=product_id_int
                ).values_list('price', flat=True)
                if competitor_prices.exists():
                    prices = [float(p) for p in competitor_prices]
                    our_price = max(prices)  # Assume our price is the max
                    competitor_min_price = min(prices)
                else:
                    our_price = 0.0
                    competitor_min_price = 0.0
            except Exception as e:
                logger.warning(f"Could not fetch competitor prices: {e}")
                our_price = 0.0
                competitor_min_price = 0.0

            product_data = {
                'sales_trend': sales_trend,
                'google_trends': google_trends,
                'inventory_level': inventory_level,
                'reorder_level': reorder_level,
                'review_rating': review_rating,
                'competitor_price': our_price,
                'competitor_min_price': competitor_min_price,
            }

            risk_results[product_id] = self.calculate_risk_score(product_data)

        return risk_results
