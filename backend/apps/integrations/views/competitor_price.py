from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from businesses.models.business import Business

from integrations.models import CompetitorPrice
from integrations.serializers import CompetitorPriceSerializer, CompetitorPriceCollectSerializer
from integrations.services import CompetitorPriceService


class CompetitorPriceViewSet(viewsets.ModelViewSet):
    serializer_class = CompetitorPriceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['business', 'product_id', 'competitor_name']
    search_fields = ['competitor_name', 'product__name']
    ordering_fields = ['recorded_at', 'price']
    ordering = ['-recorded_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CompetitorPrice.objects.none()
        return CompetitorPrice.objects.select_related('product', 'business').filter(business__owner=self.request.user)

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

    @action(detail=False, methods=['post'], url_path='collect')
    def collect(self, request, *args, **kwargs):
        """Trigger a competitor price collection for a specific product."""
        serializer = CompetitorPriceCollectSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product_id']
        business = product.business

        service = CompetitorPriceService()
        collected = service.collect_prices(business, product)

        return Response(
            {
                "status": "collected",
                "product_id": product.id,
                "business": business.name,
                "records_collected": len(collected),
                "results": collected,
            },
            status=status.HTTP_201_CREATED,
        )
