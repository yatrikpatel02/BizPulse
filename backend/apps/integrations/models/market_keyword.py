from django.db import models


class MarketKeyword(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='market_keywords')
    keyword = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.business.name} - {self.keyword}'

    class Meta:
        ordering = ['-created_at']
        unique_together = ['business', 'keyword']
