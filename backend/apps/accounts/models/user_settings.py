from django.db import models
from django.conf import settings


class UserSettings(models.Model):
    """Stores per-user dashboard preferences for alerts and sync configuration."""

    FREQUENCY_CHOICES = [
        ('on_demand', 'On Demand'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    IMPORT_METHOD_CHOICES = [
        ('csv', 'CSV Upload'),
        ('serpapi', 'SerpAPI'),
        ('flipkart', 'Flipkart Scraper'),
        ('google_trends', 'Google Trends'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='settings',
    )

    # Thresholds & Alerts
    safety_stock = models.PositiveIntegerField(default=50)
    csat_threshold = models.PositiveIntegerField(default=80)
    star_rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.0)
    email_alerts = models.BooleanField(default=True)

    # Integrations & Sync
    auto_sync = models.BooleanField(default=True)
    sync_frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='daily',
    )
    import_method = models.CharField(
        max_length=20,
        choices=IMPORT_METHOD_CHOICES,
        default='csv',
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Settings'
        verbose_name_plural = 'User Settings'

    def __str__(self):
        return f"Settings for {self.user.email}"
