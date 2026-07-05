from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from products.models.product import Product
from products.serializers.product import ProductSerializer
from businesses.models.business import Business

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see products for their own business
        if getattr(self, 'swagger_fake_view', False):
            return Product.objects.none()
        return Product.objects.filter(business__owner=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign the business based on the authenticated user
        try:
            business = Business.objects.get(owner=self.request.user)
        except Business.DoesNotExist:
            raise ValidationError({"detail": "You must create a business before adding products."})
        
        serializer.save(business=business)
