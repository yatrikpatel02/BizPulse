from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from businesses.models import Business
from analytics.services.inventory_analytics import InventoryAnalyticsService


class InventoryAnalyticsView(APIView):
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

        # 3. Compute analytics metrics
        try:
            health = InventoryAnalyticsService.calculate_inventory_health(
                business=business
            )
            anomalies = InventoryAnalyticsService.detect_stock_anomalies(
                business=business
            )
            history = InventoryAnalyticsService.get_inventory_history(
                business=business,
                start_date=start_date,
                end_date=end_date
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
            "health": health,
            "anomalies": anomalies,
            "history": history
        }

        return Response(payload, status=status.HTTP_200_OK)
