from django.urls import path, include
from rest_framework.routers import DefaultRouter
from integrations.views import (
    FileUploadView,
    ColumnMappingViewSet,
    CompetitorPriceViewSet,
    GoogleTrendsDataViewSet,
    ImportBatchViewSet,
    ImportPreviewView,
    SalesImportCommitView,
    InventoryImportCommitView,
    ReviewsImportCommitView,
    MarketKeywordViewSet
)

router = DefaultRouter()
router.register('column-mappings', ColumnMappingViewSet, basename='column-mapping')
router.register('competitor-prices', CompetitorPriceViewSet, basename='competitor-price')
router.register('google-trends', GoogleTrendsDataViewSet, basename='google-trends-data')
router.register('import-batches', ImportBatchViewSet, basename='import-batch')
router.register('market-keywords', MarketKeywordViewSet, basename='market-keyword')

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('import/preview/', ImportPreviewView.as_view(), name='import-preview'),
    path('import/sales/', SalesImportCommitView.as_view(), name='import-sales'),
    path('import/inventory/', InventoryImportCommitView.as_view(), name='import-inventory'),
    path('import/reviews/', ReviewsImportCommitView.as_view(), name='import-reviews'),
    path('', include(router.urls)),
]
