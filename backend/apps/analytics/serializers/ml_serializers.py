"""
Serializers for the Machine Learning Prediction API endpoints.
"""
from rest_framework import serializers

class MLTrainRequestSerializer(serializers.Serializer):
    """
    Serializer for the POST /ml/train/ request.
    """
    business_id = serializers.IntegerField(required=True)


class MLTrainResponseSerializer(serializers.Serializer):
    """
    Serializer for the POST /ml/train/ response.
    """
    success = serializers.BooleanField()
    message = serializers.CharField()
    results = serializers.DictField()


class MPPredictRequestSerializer(serializers.Serializer):
    """
    Serializer for the POST /ml/predict/ request.
    """
    business_id = serializers.IntegerField(required=True)
    product_id = serializers.IntegerField(required=True)
    prediction_type = serializers.ChoiceField(
        choices=['sales_forecast', 'demand_forecast'],
        default='sales_forecast'
    )


class MPPredictResponseSerializer(serializers.Serializer):
    """
    Serializer for the POST /ml/predict/ response.
    """
    prediction = serializers.FloatField()
    confidence_score = serializers.FloatField()
    model_used = serializers.CharField()
    model_version = serializers.CharField()
    prediction_date = serializers.DateField()


class MLModelSerializer(serializers.Serializer):
    """
    Serializer for the GET /ml/models/ response.
    """
    model_name = serializers.CharField()
    version = serializers.CharField()
    training_date = serializers.DateTimeField()
    dataset_size = serializers.IntegerField()
    metrics = serializers.DictField()
    best_test_size = serializers.FloatField()
