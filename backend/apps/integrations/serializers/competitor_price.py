from rest_framework import serializers
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
    product_id = serializers.IntegerField()

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
