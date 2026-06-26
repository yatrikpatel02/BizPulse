from django.db import models


class ColumnMapping(models.Model):
    SOURCE_TYPE_CHOICES = [
        ('sales', 'Sales'),
        ('inventory', 'Inventory'),
        ('reviews', 'Reviews'),
    ]
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='column_mappings')
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES)
    original_column = models.CharField(max_length=100)
    mapped_column = models.CharField(max_length=100)
    confidence = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.business.name} - {self.source_type} - {self.original_column}'

    class Meta:
        unique_together = ['business', 'source_type', 'original_column']
        ordering = ['source_type', 'original_column']
