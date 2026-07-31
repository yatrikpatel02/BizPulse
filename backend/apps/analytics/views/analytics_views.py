from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

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
        try:
            return Business.objects.get(owner=self.request.user)
        except Business.DoesNotExist:
            raise ValidationError(
                {"detail": "You must create a business before adding records."}
            )

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
    filterset_fields = ['business', 'prediction_type', 'period_start', 'period_end']
    search_fields = ['model_version']
    ordering_fields = ['period_start', 'period_end', 'predicted_at']
    ordering = ['-predicted_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Prediction.objects.none()
        return Prediction.objects.filter(business__owner=self.request.user)


class InsightViewSet(BusinessScopedViewSet):
    serializer_class = InsightSerializer
    filterset_fields = ['business', 'insight_type', 'severity']
    search_fields = ['title', 'description']
    ordering_fields = ['generated_at']
    ordering = ['-generated_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Insight.objects.none()
        return Insight.objects.filter(business__owner=self.request.user)
