"""
API Views for the Machine Learning Integration endpoints.

Endpoints:
    POST   /api/ml/train/          -> Train all models
    POST   /api/ml/predict/        -> Predict for a product
    GET    /api/ml/predictions/    -> Prediction history
    GET    /api/ml/models/         -> Model comparison and evaluation metrics
"""
import logging
import os
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError

from businesses.models import Business
from products.models import Product
from analytics.models import Prediction
from analytics.serializers import (
    PredictionSerializer,
    MLTrainRequestSerializer,
    MPPredictRequestSerializer,
    MPPredictResponseSerializer,
)
from analytics.services.ml_pipeline import TrainAllModelsPipeline, RunPredictionsPipeline
from analytics.services.ml_service import ModelVersioningService
from analytics.services.retraining_service import RetrainingService

logger = logging.getLogger(__name__)


class MLTrainView(APIView):
    """
    Endpoint: POST /api/ml/train/
    Train all ML models for a given business.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user

        serializer = MLTrainRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business_id = serializer.validated_data['business_id']

        # Resolve business and verify ownership
        try:
            business = Business.objects.get(id=business_id, owner=user)
        except (Business.DoesNotExist, ValueError):
            return Response(
                {"detail": "Business not found or access denied."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            pipeline = TrainAllModelsPipeline(business_id=business.id)
            results = pipeline.run()

            # Record a training baseline so future dataset changes are
            # measured from this run for automatic retraining decisions.
            sales_results = results.get('sales_forecast') or {}
            demand_results = results.get('demand_forecast') or {}
            if sales_results or demand_results:
                RetrainingService.record_training(business.id)

            response_data = {
                "success": True,
                "message": "All models trained successfully.",
                "results": results,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error training models for business {business.id}: {e}")
            return Response(
                {"detail": f"Error training models: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MLPredictView(APIView):
    """
    Endpoint: POST /api/ml/predict/
    Predict sales or revenue for a product.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user

        serializer = MPPredictRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business_id = serializer.validated_data['business_id']
        product_id = serializer.validated_data['product_id']
        prediction_type = serializer.validated_data['prediction_type']

        # Resolve business and product, verify ownership
        try:
            business = Business.objects.get(id=business_id, owner=user)
            product = Product.objects.get(id=product_id, business=business)
        except (Business.DoesNotExist, Product.DoesNotExist, ValueError):
            return Response(
                {"detail": "Business or product not found, or access denied."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            from analytics.services.ml_service import PredictionService
            versioning_service = ModelVersioningService()
            prediction_service = PredictionService(versioning_service)

            if prediction_type == 'sales_forecast':
                result = prediction_service.predict_sales(
                    business_id=business.id, product_id=product.id
                )
            else:  # demand_forecast -> revenue
                result = prediction_service.predict_revenue(
                    business_id=business.id, product_id=product.id
                )

            # Save prediction to database
            today = datetime.now().date()
            Prediction.objects.create(
                business=business,
                product=product,
                prediction_type=prediction_type,
                period_start=today,
                period_end=today,
                value=result['predicted_value'],
                confidence=result['confidence_score'],
                model_name=result['model_used'],
                model_version=result['model_version'],
            )

            response = {
                "prediction": result['predicted_value'],
                "confidence_score": result['confidence_score'],
                "model_used": result['model_used'],
                "model_version": result['model_version'],
                "prediction_date": result['prediction_date'],
            }

            return Response(response, status=status.HTTP_200_OK)
        except FileNotFoundError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error predicting for product {product.id}: {e}")
            return Response(
                {"detail": f"Error making prediction: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MLPredictionsListView(APIView):
    """
    Endpoint: GET /api/ml/predictions/
    Retrieve prediction history for the user's business(es).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        queryset = Prediction.objects.filter(business__owner=user)

        # Filter by business_id if provided
        business_id = request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)

        # Filter by product_id if provided
        product_id = request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Filter by prediction_type if provided
        prediction_type = request.query_params.get('prediction_type')
        if prediction_type:
            queryset = queryset.filter(prediction_type=prediction_type)

        serializer = PredictionSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MLRetrainingStatusView(APIView):
    """
    Endpoint: GET /api/ml/retraining-status/
    Retrieve the current automatic retraining decision for a business.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        business_id = request.query_params.get('business_id')

        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=user)
            except (Business.DoesNotExist, ValueError):
                return Response(
                    {"detail": "Business not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            business = Business.objects.filter(owner=user).first()
            if not business:
                return Response(
                    {"detail": "You must create a business before viewing retraining status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        service = RetrainingService(business_id=business.id)
        decision = service.evaluate()

        return Response(decision, status=status.HTTP_200_OK)


class MLModelsListView(APIView):
    """
    Endpoint: GET /api/ml/models/
    Retrieve model comparison and evaluation metrics.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        business_id = request.query_params.get('business_id')

        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=user)
            except (Business.DoesNotExist, ValueError):
                return Response(
                    {"detail": "Business not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            business = Business.objects.filter(owner=user).first()
            if not business:
                return Response(
                    {"detail": "You must create a business before viewing models."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        versioning_service = ModelVersioningService(model_dir=None)
        model_dir = versioning_service.model_dir

        models_info = []
        for filename in sorted(os.listdir(model_dir)):
            if filename.endswith('.joblib'):
                filepath = os.path.join(model_dir, filename)
                try:
                    info = versioning_service.get_model_info(filepath)
                    models_info.append(info)
                except Exception as e:
                    logger.warning(f"Could not load model info from {filename}: {e}")

        return Response(models_info, status=status.HTTP_200_OK)
