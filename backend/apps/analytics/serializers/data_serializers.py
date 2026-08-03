from rest_framework import serializers
from analytics.models import SalesRecord, InventorySnapshot, CustomerReview


class SalesRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SalesRecord
        fields = ['id', 'product_name', 'date', 'quantity', 'revenue', 'unit_price', 'created_at']


class InventorySnapshotSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = InventorySnapshot
        fields = ['id', 'product_name', 'date', 'quantity_on_hand', 'reorder_point', 'created_at']


class CustomerReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None

    class Meta:
        model = CustomerReview
        fields = ['id', 'product_name', 'review_date', 'rating', 'text', 'author_name', 'source', 'created_at']
