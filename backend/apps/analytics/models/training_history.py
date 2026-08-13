from django.db import models


class TrainingHistory(models.Model):
    """
    Tracks the state of the training dataset at the time a model was trained
    for a given business. This is used to detect meaningful dataset changes
    (additions, deletions, modifications) that should trigger automatic
    retraining.
    """
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='training_history'
    )
    trained_record_count = models.IntegerField(
        help_text="Number of SalesRecords used for the last training run."
    )
    trained_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-trained_at']

    def __str__(self):
        return f'{self.business.name} - {self.trained_record_count} records - {self.trained_at}'