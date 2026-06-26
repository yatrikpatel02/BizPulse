from django.db import models


REPORT_TYPE_CHOICES = [
    ('executive', 'Executive Report'),
    ('sales', 'Sales Report'),
    ('inventory', 'Inventory Report'),
    ('customer', 'Customer Report'),
    ('market', 'Market Report'),
]


STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
]


class Report(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    generated_at = models.DateTimeField(auto_now_add=True)
    file_path = models.CharField(max_length=255, blank=True)
    parameters = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f'{self.business.name} - {self.report_type} - {self.generated_at}'

    class Meta:
        ordering = ['-generated_at']
