from rest_framework import serializers
from analytics.models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')

    class Meta:
        model = Prediction
        fields = [
            'id', 'business', 'import_batch', 'prediction_type',
            'predicted_at', 'period_start', 'period_end',
            'value', 'confidence', 'model_version'
        ]
        read_only_fields = ['id', 'predicted_at']