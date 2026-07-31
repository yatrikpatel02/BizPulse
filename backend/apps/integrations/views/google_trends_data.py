from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from businesses.models.business import Business
from integrations.models import GoogleTrendsData
from integrations.serializers import GoogleTrendsDataSerializer


class GoogleTrendsDataViewSet(viewsets.ModelViewSet):
    serializer_class = GoogleTrendsDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['business', 'keyword', 'region', 'date']
    search_fields = ['keyword', 'region']
    ordering_fields = ['date', 'keyword', 'region']
    ordering = ['-date']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return GoogleTrendsData.objects.none()
        return GoogleTrendsData.objects.filter(business__owner=self.request.user)

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
