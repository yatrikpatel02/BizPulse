from django.db import models


class CustomerReview(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='customer_reviews')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='customer_reviews', null=True, blank=True)
    source = models.CharField(max_length=50)
    external_id = models.CharField(max_length=100, blank=True)
    review_date = models.DateField()
    rating = models.IntegerField(null=True, blank=True)
    text = models.TextField(blank=True)
    author_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.business.name} - {self.source} - {self.review_date}'

    class Meta:
        ordering = ['-review_date']
