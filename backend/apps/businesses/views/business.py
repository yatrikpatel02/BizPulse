from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from businesses.models.business import Business
from businesses.serializers.business import BusinessSerializer

class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see and edit their own business
        return Business.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        if Business.objects.filter(owner=self.request.user).exists():
            raise ValidationError({"detail": "User already has a business."})
        serializer.save(owner=self.request.user)
