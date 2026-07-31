from rest_framework import serializers
from analytics.models import Insight


class InsightSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')

    class Meta:
        model = Insight
        fields = [
            'id', 'business', 'import_batch', 'insight_type',
            'title', 'description', 'severity', 'generated_at', 'is_read'
        ]
        read_only_fields = ['id', 'generated_at']