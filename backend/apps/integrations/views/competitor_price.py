from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from businesses.models.business import Business
from integrations.models import CompetitorPrice
from integrations.serializers import CompetitorPriceSerializer


class CompetitorPriceViewSet(viewsets.ModelViewSet):
    serializer_class = CompetitorPriceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['business', 'product', 'competitor_name']
    search_fields = ['competitor_name', 'product__name']
    ordering_fields = ['recorded_at', 'price']
    ordering = ['-recorded_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CompetitorPrice.objects.none()
        return CompetitorPrice.objects.filter(business__owner=self.request.user)

    def perform_create(self, serializer):
        business = self.get_user_business()
        serializer.save(business=business)

    def get_user_business(self):
        try:
            return Business.objects.get(owner=self.request.user)
        except Business.DoesNotExist:
            raise ValidationError(
                {"detail": "You must create a business before adding records."}
            )
