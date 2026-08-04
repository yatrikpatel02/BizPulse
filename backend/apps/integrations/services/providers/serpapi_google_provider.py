from __future__ import annotations

import logging
import re
from typing import Any

import requests

from integrations.services.providers.base_provider import BaseProvider

logger = logging.getLogger(__name__)


class SerpApiGoogleProvider(BaseProvider):
    """Google Shopping provider using SerpAPI."""

    ENDPOINT = "https://serpapi.com/search"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def search(self, product_name: str) -> list[dict[str, Any]]:
        params = {
            "engine": "google_shopping",
            "q": product_name,
            "google_domain": "google.co.in",
            "gl": "in",
            "hl": "en",
            "api_key": self.api_key,
        }

        try:
            response = requests.get(
                self.ENDPOINT,
                params=params,
                timeout=15,
            )

            print("=" * 80)
            print(response.url)
            print(response.status_code)
            print(response.text[:1000])
            print("=" * 80)

            response.raise_for_status()

            data = response.json()

        except requests.RequestException as exc:
            logger.warning(
                "SerpAPI Google Shopping request failed for %s: %s",
                product_name,
                exc,
            )
            return []

        shopping_results = data.get("shopping_results", [])

        results = []

        for item in shopping_results[:5]:

            price = self._extract_price(item)

            if price is None:
                continue

            url = (
                item.get("product_link")
                or item.get("link")
                or ""
            )

            if not url:
                continue

            results.append(
                {
                    "competitor_name": item.get(
                        "source",
                        "Google Shopping",
                    ),
                    "price": price,
                    "url": url,
                }
            )

        return results

    @staticmethod
    def _extract_price(item: dict[str, Any]) -> float | None:

        extracted = item.get("extracted_price")

        if extracted is not None:
            try:
                return float(extracted)
            except (ValueError, TypeError):
                pass

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