from django.db import models


class Prediction(models.Model):
    PREDICTION_TYPE_CHOICES = [
        ('sales_forecast', 'Sales Forecast'),
        ('product_risk', 'Product Risk'),
        ('business_health', 'Business Health Score'),
        ('demand_forecast', 'Demand Forecast'),
    ]
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='predictions')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='predictions', null=True, blank=True)
    import_batch = models.ForeignKey('integrations.ImportBatch', on_delete=models.CASCADE, related_name='predictions', null=True, blank=True)
    prediction_type = models.CharField(max_length=30, choices=PREDICTION_TYPE_CHOICES)
    predicted_at = models.DateTimeField(auto_now_add=True)
    period_start = models.DateField()
    period_end = models.DateField()
    value = models.FloatField()
    confidence = models.FloatField(null=True, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    model_version = models.CharField(max_length=50, blank=True)

    def __str__(self):
        product_name = self.product.name if self.product else 'N/A'
        return f'{self.business.name} - {product_name} - {self.prediction_type} - {self.predicted_at}'

    class Meta:
        ordering = ['-predicted_at']
