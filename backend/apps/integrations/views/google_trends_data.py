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
        values = value if isinstance(value, list) else value.split(',') if isinstance(value, str) else []
        result, seen = [], set()
        for item in values:
            keyword = str(item).strip() if item else ''
            if keyword and keyword.casefold() not in seen:
                seen.add(keyword.casefold())
                result.append(keyword)
        return result
