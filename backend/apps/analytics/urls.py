from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    SalesRecordViewSet,
    InventorySnapshotViewSet,
    CustomerReviewViewSet,
    ReviewSentimentViewSet,
    ComplaintCategoryViewSet,
    PredictionViewSet,
    InsightViewSet,
)
from .views.sales_analytics import SalesAnalyticsView
from .views.inventory_analytics import InventoryAnalyticsView
from .views.customer_intelligence import CustomerIntelligenceView

router = SimpleRouter()
router.register(r'sales-records', SalesRecordViewSet, basename='sales-record')
router.register(r'inventory-snapshots', InventorySnapshotViewSet, basename='inventory-snapshot')
router.register(r'customer-reviews', CustomerReviewViewSet, basename='customer-review')
router.register(r'review-sentiments', ReviewSentimentViewSet, basename='review-sentiment')
router.register(r'complaint-categories', ComplaintCategoryViewSet, basename='complaint-category')
router.register(r'predictions', PredictionViewSet, basename='prediction')
router.register(r'insights', InsightViewSet, basename='insight')

urlpatterns = [
    path('sales-analysis/', SalesAnalyticsView.as_view(), name='sales-analytics'),
    path('inventory-analysis/', InventoryAnalyticsView.as_view(), name='inventory-analytics'),
    path('customer-analysis/', CustomerIntelligenceView.as_view(), name='customer-analysis'),
    path('', include(router.urls)),
]
