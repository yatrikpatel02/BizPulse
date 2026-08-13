import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BizPulse.settings.base')

app = Celery('BizPulse')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    from celery.schedules import crontab
    from integrations import tasks as integrations_tasks
    sender.add_periodic_task(
        crontab(hour=5, minute=30),
        integrations_tasks.refresh_market_intelligence.s(),
        name='refresh-market-intelligence-daily',
    )
    sender.add_periodic_task(
        crontab(hour=4, minute=30),
        integrations_tasks.collect_competitor_prices_daily.s(),
        name='collect-competitor-prices-daily',
    )
