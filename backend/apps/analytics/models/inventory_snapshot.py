from django.db import models


class InventorySnapshot(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='inventory_snapshots')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='inventory_snapshots')
    date = models.DateField()
    quantity_on_hand = models.IntegerField()
    reorder_point = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    import_batch = models.ForeignKey('integrations.ImportBatch', on_delete=models.CASCADE, related_name='inventory_snapshots', null=True, blank=True)

    def __str__(self):
        return f'{self.business.name} - {self.product.name} - {self.date}'

    class Meta:
        ordering = ['-date']
        unique_together = ['business', 'product', 'date']
