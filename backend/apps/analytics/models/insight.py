from django.db import models


class Insight(models.Model):
    INSIGHT_TYPE_CHOICES = [
        ('revenue_declining', 'Revenue Declining'),
        ('competitor_price_lower', 'Competitor Price Lower'),
        ('growing_demand', 'Growing Market Demand'),
        ('inventory_risk', 'Inventory Risk'),
    ]
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='insights')
    import_batch = models.ForeignKey('integrations.ImportBatch', on_delete=models.CASCADE, related_name='insights', null=True, blank=True)
    insight_type = models.CharField(max_length=30, choices=INSIGHT_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    generated_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-generated_at']
