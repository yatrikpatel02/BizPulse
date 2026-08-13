from django.db import models


class SalesRecordChangeLog(models.Model):
    """
    Ledger of SalesRecord dataset changes (additions, modifications,
    deletions). These entries represent actual changes to the underlying
    sales data and drive the automatic retraining decision.

    Entries are consumed (deleted) after a successful training run so that
    the accumulated counts always represent changes since the last training.
    """
    CHANGE_TYPE_CHOICES = [
        ('added', 'Added'),
        ('modified', 'Modified'),
        ('deleted', 'Deleted'),
    ]

    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='sales_record_changes'
    )
    change_type = models.CharField(max_length=10, choices=CHANGE_TYPE_CHOICES)
    count = models.PositiveIntegerField(default=0)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.business.name} - {self.change_type} x{self.count}'