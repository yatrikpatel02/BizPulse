from rest_framework import serializers
from integrations.models import CompetitorPrice


class CompetitorPriceSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = CompetitorPrice
        fields = [
            'id', 'business', 'product', 'product_name', 'competitor_name',
            'price', 'recorded_at', 'url'
        ]
        read_only_fields = ['id', 'recorded_at']
