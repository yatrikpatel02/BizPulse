from rest_framework import serializers
from analytics.models import SalesRecord


class SalesRecordSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')
    product_name = serializers.ReadOnlyField(source='product.name')
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SalesRecord
        fields = [
            'id', 'business', 'product', 'product_name', 'date', 'quantity',
            'unit_price', 'revenue', 'created_at', 'import_batch'
        ]
        read_only_fields = ['id', 'created_at', 'unit_price']
