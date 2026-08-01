from django.urls import path
from analytics.views import SalesRecordListView, InventorySnapshotListView, CustomerReviewListView

urlpatterns = [
    path('sales/', SalesRecordListView.as_view(), name='sales-list'),
    path('inventory/', InventorySnapshotListView.as_view(), name='inventory-list'),
    path('reviews/', CustomerReviewListView.as_view(), name='reviews-list'),
]
