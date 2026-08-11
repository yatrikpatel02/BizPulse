from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from businesses.models.business import Business
from integrations.models import MarketKeyword
from integrations.serializers import MarketKeywordSerializer


class MarketKeywordViewSet(viewsets.ModelViewSet):
    serializer_class = MarketKeywordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['business', 'is_active']
    search_fields = ['keyword']
    ordering_fields = ['created_at', 'keyword']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MarketKeyword.objects.none()
        return MarketKeyword.objects.filter(business__owner=self.request.user)

    def perform_create(self, serializer):
        business = self.get_user_business()
        keyword = serializer.validated_data.get('keyword', '').strip()
        if MarketKeyword.objects.filter(business=business, keyword__iexact=keyword).exists():
            raise ValidationError({'keyword': 'This keyword already exists for your business.'})
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
                {"detail": "You must create a business before adding market keywords."}
            )
        return business

    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request, *args, **kwargs):
        business = self.get_user_business()
        keywords = MarketKeyword.objects.filter(business=business, is_active=True)
        serializer = self.get_serializer(keywords, many=True)
        return Response(serializer.data)
