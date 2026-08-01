from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from businesses.models import Business
from analytics.services.customer_intelligence import CustomerIntelligenceService


class CustomerIntelligenceView(APIView):
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

        # 2. Compute customer intelligence metrics
        try:
            metrics = CustomerIntelligenceService.calculate_satisfaction_metrics(
                business=business
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Construct payload response
        payload = {
            "business_id": business.id,
            "business_name": business.name,
            **metrics
        }

        return Response(payload, status=status.HTTP_200_OK)
