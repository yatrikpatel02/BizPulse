from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

COOKIE_NAME = 'refresh_token'
COOKIE_MAX_AGE = 7 * 24 * 60 * 60


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def set_refresh_cookie(response, refresh_token):
    is_secure = getattr(settings, 'JWT_COOKIE_SECURE', False)
    response.set_cookie(
        key=COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite='None' if is_secure else 'Lax',
        max_age=COOKIE_MAX_AGE,
    )


def clear_refresh_cookie(response):
    response.delete_cookie(COOKIE_NAME)
