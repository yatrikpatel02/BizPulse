from rest_framework import serializers
from analytics.models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')
    product = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = Prediction
        fields = [
            'id', 'business', 'product', 'import_batch', 'prediction_type',
            'predicted_at', 'period_start', 'period_end',
            'value', 'confidence', 'model_name', 'model_version'
        ]
        read_only_fields = ['id', 'predicted_at']
