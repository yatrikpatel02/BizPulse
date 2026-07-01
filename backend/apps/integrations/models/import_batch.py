from django.db import models


class ImportBatch(models.Model):
    SOURCE_TYPE_CHOICES = [
        ('sales', 'Sales'),
        ('inventory', 'Inventory'),
        ('reviews', 'Reviews'),
    ]
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE)
    dataset_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES)
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.business.name} - {self.dataset_type} - {self.original_filename}'

    class Meta:
        ordering = ['-uploaded_at']
