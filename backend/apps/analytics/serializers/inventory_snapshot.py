from rest_framework import serializers
from analytics.models import InventorySnapshot


class InventorySnapshotSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = InventorySnapshot
        fields = [
            'id', 'business', 'product', 'product_name', 'date', 'quantity_on_hand',
            'reorder_point', 'created_at', 'import_batch'
        ]
        read_only_fields = ['id', 'created_at']
