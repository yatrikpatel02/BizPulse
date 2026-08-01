import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.abspath('d:/PYTHON-2_PROJECT/BizPulse/backend/apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BizPulse.settings.base')
django.setup()

from integrations.models import ImportBatch
from businesses.models import Business
print("Businesses:", Business.objects.all())
