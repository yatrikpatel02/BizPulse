import logging

from celery import shared_task
from django.db import transaction

from businesses.models import Business
from integrations.services.market_keyword_service import get_market_keywords
from integrations.services.google_trends_service import GoogleTrendsService
from analytics.services.trend_insight_engine import TrendInsightEngine
from analytics.models import Insight

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_market_intelligence(self, business_id):
    """Collect Google Trends data and generate market insights for a business."""
    try:
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        logger.error("Business %s not found for market intelligence generation.", business_id)
        return {"status": "error", "detail": "Business not found."}

    keywords = get_market_keywords(business)
    if not keywords:
        logger.info("No market keywords found for business %s.", business_id)
        return {"status": "skipped", "detail": "No keywords to analyze."}

    service = GoogleTrendsService()
    engine = TrendInsightEngine()

    try:
        series = service.collect_trends(business, keywords)
    except Exception as exc:
        logger.exception("Google Trends collection failed for business %s.", business_id)
        raise self.retry(exc=exc)

    try:
        insights = engine.analyze(
            business=business,
            keywords=list(series.keys()),
            region=GoogleTrendsService.DEFAULT_REGION,
            days=GoogleTrendsService.DEFAULT_DAYS,
            refresh=False,
        )
    except Exception as exc:
        logger.exception("Market insight analysis failed for business %s.", business_id)
        raise self.retry(exc=exc)

    persisted = 0
    with transaction.atomic():
        Insight.objects.filter(business=business, insight_type__startswith='market_intelligence').delete()
        for insight in insights:
            market = insight.get('market_intelligence')
            if not market:
                continue
            title = f"{market['title']}: {insight['keyword']}"
            change = insight.get('percentage_change', 0)
            severity = 'high' if abs(change) > 20 else 'medium' if abs(change) > 5 else 'low'
            description = market['description']
            if market.get('recommended_actions'):
                description += '\n\nRecommendation: ' + ' '.join(market['recommended_actions'])
            product = _get_product_for_keyword(business, insight['keyword'])
            source_type = 'existing_product' if product else 'opportunity_keyword'
            insight_type = (
                'market_intelligence_existing_product'
                if source_type == 'existing_product'
                else 'market_intelligence_opportunity'
            )
            Insight.objects.create(
                business=business,
                insight_type=insight_type,
                title=title,
                description=description,
                severity=severity,
            )
            persisted += 1

    logger.info("Persisted %s market intelligence insights for business %s.", persisted, business_id)
    return {"status": "completed", "business_id": business_id, "persisted": persisted}


@shared_task
def refresh_market_intelligence():
    """Queue market intelligence generation for all active businesses."""
    active_businesses = Business.objects.filter(owner__is_active=True)
    count = 0
    for business in active_businesses:
        generate_market_intelligence.delay(business.id)
        count += 1
    logger.info("Queued market intelligence generation for %s businesses.", count)
    return {"status": "queued", "businesses": count}


def _get_product_for_keyword(business, keyword):
    """Return the Product matching ``keyword`` for ``business``, or None."""
    from products.models import Product
    return Product.objects.filter(business=business, name__iexact=keyword).first()
