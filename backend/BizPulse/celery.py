import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BizPulse.settings.base')

app = Celery('BizPulse')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    from celery.schedules import crontab
    sender.add_periodic_task(
        crontab(hour=5, minute=30),
        integrations.tasks.refresh_market_intelligence.s(),
        name='refresh-market-intelligence-daily',
    )
