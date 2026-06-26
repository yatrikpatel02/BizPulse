from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('business', 'report_type', 'generated_at', 'status')
    search_fields = ('business__name', 'report_type')
    list_filter = ('report_type', 'status', 'generated_at')
