from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError

from businesses.models.business import Business
from analytics.services.trend_insight_engine import TrendInsightEngine


class MarketInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        business_id = request.query_params.get('business_id')
        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=user)
            except (Business.DoesNotExist, ValueError):
                return Response(
                    {"detail": "Business not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            business = Business.objects.filter(owner=user).first()
            if not business:
                return Response(
                    {"detail": "You must create a business before viewing market insights."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        keywords = request.query_params.get('keywords', '')
        keyword_list = [kw.strip() for kw in keywords.split(',') if kw.strip()]
        if not keyword_list:
            return Response(
                {"detail": "The 'keywords' query parameter is required (comma-separated)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        region = request.query_params.get('region', 'worldwide')
        try:
            days = int(request.query_params.get('days', 90))
        except ValueError:
            return Response(
                {"detail": "The 'days' parameter must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        refresh = request.query_params.get('refresh', '').lower() in ('1', 'true', 'yes')

        engine = TrendInsightEngine()
        try:
            insights = engine.analyze(
                business=business,
                keywords=keyword_list,
                region=region,
                days=days,
                refresh=refresh,
            )
        except ValidationError:
            raise
        except Exception as exc:
            return Response(
                {"detail": f"Failed to generate trend insights: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            "business_id": business.id,
            "business_name": business.name,
            "region": region,
            "keywords": keyword_list,
            "insights": insights,
        }, status=status.HTTP_200_OK)
