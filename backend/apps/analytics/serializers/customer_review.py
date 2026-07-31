from rest_framework import serializers
from analytics.models import CustomerReview


class CustomerReviewSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')
    product_name = serializers.ReadOnlyField(source='product.name', allow_null=True)

    class Meta:
        model = CustomerReview
        fields = [
            'id', 'business', 'product', 'product_name', 'import_batch', 'source',
            'external_id', 'review_date', 'rating', 'text', 'author_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
