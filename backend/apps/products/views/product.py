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
        business_id = (
            self.request.headers.get('X-Business-Id') or
            self.request.META.get('HTTP_X_BUSINESS_ID') or
            self.request.query_params.get('business_id') or
            self.request.query_params.get('business')
        )
        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=self.request.user)
            except Business.DoesNotExist:
                raise ValidationError({"detail": "The specified business does not exist or you do not own it."})
        else:
            business = Business.objects.filter(owner=self.request.user).first()
            if not business:
                raise ValidationError({"detail": "You must create a business before adding products."})
        
        serializer.save(business=business)
