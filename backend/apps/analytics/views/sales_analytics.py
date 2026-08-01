from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError

from businesses.models import Business
from analytics.services.sales_analytics import SalesAnalyticsService


class SalesAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # 1. Resolve business scope
        business_id = request.query_params.get('business_id')
        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=user)
            except (Business.DoesNotExist, ValueError):
                return Response(
                    {"detail": "Business not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            business = Business.objects.filter(owner=user).first()
            if not business:
                return Response(
                    {"detail": "You must create a business before viewing analytics."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 2. Parse query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        interval = request.query_params.get('interval', 'daily')
        
        limit_val = request.query_params.get('limit', '10')
        try:
            limit = int(limit_val)
            if limit <= 0:
                raise ValueError()
        except ValueError:
            return Response(
                {"detail": "Limit parameter must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if interval not in ['daily', 'weekly', 'monthly']:
            return Response(
                {"detail": "Interval must be 'daily', 'weekly', or 'monthly'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Compute analytics metrics
        try:
            metrics = SalesAnalyticsService.calculate_revenue_metrics(
                business=business,
                start_date=start_date,
                end_date=end_date
            )
            trends = SalesAnalyticsService.analyze_sales_trends(
                business=business,
                start_date=start_date,
                end_date=end_date,
                interval=interval
            )
            product_performance = SalesAnalyticsService.calculate_product_performance(
                business=business,
                start_date=start_date,
                end_date=end_date,
                limit=limit
            )
            seasonality = SalesAnalyticsService.analyze_seasonal_patterns(
                business=business
            )
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Construct payload response
        payload = {
            "business_id": business.id,
            "business_name": business.name,
            "metrics": metrics,
            "trends": trends,
            "product_performance": product_performance,
            "seasonality": seasonality
        }

        return Response(payload, status=status.HTTP_200_OK)
