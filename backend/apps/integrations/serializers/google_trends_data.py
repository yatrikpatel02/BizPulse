from rest_framework import serializers
from integrations.models import GoogleTrendsData


class GoogleTrendsDataSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')

    class Meta:
        model = GoogleTrendsData
        fields = ['id', 'business', 'keyword', 'region', 'date', 'interest_score']
        read_only_fields = ['id']
