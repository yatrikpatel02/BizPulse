from django.contrib import admin
from .models import CompetitorPrice, GoogleTrendsData, ColumnMapping


@admin.register(CompetitorPrice)
class CompetitorPriceAdmin(admin.ModelAdmin):
    list_display = ('business', 'product', 'competitor_name', 'price', 'recorded_at')
    search_fields = ('business__name', 'product__name', 'competitor_name')
    list_filter = ('recorded_at', 'business')


@admin.register(GoogleTrendsData)
class GoogleTrendsDataAdmin(admin.ModelAdmin):
    list_display = ('business', 'keyword', 'region', 'date', 'interest_score', 'fetched_at')
    search_fields = ('business__name', 'keyword', 'region')
    list_filter = ('date', 'region')


@admin.register(ColumnMapping)
class ColumnMappingAdmin(admin.ModelAdmin):
    list_display = ('business', 'source_type', 'original_column', 'mapped_column', 'confidence', 'created_at')
    search_fields = ('business__name', 'original_column', 'mapped_column')
    list_filter = ('source_type', 'business')
