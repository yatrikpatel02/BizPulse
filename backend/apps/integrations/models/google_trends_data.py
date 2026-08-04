from django.db import models
from django.utils import timezone


class GoogleTrendsData(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='google_trends_data')
    keyword = models.CharField(max_length=100)
    region = models.CharField(max_length=100, default='worldwide')
    date = models.DateField()
    interest_score = models.IntegerField()
    fetched_at = models.DateTimeField(default=timezone.now, db_index=True)

    def __str__(self):
        return f'{self.business.name} - {self.keyword} - {self.date}'

    class Meta:
        ordering = ['-date']
        unique_together = ['business', 'keyword', 'region', 'date']
