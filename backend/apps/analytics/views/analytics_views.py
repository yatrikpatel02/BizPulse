from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
import traceback


from businesses.models.business import Business
from analytics.models import (
    SalesRecord,
    InventorySnapshot,
    CustomerReview,
    ReviewSentiment,
    ComplaintCategory,
    Prediction,
    Insight,
)
from analytics.serializers import (
    SalesRecordSerializer,
    InventorySnapshotSerializer,
    CustomerReviewSerializer,
    ReviewSentimentSerializer,
    ComplaintCategorySerializer,
    PredictionSerializer,
    InsightSerializer,
)
from analytics.services.retraining_service import RetrainingService


class BusinessScopedViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for resources that belong to the requesting user's business.
    Subclasses set ``serializer_class``, ``filterset_fields`` (consumed by the
    global DjangoFilterBackend) and ``search_fields`` / ``ordering_fields``.
    Business scoping (custom logic) is applied manually in each
    ``get_queryset`` implementation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_user_business(self):
        business_id = self.request.headers.get('X-Business-Id') or self.request.query_params.get('business_id')
        if business_id:
            try:
                return Business.objects.get(id=business_id, owner=self.request.user)
            except (Business.DoesNotExist, ValueError):
                pass
        
        # Fallback to the user's first business
        first_biz = Business.objects.filter(owner=self.request.user).first()
        if not first_biz:
            raise ValidationError(
                {"detail": "You must create a business before adding records."}
            )
        return first_biz

    def perform_create(self, serializer):
        serializer.save(business=self.get_user_business())


class SalesRecordViewSet(BusinessScopedViewSet):
    serializer_class = SalesRecordSerializer
    filterset_fields = ['business', 'product', 'date']
    search_fields = ['product__name']
    ordering_fields = ['date', 'quantity', 'revenue']
    ordering = ['-date']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return SalesRecord.objects.none()
        return SalesRecord.objects.filter(business__owner=self.request.user)

    def perform_create(self, serializer):
        business = self.get_user_business()
        serializer.save(business=business)
        # A single record was added.
        RetrainingService.log_changes(business_id=business.id, added=1)
        RetrainingService(business_id=business.id).retrain_if_needed()

    def perform_update(self, serializer):
        business = self.get_user_business()
        serializer.save()
        # A single record was modified.
        RetrainingService.log_changes(business_id=business.id, modified=1)
        RetrainingService(business_id=business.id).retrain_if_needed()

    def perform_destroy(self, instance):
        business = instance.business
        instance.delete()
        # A single record was deleted.
        RetrainingService.log_changes(business_id=business.id, deleted=1)
        RetrainingService(business_id=business.id).retrain_if_needed()


class InventorySnapshotViewSet(BusinessScopedViewSet):
    serializer_class = InventorySnapshotSerializer
    filterset_fields = ['business', 'product', 'date']
    search_fields = ['product__name']
    ordering_fields = ['date', 'quantity_on_hand']
    ordering = ['-date']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return InventorySnapshot.objects.none()
        return InventorySnapshot.objects.filter(business__owner=self.request.user)


class CustomerReviewViewSet(BusinessScopedViewSet):
    serializer_class = CustomerReviewSerializer
    filterset_fields = ['business', 'product', 'source', 'review_date']
    search_fields = ['product__name', 'author_name', 'text']
    ordering_fields = ['review_date', 'rating']
    ordering = ['-review_date']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CustomerReview.objects.none()
        return CustomerReview.objects.filter(business__owner=self.request.user)


class ReviewSentimentViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSentimentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['sentiment']
    search_fields = ['review__product__name']
    ordering_fields = ['analyzed_at']
    ordering = ['-analyzed_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ReviewSentiment.objects.none()
        return ReviewSentiment.objects.filter(review__business__owner=self.request.user)


class ComplaintCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category']
    search_fields = ['review__product__name', 'category']
    ordering_fields = ['analyzed_at']
    ordering = ['-analyzed_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ComplaintCategory.objects.none()
        return ComplaintCategory.objects.filter(review__business__owner=self.request.user)


class PredictionViewSet(BusinessScopedViewSet):
    serializer_class = PredictionSerializer
    pagination_class = None
    filterset_fields = ['business', 'prediction_type', 'period_start', 'period_end']
    search_fields = ['model_version']
    ordering_fields = ['period_start', 'period_end', 'predicted_at']
    ordering = ['-predicted_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Prediction.objects.none()
        return Prediction.objects.filter(business=self.get_user_business())


class InsightViewSet(BusinessScopedViewSet):
    serializer_class = InsightSerializer
    filterset_fields = ['business', 'insight_type', 'severity']
    search_fields = ['title', 'description']
    ordering_fields = ['generated_at']
    ordering = ['-generated_at']
    pagination_class = None

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Insight.objects.none()
        
        business = self.get_user_business()
        queryset = Insight.objects.filter(business=business)
        
        return queryset

    def generate_default_insights(self, business):
        """Populate the Insight table with findings derived from real data.

        Uses ``InsightGenerationService`` so every insight reflects actual
        sales, competitor, trends and inventory data for the business. If the
        data does not support a given insight type, that insight is skipped
        (no fabricated/place-holder rows are created).
        """
        from analytics.services.insight_generation_service import InsightGenerationService

        service = InsightGenerationService()
        for payload in service.generate_insights(business):
            Insight.objects.create(**payload)
    @action(detail=False, methods=["post"])
    def refresh_insights(self, request):
        """Force regeneration of insights using real data."""
        business = self.get_user_business()
        
        try:
            # Delete old insights for this business
            Insight.objects.filter(business=business).delete()
            
            # Regenerate insights from real data
            self.generate_default_insights(business)
            
            return Response({
                "status": "success",
                "message": "Insights refreshed successfully",
                "business_id": business.id
            })
        except Exception as exc:
             return Response({
        "status": "error",
        "message": str(exc),
        "traceback": traceback.format_exc()
    }, status=500)

           


from rest_framework.views import APIView
from rest_framework.response import Response
from analytics.services.business_health_service import BusinessHealthService

class BusinessHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Resolve active business
        business_id = request.query_params.get('business_id')
        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=request.user)
            except (Business.DoesNotExist, ValueError):
                return Response(
                    {"detail": "Business not found or access denied."},
                    status=404
                )
        else:
            business = Business.objects.filter(owner=request.user).first()
            if not business:
                return Response(
                    {"detail": "You must create a business first."},
                    status=400
                )

        health_service = BusinessHealthService()
        try:
            health_data = health_service.calculate_health_for_business(business.id)
            return Response(health_data)
        except Exception as e:
            return Response(
                {"detail": f"Error calculating business health: {str(e)}"},
                status=500
            )
