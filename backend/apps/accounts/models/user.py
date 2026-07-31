from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    PROVIDER_LOCAL = 'local'
    PROVIDER_GOOGLE = 'google'
    PROVIDER_CHOICES = [
        (PROVIDER_LOCAL, 'Local'),
        (PROVIDER_GOOGLE, 'Google')
    ]

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    email = models.EmailField('email address', unique=True)
    auth_provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default=PROVIDER_LOCAL,
    )
    social_uid = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)

    @property
    def business(self):
        """Return the user's first business, or None if they own none."""
        return self.businesses.first()

    def __str__(self):
        return self.email
