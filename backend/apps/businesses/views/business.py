from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from businesses.models.business import Business
from businesses.serializers.business import BusinessSerializer


class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see and edit their own business
        return Business.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], url_path='clear-data')
    def clear_data(self, request, pk=None):
        business = self.get_object()

        # Purge all related data
        business.sales_records.all().delete()
        business.inventory_snapshots.all().delete()
        business.customer_reviews.all().delete()
        business.predictions.all().delete()
        business.insights.all().delete()
        business.competitor_prices.all().delete()
        business.google_trends_data.all().delete()
        business.column_mappings.all().delete()

        # Delete ImportBatches
        from integrations.models.import_batch import ImportBatch
        ImportBatch.objects.filter(business=business).delete()

        # Delete products and reports
        business.products.all().delete()
        business.reports.all().delete()

        return Response({'detail': f'All data for company "{business.name}" has been cleared successfully.'}, status=status.HTTP_200_OK)
