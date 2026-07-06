from rest_framework import serializers
from products.models.product import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'business', 'name', 'description', 'sku', 'price', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'business', 'created_at', 'updated_at']
