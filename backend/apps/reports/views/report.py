from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from businesses.models.business import Business
from reports.models import Report
from reports.serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['business', 'report_type', 'status']
    search_fields = ['report_type']
    ordering_fields = ['generated_at', 'report_type', 'status']
    ordering = ['-generated_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Report.objects.none()
        return Report.objects.filter(business=self.get_user_business())

    def perform_create(self, serializer):
        business = self.get_user_business()
        report_type = serializer.validated_data.get('report_type')
        serializer.save(
            business=business,
            status='completed',
            file_path=f"/media/reports/{business.id}_{report_type}.pdf"
        )

    def get_user_business(self):
        business_id = self.request.headers.get('X-Business-Id') or self.request.query_params.get('business_id')
        if business_id:
            try:
                return Business.objects.get(id=business_id, owner=self.request.user)
            except (Business.DoesNotExist, ValueError):
                pass
        
        # Fallback to the user's first business
        first_biz = Business.objects.filter(owner=self.request.user).first()
        if not first_biz:
            raise ValidationError(
                {"detail": "You must create a business before adding records."}
            )
        return first_biz
