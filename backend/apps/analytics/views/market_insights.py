from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError

from businesses.models.business import Business
from analytics.services.trend_insight_engine import TrendInsightEngine
from analytics.models import Insight
from integrations.services.market_keyword_service import get_market_keywords
from integrations.models import MarketKeyword
from integrations.tasks import generate_market_intelligence as generate_market_intelligence_task
from integrations.services.google_trends_service import GoogleTrendsService
from products.models import Product


class MarketInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        business_id = request.query_params.get('business_id')
        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=user)
            except (Business.DoesNotExist, ValueError):
                return Response(
                    {"detail": "Business not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            business = Business.objects.filter(owner=user).first()
            if not business:
                return Response(
                    {"detail": "You must create a business before viewing market insights."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        keywords = request.query_params.get('keywords', '')
        keyword_list = TrendInsightEngine._parse_keywords(keywords)
        if not keyword_list:
            keyword_list = get_market_keywords(business)
        if not keyword_list:
            return Response(
                {"detail": "No keywords available. Add products or opportunity keywords first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        region = request.query_params.get('region', 'worldwide')
        try:
            days = int(request.query_params.get('days', 90))
        except ValueError:
            return Response(
                {"detail": "The 'days' parameter must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        refresh = request.query_params.get('refresh', '').lower() in ('1', 'true', 'yes')

        engine = TrendInsightEngine()
        try:
            insights = engine.analyze(
                business=business,
                keywords=keyword_list,
                region=region,
                days=days,
                refresh=refresh,
            )
            self._persist_market_intelligence(business, insights)
        except ValidationError:
            raise
        except Exception as exc:
            return Response(
                {"detail": f"Failed to generate trend insights: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            "business_id": business.id,
            "business_name": business.name,
            "region": region,
            "keywords": keyword_list,
            "insights": insights,
        }, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """Manually trigger market intelligence analysis for the current business."""
        user = request.user
        business_id = request.query_params.get('business_id')
        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=user)
            except (Business.DoesNotExist, ValueError):
                return Response(
                    {"detail": "Business not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            business = Business.objects.filter(owner=user).first()
            if not business:
                return Response(
                    {"detail": "You must create a business before analyzing market intelligence."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        keywords = get_market_keywords(business)
        if not keywords:
            return Response(
                {"detail": "No keywords available. Add products or opportunity keywords first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        steps = []
        try:
            # Step 1: Collect Google Trends data for all unified keywords
            trends_service = GoogleTrendsService()
            series = trends_service.collect_trends(business, keywords)
            steps.append({
                "step": "collect_google_trends",
                "status": "completed",
                "keywords_collected": list(series.keys()),
                "records_per_keyword": {kw: len(points) for kw, points in series.items()},
            })
        except Exception as exc:
            steps.append({
                "step": "collect_google_trends",
                "status": "failed",
                "error": str(exc),
            })

        # Step 2: Refresh all insights (revenue, competitor, inventory, market demand)
        try:
            from analytics.services.insight_generation_service import InsightGenerationService
            insight_service = InsightGenerationService()
            generated = insight_service.generate_insights(business)
            Insight.objects.filter(business=business).delete()
            for payload in generated:
                Insight.objects.create(**payload)
            steps.append({
                "step": "refresh_insights",
                "status": "completed",
                "insights_created": len(generated),
            })
        except Exception as exc:
            steps.append({
                "step": "refresh_insights",
                "status": "failed",
                "error": str(exc),
            })

        # Step 3: Run market insights analysis
        market_insights = []
        try:
            engine = TrendInsightEngine()
            market_insights = engine.analyze(
                business=business,
                keywords=keywords,
                region=GoogleTrendsService.DEFAULT_REGION,
                days=GoogleTrendsService.DEFAULT_DAYS,
                refresh=False,
            )
            self._persist_market_intelligence(business, market_insights)
            steps.append({
                "step": "market_insights_analysis",
                "status": "completed",
                "insights_generated": len(market_insights),
            })
        except Exception as exc:
            steps.append({
                "step": "market_insights_analysis",
                "status": "failed",
                "error": str(exc),
            })

        return Response({
            "status": "completed",
            "detail": "Market intelligence analysis finished.",
            "business_id": business.id,
            "steps": steps,
            "insights": market_insights,
        }, status=status.HTTP_200_OK)

    @staticmethod
    def _persist_market_intelligence(business, insights):
        """Store one current market-intelligence card per keyword."""
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

            source_type = 'existing_product' if Product.objects.filter(
                business=business, name__iexact=insight['keyword']
            ).exists() else 'opportunity_keyword'
            insight_type = (
                'market_intel_existing'
                if source_type == 'existing_product'
                else 'market_intel_opportunity'
            )

            row, created = Insight.objects.get_or_create(
                business=business,
                insight_type=insight_type,
                title=title,
                defaults={'description': description, 'severity': severity},
            )
            if not created and (row.description != description or row.severity != severity):
                row.description = description
                row.severity = severity
                row.save(update_fields=['description', 'severity'])
            insight['insight_id'] = row.id
