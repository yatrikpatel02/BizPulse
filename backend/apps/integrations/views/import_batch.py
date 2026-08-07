from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from businesses.models.business import Business
from integrations.models import ImportBatch
from integrations.serializers import ImportBatchSerializer


class ImportBatchViewSet(viewsets.ModelViewSet):
    serializer_class = ImportBatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['business', 'dataset_type']
    search_fields = ['original_filename']
    ordering_fields = ['uploaded_at', 'dataset_type']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ImportBatch.objects.none()
        return ImportBatch.objects.filter(business__owner=self.request.user)

    def perform_create(self, serializer):
        business = self.get_user_business()
        serializer.save(business=business)

    def get_user_business(self):
        business_id = (
            self.request.headers.get('X-Business-Id') or
            self.request.META.get('HTTP_X_BUSINESS_ID') or
            self.request.query_params.get('business_id') or
            self.request.query_params.get('business')
        )
        if business_id:
            try:
                return Business.objects.get(id=business_id, owner=self.request.user)
            except Business.DoesNotExist:
                raise ValidationError(
                    {"detail": "The specified business does not exist or you do not own it."}
                )
        
        business = Business.objects.filter(owner=self.request.user).first()
        if not business:
            raise ValidationError(
                {"detail": "You must create a business before adding records."}
            )
        return business
