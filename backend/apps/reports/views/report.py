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
        return Report.objects.filter(business__owner=self.request.user)

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
