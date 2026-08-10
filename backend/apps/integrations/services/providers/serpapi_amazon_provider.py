from __future__ import annotations

import logging
import re
from typing import Any

import requests

from integrations.services.providers.base_provider import BaseProvider

logger = logging.getLogger(__name__)


class SerpApiAmazonProvider(BaseProvider):
    """Fetch competitor prices from Amazon using SerpAPI."""

    ENDPOINT = "https://serpapi.com/search"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def search(self, product_name: str) -> list[dict[str, Any]]:
        params = {
            "engine": "amazon",
            "amazon_domain": "amazon.in",
            "k": product_name,
            "api_key": self.api_key,
        }

        try:
            response = requests.get(
                self.ENDPOINT,
                params=params,
                timeout=15,
            )

            response.raise_for_status()

            data = response.json()

        except requests.RequestException as exc:
            logger.warning(
                "SerpAPI Amazon request failed for %s: %s",
                product_name,
                exc,
            )
            return []

        organic_results = data.get("organic_results", [])

        results = []

        for item in organic_results[:5]:

            url = item.get("link")

            if not url:
                continue

            price = self._extract_price(item)

            if price is None:
                continue

            results.append(
                {
                    "competitor_name": "Amazon",
                    "price": price,
                    "url": url,
                }
            )

        return results

    @staticmethod
    def _extract_price(item: dict[str, Any]) -> float | None:

        # Newer API responses
        if item.get("extracted_price") is not None:
            try:
                return float(item["extracted_price"])
            except Exception:
                pass

        # Older API responses
        price = item.get("price")

        if price is None:
            return None

        if isinstance(price, (int, float)):
            return float(price)

        cleaned = re.sub(r"[^\d.]", "", str(price))

        if not cleaned:
            return None

        try:
            return float(cleaned)
        except ValueError:
            return None