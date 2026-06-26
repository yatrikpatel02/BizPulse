from django.db import models


class SalesRecord(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='sales_records')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='sales_records')
    date = models.DateField()
    quantity = models.IntegerField()
    revenue = models.DecimalField(max_digits=12, decimal_places=2)
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.business.name} - {self.product.name} - {self.date}'

    class Meta:
        ordering = ['-date']
        unique_together = ['business', 'product', 'date']
