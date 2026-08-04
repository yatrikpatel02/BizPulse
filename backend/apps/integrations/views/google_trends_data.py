import datetime

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from businesses.models.business import Business
from integrations.models import GoogleTrendsData
from integrations.serializers import GoogleTrendsDataSerializer
from integrations.services import GoogleTrendsService


class GoogleTrendsDataViewSet(viewsets.ModelViewSet):
    serializer_class = GoogleTrendsDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['business', 'keyword', 'region', 'date']
    search_fields = ['keyword', 'region']
    ordering_fields = ['date', 'keyword', 'region', 'fetched_at']
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

    @action(detail=False, methods=['post'], url_path='collect')
    def collect(self, request, *args, **kwargs):
        business = self.get_user_business()
        keywords = self._parse_keywords(request.data.get('keywords'))
        if not keywords:
            return Response(
                {"detail": "The 'keywords' parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        region = request.data.get('region', GoogleTrendsService.DEFAULT_REGION)
        days = int(request.data.get('days', GoogleTrendsService.DEFAULT_DAYS))

        service = GoogleTrendsService()
        series = service.collect_trends(business, keywords, region=region, days=days)

        totals = {kw: len(points) for kw, points in series.items()}
        return Response(
            {
                "status": "collected",
                "business": business.name,
                "region": region,
                "days": days,
                "keywords": keywords,
                "records_per_keyword": totals,
                "total_records": sum(totals.values()),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='time-series')
    def time_series(self, request, *args, **kwargs):
        business = self.get_user_business()
        keywords = self._parse_keywords(request.query_params.get('keywords', ''))
        if not keywords:
            return Response(
                {"detail": "The 'keywords' query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        region = request.query_params.get('region', GoogleTrendsService.DEFAULT_REGION)
        days = int(request.query_params.get('days', GoogleTrendsService.DEFAULT_DAYS))

        service = GoogleTrendsService()
        series = service.get_time_series(business, keywords, region=region, days=days)
        return Response({"region": region, "time_series": series}, status=status.HTTP_200_OK)

    @staticmethod
    def _parse_keywords(value):
        if not value:
            return []
        if isinstance(value, list):
            return [str(v).strip() for v in value if v]
        if isinstance(value, str):
            return [kw.strip() for kw in value.split(',') if kw.strip()]
        return []
