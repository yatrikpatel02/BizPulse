from rest_framework import serializers
from analytics.models import Insight


class InsightSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')
    source_type = serializers.SerializerMethodField()

    class Meta:
        model = Insight
        fields = [
            'id', 'business', 'import_batch', 'insight_type',
            'title', 'description', 'severity', 'generated_at', 'is_read',
            'source_type',
        ]
        read_only_fields = ['id', 'generated_at']

    def get_source_type(self, obj):
        if obj.insight_type == 'market_intel_existing':
            return 'existing_product'
        if obj.insight_type == 'market_intel_opportunity':
            return 'opportunity_keyword'
        return None
