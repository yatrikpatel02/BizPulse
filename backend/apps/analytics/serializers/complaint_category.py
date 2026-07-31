from rest_framework import serializers
from analytics.models import ComplaintCategory


class ComplaintCategorySerializer(serializers.ModelSerializer):
    review_name = serializers.StringRelatedField(source='review')
    category = serializers.CharField(max_length=100)
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=True,
        required=False
    )

    class Meta:
        model = ComplaintCategory
        fields = ['id', 'review', 'review_name', 'category', 'keywords', 'analyzed_at']
        read_only_fields = ['analyzed_at']
