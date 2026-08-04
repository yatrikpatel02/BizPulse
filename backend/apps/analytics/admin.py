from django.contrib import admin
from .models import SalesRecord, InventorySnapshot, CustomerReview, ReviewSentiment, ComplaintCategory, Prediction, Insight


@admin.register(SalesRecord)
class SalesRecordAdmin(admin.ModelAdmin):
    list_display = ('business', 'product', 'date', 'quantity', 'revenue')
    search_fields = ('business__name', 'product__name')
    list_filter = ('date', 'business')


@admin.register(InventorySnapshot)
class InventorySnapshotAdmin(admin.ModelAdmin):
    list_display = ('business', 'product', 'date', 'quantity_on_hand')
    search_fields = ('business__name', 'product__name')
    list_filter = ('date', 'business')


@admin.register(CustomerReview)
class CustomerReviewAdmin(admin.ModelAdmin):
    list_display = ('business', 'product', 'source', 'rating', 'review_date')
    search_fields = ('business__name', 'product__name', 'source', 'text')
    list_filter = ('source', 'rating', 'review_date')


@admin.register(ReviewSentiment)
class ReviewSentimentAdmin(admin.ModelAdmin):
    list_display = ('review', 'sentiment', 'confidence_score', 'analyzed_at')
    search_fields = ('review__text', 'sentiment')


@admin.register(ComplaintCategory)
class ComplaintCategoryAdmin(admin.ModelAdmin):
    list_display = ('review', 'category', 'analyzed_at')
    search_fields = ('review__text', 'category')


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ('business', 'product', 'prediction_type', 'predicted_at', 'period_start', 'period_end', 'model_name', 'model_version', 'confidence')
    search_fields = ('business__name', 'product__name', 'prediction_type', 'model_name')
    list_filter = ('prediction_type', 'model_name', 'predicted_at')


@admin.register(Insight)
class InsightAdmin(admin.ModelAdmin):
    list_display = ('business', 'insight_type', 'title', 'severity', 'generated_at', 'is_read')
    search_fields = ('business__name', 'title', 'insight_type')
    list_filter = ('insight_type', 'severity', 'is_read', 'generated_at')
