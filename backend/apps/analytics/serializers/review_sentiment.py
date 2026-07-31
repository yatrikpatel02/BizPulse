from rest_framework import serializers
from analytics.models import ReviewSentiment


class ReviewSentimentSerializer(serializers.ModelSerializer):
    review_name = serializers.StringRelatedField(source='review')
    sentiment = serializers.ChoiceField(choices=[
        'positive', 'neutral', 'negative', 'mixed', 'misleading', 'ignored'
    ])
    confidence_score = serializers.FloatField(allow_null=True)

    class Meta:
        model = ReviewSentiment
        fields = ['id', 'review', 'review_name', 'sentiment', 'confidence_score', 'analyzed_at']
        read_only_fields = ['analyzed_at']
