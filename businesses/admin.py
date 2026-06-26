from django.contrib import admin
from .models import Business


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'industry', 'created_at')
    search_fields = ('name', 'owner__username', 'industry')
    list_filter = ('industry',)
