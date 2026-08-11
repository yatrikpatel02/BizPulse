from rest_framework import serializers
from integrations.models import MarketKeyword


class MarketKeywordSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')

    class Meta:
        model = MarketKeyword
        fields = ['id', 'business', 'keyword', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_keyword(self, value):
        keyword = value.strip()
        if not keyword:
            raise serializers.ValidationError('Keyword cannot be empty.')
        if len(keyword) > 100:
            raise serializers.ValidationError('Keyword must be 100 characters or fewer.')
        return keyword
