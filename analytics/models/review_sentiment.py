from django.db import models


class ReviewSentiment(models.Model):
    review = models.OneToOneField('analytics.CustomerReview', on_delete=models.CASCADE, related_name='sentiment')
    sentiment = models.CharField(max_length=20)
    confidence_score = models.FloatField(null=True, blank=True)
    analyzed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.review} - {self.sentiment}'

    class Meta:
        ordering = ['-analyzed_at']
