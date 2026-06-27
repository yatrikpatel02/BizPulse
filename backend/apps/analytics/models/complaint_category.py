from django.db import models


class ComplaintCategory(models.Model):
    review = models.ForeignKey('analytics.CustomerReview', on_delete=models.CASCADE, related_name='complaint_categories')
    category = models.CharField(max_length=100)
    keywords = models.JSONField(default=list, blank=True)
    analyzed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.review} - {self.category}'

    class Meta:
        ordering = ['-analyzed_at']
