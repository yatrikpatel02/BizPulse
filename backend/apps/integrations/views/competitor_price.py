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
    pagination_class = None
    filterset_fields = ['business', 'product_id', 'competitor_name']
    search_fields = ['competitor_name', 'product__name']
    ordering_fields = ['recorded_at', 'price']
    ordering = ['-recorded_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CompetitorPrice.objects.none()
        import sys
        print(f"[DEBUG-GET-QUERYSET] Query Params: {self.request.query_params}", file=sys.stderr)
        print(f"[DEBUG-GET-QUERYSET] Request Headers: {self.request.headers}", file=sys.stderr)
        queryset = CompetitorPrice.objects.select_related('product', 'business').filter(business__owner=self.request.user)
        business_id = (
            self.request.query_params.get('business_id') or 
            self.request.query_params.get('business') or
            self.request.headers.get('X-Business-Id') or
            self.request.META.get('HTTP_X_BUSINESS_ID')
        )
        print(f"[DEBUG-GET-QUERYSET] Filtered Business ID: {business_id}", file=sys.stderr)
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        return queryset

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

    @action(detail=False, methods=['post'], url_path='collect')
    def collect(self, request, *args, **kwargs):
        """Trigger competitor price collection for one or more products."""
        serializer = CompetitorPriceCollectSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        business, products = serializer.create_collect_context()

        service = CompetitorPriceService()
        all_collected = []
        for product in products:
            collected = service.collect_prices(business, product)
            all_collected.extend(collected)

        return Response(
            {
                "status": "collected",
                "business": business.name,
                "products_collected": len(products),
                "records_collected": len(all_collected),
                "results": all_collected,
            },
            status=status.HTTP_201_CREATED,
        )

