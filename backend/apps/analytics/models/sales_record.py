from django.db import models


class SalesRecord(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='sales_records')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='sales_records')
    date = models.DateField()
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, editable=False)
    revenue = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.business.name} - {self.product.name} - {self.date}'

    class Meta:
        ordering = ['-date']
        unique_together = ['business', 'product', 'date']
