from pathlib import Path
import os
import sys
from datetime import timedelta
from dotenv import load_dotenv
from celery.schedules import crontab

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'apps'))

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key-change-in-production')

DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') if os.getenv('ALLOWED_HOSTS') else []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'accounts',
    'businesses',
    'products',
    'analytics',
    'integrations',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'BizPulse.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'BizPulse.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'bizpulse'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', '1234'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'accounts.validators.complexity.ComplexityPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = os.getenv('TIME_ZONE', 'UTC')

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = Path(BASE_DIR) / 'static'

MEDIA_URL = 'media/'
MEDIA_ROOT = Path(BASE_DIR) / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

TEST_RUNNER = 'BizPulse.test_runner.AppsOnPathTestRunner'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes = int(os.getenv('JWT_ACCESS_MINUTES','30'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_DAYS', '7'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Social authentication (OAuth) configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')

# Set to True in production (HTTPS) so refresh cookies are only sent over TLS.
JWT_COOKIE_SECURE = os.getenv('JWT_COOKIE_SECURE', 'False').lower() == 'true'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-business-id',
]

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = os.getenv('TIME_ZONE', 'UTC')
CELERY_BEAT_SCHEDULE = {
    'refresh-market-intelligence-daily': {
        'task': 'integrations.tasks.refresh_market_intelligence',
        'schedule': crontab(hour=5, minute=30),
    },
    'collect-competitor-prices-daily': {
        'task': 'integrations.tasks.collect_competitor_prices_daily',
        'schedule': crontab(hour=4, minute=30),
    },
}

# ---------------------------------------------------------------------------
# Automatic ML Retraining thresholds
# ---------------------------------------------------------------------------
# Retraining is triggered by meaningful changes to the underlying SalesRecord
# dataset (additions + modifications + deletions) — NOT by time.
#
# ML_RETRAIN_CHANGE_THRESHOLD_PERCENT: minimum percent change of the dataset
#   (changed_records / previously_trained_record_count * 100) required.
# ML_RETRAIN_MIN_CHANGED_RECORDS: minimum absolute number of changed records
#   required. Both conditions must be met to retrain.
# ML_RETRAIN_MIN_TRAINING_RECORDS: the existing ML pipeline's minimum
#   training-data requirement. If the current dataset is below this, training
#   is skipped entirely (small dataset exception).
ML_RETRAIN_CHANGE_THRESHOLD_PERCENT = float(os.getenv('ML_RETRAIN_CHANGE_THRESHOLD_PERCENT', '10'))
ML_RETRAIN_MIN_CHANGED_RECORDS = int(os.getenv('ML_RETRAIN_MIN_CHANGED_RECORDS', '100'))
ML_RETRAIN_MIN_TRAINING_RECORDS = int(os.getenv('ML_RETRAIN_MIN_TRAINING_RECORDS', '5'))
