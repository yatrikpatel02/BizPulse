import datetime
import logging
import time
from typing import Dict, List

import pandas as pd
from django.utils import timezone
from pytrends.exceptions import ResponseError, TooManyRequestsError

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY_BASE = 2


class GoogleTrendsService:
    """Fetch and persist Google Trends interest-over-time data via PyTrends.

    This is the *data collection* layer only. It knows nothing about business
    rules, metrics or insights — those live in the analytics app so the rules
    can be reconfigured without touching the collection code.
    """

    DEFAULT_REGION = 'worldwide'
    DEFAULT_DAYS = 7

    def __init__(self, hl: str = 'en-US', tz: int = 0):
        self.hl = hl
        self.tz = tz
        self._client = None

    @property
    def pytrends(self):
        """Lazily import and build the PyTrends client so the module remains
        importable even when PyTrends is not installed."""
        if self._client is None:
            from pytrends.request import TrendReq
            self._client = TrendReq(hl=self.hl, tz=self.tz)
        return self._client

    def collect_trends(
        self,
        business,
        keywords: List[str],
        region: str = DEFAULT_REGION,
        days: int = DEFAULT_DAYS,
    ) -> Dict[str, List[dict]]:
        """Fetch interest-over-time from Google Trends and persist it.

        All keywords are sent in a single payload so the returned interest
        scores are comparable (PyTrends normalises within a payload).

        Returns a mapping of ``keyword -> [{'date': date, 'interest': float}]``.
        """
        if not keywords:
            return {}

        geo = self._region_to_geo(region)
        timeframe = self._build_timeframe(days)

        series: Dict[str, List[dict]] = {}
        for chunk in self._chunk(keywords, size=5):
            data = self._fetch_payload(chunk, timeframe, geo)
            for keyword in chunk:
                series[keyword] = self._parse_series(data, keyword)
            time.sleep(1)

        self._persist(business, region, series)
        return series

    def get_time_series(
        self,
        business,
        keywords: List[str],
        region: str = DEFAULT_REGION,
        days: int = DEFAULT_DAYS,
    ) -> Dict[str, List[dict]]:
        """Read persisted interest data for the keywords from the database.

        Returns a mapping of ``keyword -> [{'date': date, 'interest': float}]``
        sorted by date ascending. Keywords with no data return an empty list.
        """
        from integrations.models import GoogleTrendsData

        if not keywords:
            return {}

        cutoff = timezone.now().date() - datetime.timedelta(days=days)
        rows = GoogleTrendsData.objects.filter(
            business=business,
            region=region,
        ).filter(date__gte=cutoff).values('keyword', 'date', 'interest_score')

        grouped: Dict[str, List[dict]] = {kw: [] for kw in keywords}
        for row in rows:
            grouped.setdefault(row['keyword'], []).append({
                'date': row['date'],
                'interest': row['interest_score'],
            })

        for points in grouped.values():
            points.sort(key=lambda p: p['date'])
        return grouped

    def _fetch_payload(self, keywords: List[str], timeframe: str, geo: str):
        """Builds the PyTrends payload and returns the interest-over-time frame.

        Retries on rate limiting with exponential backoff.
        Returns an empty DataFrame on persistent failures.
        """
        self.pytrends.build_payload(keywords, timeframe=timeframe, geo=geo, cat=0, gprop='')
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return self.pytrends.interest_over_time()
            except TooManyRequestsError:
                if attempt >= MAX_RETRIES:
                    logger.warning(
                        "Google Trends rate limited after %d retries for keywords: %s",
                        attempt,
                        keywords,
                    )
                    return pd.DataFrame()
                delay = RETRY_DELAY_BASE ** attempt
                logger.warning(
                    "Google Trends rate limited for keywords %s, retrying in %ds (attempt %d/%d)",
                    keywords,
                    delay,
                    attempt,
                    MAX_RETRIES,
                )
                time.sleep(delay)
            except ResponseError as exc:
                logger.warning("Google Trends request failed for keywords %s: %s", keywords, exc)
                return pd.DataFrame()
        return pd.DataFrame()

    def _persist(self, business, region: str, series: Dict[str, List[dict]]) -> None:
        from integrations.models import GoogleTrendsData

        if not series:
            return

        records = []
        now = timezone.now()
        for keyword, points in series.items():
            for point in points:
                records.append(GoogleTrendsData(
                    business=business,
                    keyword=keyword,
                    region=region,
                    date=point['date'],
                    interest_score=int(round(point['interest'])),
                    fetched_at=now,
                ))

        if records:
            GoogleTrendsData.objects.bulk_create(
                records,
                update_conflicts=True,
                update_fields=['interest_score', 'fetched_at'],
                unique_fields=['business', 'keyword', 'region', 'date'],
            )

    @staticmethod
    def _parse_series(data, keyword: str) -> List[dict]:
        if data is None or keyword not in data.columns:
            return []
        points: List[dict] = []
        for date, value in data[keyword].items():
            timestamp = date.to_pydatetime() if hasattr(date, 'to_pydatetime') else date
            day = timestamp.date() if hasattr(timestamp, 'date') else timestamp
            interest = value
            if hasattr(interest, 'item'):
                interest = interest.item()
            if interest is None or (isinstance(interest, float) and interest != interest):
                continue
            points.append({'date': day, 'interest': float(interest)})
        points.sort(key=lambda p: p['date'])
        return points

    @staticmethod
    def _region_to_geo(region: str) -> str:
        return '' if region == '' or region.lower() == 'worldwide' else region

    @staticmethod
    def _build_timeframe(days: int) -> str:
        today = timezone.now().date()
        start = today - datetime.timedelta(days=days)
        return f'{start.strftime("%Y-%m-%d")} {today.strftime("%Y-%m-%d")}'

    @staticmethod
    def _chunk(items: List[str], size: int = 5):
        for i in range(0, len(items), size):
            yield items[i:i + size]
