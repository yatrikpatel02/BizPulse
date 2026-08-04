from django.urls import path, include
from rest_framework.routers import SimpleRouter
from analytics.views import (
    SalesRecordListView,
    InventorySnapshotListView,
    CustomerReviewListView,
    SalesRecordViewSet,
    InventorySnapshotViewSet,
    CustomerReviewViewSet,
    ReviewSentimentViewSet,
    ComplaintCategoryViewSet,
    PredictionViewSet,
    InsightViewSet,
)
from analytics.views.sales_analytics import SalesAnalyticsView
from analytics.views.inventory_analytics import InventoryAnalyticsView
from analytics.views.customer_intelligence import CustomerIntelligenceView
from analytics.views.market_insights import MarketInsightsView
from analytics.views.ml_views import MLTrainView, MLPredictView, MLPredictionsListView, MLModelsListView

router = SimpleRouter()
router.register(r'sales-records', SalesRecordViewSet, basename='sales-record')
router.register(r'inventory-snapshots', InventorySnapshotViewSet, basename='inventory-snapshot')
router.register(r'customer-reviews', CustomerReviewViewSet, basename='customer-review')
router.register(r'review-sentiments', ReviewSentimentViewSet, basename='review-sentiment')
router.register(r'complaint-categories', ComplaintCategoryViewSet, basename='complaint-category')
router.register(r'predictions', PredictionViewSet, basename='prediction')
router.register(r'insights', InsightViewSet, basename='insight')

urlpatterns = [
    # Data viewer list endpoints (simple, paginated)
    path('sales/', SalesRecordListView.as_view(), name='sales-list'),
    path('inventory/', InventorySnapshotListView.as_view(), name='inventory-list'),
    path('reviews/', CustomerReviewListView.as_view(), name='reviews-list'),

    # Analytics-Engine endpoints
    path('sales-analysis/', SalesAnalyticsView.as_view(), name='sales-analytics'),
    path('inventory-analysis/', InventoryAnalyticsView.as_view(), name='inventory-analysis'),
    path('customer-analysis/', CustomerIntelligenceView.as_view(), name='customer-analysis'),
    path('market-insights/', MarketInsightsView.as_view(), name='market-insights'),

    # Machine Learning endpoints
    path('ml/train/', MLTrainView.as_view(), name='ml-train'),
    path('ml/predict/', MLPredictView.as_view(), name='ml-predict'),
    path('ml/predictions/', MLPredictionsListView.as_view(), name='ml-predictions'),
    path('ml/models/', MLModelsListView.as_view(), name='ml-models'),

    path('', include(router.urls)),
]
