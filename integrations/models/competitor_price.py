from django.db import models


class CompetitorPrice(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='competitor_prices')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='competitor_prices')
    competitor_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    recorded_at = models.DateTimeField(auto_now_add=True)
    url = models.URLField(blank=True)

    def __str__(self):
        return f'{self.business.name} - {self.product.name} - {self.competitor_name}'

    class Meta:
        ordering = ['-recorded_at']
