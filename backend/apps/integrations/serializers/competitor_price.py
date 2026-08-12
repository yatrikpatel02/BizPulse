from rest_framework import serializers
from businesses.models.business import Business
from integrations.models import CompetitorPrice

from products.models import Product


class CompetitorPriceSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.ReadOnlyField(source='product.price')

    class Meta:
        model = CompetitorPrice
        fields = [
            'id', 'business', 'product', 'product_name', 'product_price', 'competitor_name',
            'price', 'recorded_at', 'url'
        ]
        read_only_fields = ['id', 'recorded_at']


class CompetitorPriceCollectSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False)
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
    )
    all_products = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not any(key in attrs for key in ('product_id', 'product_ids', 'all_products')):
            raise serializers.ValidationError(
                "Provide one of: product_id, product_ids, or all_products."
            )
        return attrs

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")

        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if product.business.owner != request.user:
                raise serializers.ValidationError(
                    "Product does not belong to your business."
                )

        return product

    def validate_product_ids(self, value):
        products = []
        for pid in value:
            try:
                product = Product.objects.get(id=pid)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with id {pid} not found.")

            request = self.context.get('request')
            if request and request.user.is_authenticated:
                if product.business.owner != request.user:
                    raise serializers.ValidationError(
                        f"Product with id {pid} does not belong to your business."
                    )

            products.append(product)
        return products

    @staticmethod
    def _get_user_business(request):
        business_id = (
            getattr(request, 'headers', {}).get('X-Business-Id') or
            getattr(request, 'META', {}).get('HTTP_X_BUSINESS_ID') or
            request.query_params.get('business_id') or
            request.query_params.get('business')
        )
        if business_id:
            try:
                return Business.objects.get(id=business_id, owner=request.user)
            except Business.DoesNotExist:
                raise serializers.ValidationError(
                    {"detail": "The specified business does not exist or you do not own it."}
                )

        business = Business.objects.filter(owner=request.user).first()
        if not business:
            raise serializers.ValidationError(
                {"detail": "You must create a business before adding records."}
            )
        return business

    def create_collect_context(self):
        request = self.context.get('request')
        if self.validated_data.get('all_products'):
            business = self._get_user_business(request)
            products = Product.objects.filter(business=business, is_active=True)
            return business, list(products)

        if self.validated_data.get('product_ids'):
            return self.validated_data['product_ids'][0].business, list(self.validated_data['product_ids'])

        product = self.validated_data['product_id']
        return product.business, [product]
