from __future__ import annotations

import logging
import re
from typing import Any

from playwright.sync_api import sync_playwright

from integrations.services.providers.base_provider import BaseProvider

logger = logging.getLogger(__name__)

FLIPKART_SEARCH_URL = "https://www.flipkart.com/search"


class FlipkartPlaywrightProvider(BaseProvider):
    """Fetches competitor prices from Flipkart using Playwright.

    Uses Chromium in headless mode to search Flipkart for a product
    and extract pricing data. Handles navigation failures and CAPTCHAs
    gracefully by returning an empty list.
    """

    COMPETITOR_NAME = "Flipkart"
    MAX_RESULTS = 5

    def search(self, product_name: str) -> list[dict[str, Any]]:
        """Search Flipkart for a product and return normalized results.

        Args:
            product_name: The name of the product to search for.

        Returns:
            A list of dicts with keys ``competitor_name``, ``price``, and ``url``.
            Returns an empty list if the navigation fails, a CAPTCHA is detected,
            or no results are found.
        """
        if not product_name:
            print("[FLIPKART-PLAYWRIGHT] Empty product name, returning []")
            return []

        print(f"[FLIPKART-PLAYWRIGHT] Searching Flipkart for: {product_name}")
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    )
                )
                page = context.new_page()

                search_url = f"{FLIPKART_SEARCH_URL}?q={product_name}"
                print(f"[FLIPKART-PLAYWRIGHT] Navigating to: {search_url}")
                page.goto(search_url, wait_until="domcontentloaded", timeout=15000)

                # Check for CAPTCHA or blocking page
                if self._is_blocked(page):
                    print(f"[FLIPKART-PLAYWRIGHT] Blocked/CAPTCHA detected for '{product_name}'")
                    logger.warning("Flipkart blocked the request for %s", product_name)
                    browser.close()
                    return []

                results = self._extract_results(page)
                print(f"[FLIPKART-PLAYWRIGHT] Extracted {len(results)} results for '{product_name}'")
                browser.close()
                return results

        except Exception as exc:
            print(f"[FLIPKART-PLAYWRIGHT] Exception for '{product_name}': {exc}")
            logger.warning("Flipkart Playwright scraping failed for %s: %s", product_name, exc)
            return []

    def _is_blocked(self, page) -> bool:
        """Check if the page shows a CAPTCHA or blocking message."""
        body_text = page.locator("body").text_content() or ""
        blocked_indicators = [
            "captcha",
            "unusual traffic",
            "verify you are human",
            "access denied",
            "blocked",
        ]
        body_lower = body_text.lower()
        return any(indicator in body_lower for indicator in blocked_indicators)

    def _extract_results(self, page) -> list[dict[str, Any]]:
        """Extract product results from the Flipkart search page."""
        results: list[dict[str, Any]] = []
        seen_urls: set[str] = set()

        # Try multiple selectors for product containers
        containers = page.locator(
            "div._1AtVbE, div._13oc-S, div._1x1g9, div._2kHMtA"
        )

        container_count = containers.count()
        print(f"[FLIPKART-PLAYWRIGHT] Found {container_count} product containers")

        count = min(container_count, self.MAX_RESULTS)

        for i in range(count):
            container = containers.nth(i)

            # Extract title and URL
            link = container.locator("a[href*='/product/'], a.s1Q9rs").first
            if not link.is_visible():
                print(f"[FLIPKART-PLAYWRIGHT] Container {i}: link not visible, skipping")
                continue

            url = link.get_attribute("href") or ""
            if not url:
                print(f"[FLIPKART-PLAYWRIGHT] Container {i}: no URL, skipping")
                continue
            if not url.startswith("http"):
                url = f"https://www.flipkart.com{url}"

            if url in seen_urls:
                print(f"[FLIPKART-PLAYWRIGHT] Container {i}: duplicate URL, skipping")
                continue
            seen_urls.add(url)

            title = link.text_content() or ""
            if not title.strip():
                print(f"[FLIPKART-PLAYWRIGHT] Container {i}: empty title, skipping")
                continue

            # Extract price
            price_elem = container.locator("div._30jeq3, div._1_WHN1").first
            price_text = price_elem.text_content() or ""
            price = self._parse_price(price_text)
            if price is None:
                print(f"[FLIPKART-PLAYWRIGHT] Container {i}: could not parse price '{price_text}', skipping")
                continue

            print(f"[FLIPKART-PLAYWRIGHT] Container {i}: '{title}' - {price} - {url}")
            results.append(
                {
                    "competitor_name": self.COMPETITOR_NAME,
                    "price": price,
                    "url": url,
                }
            )

        return results

    @staticmethod
    def _parse_price(price_text: str) -> float | None:
        """Extract numeric price from a price string like '₹1,299' or 'Rs. 1,299.00'."""
        cleaned = re.sub(r"[₹Rs.\s]", "", price_text)
        cleaned = cleaned.replace(",", "")
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            logger.warning("Failed to parse price: %s", price_text)
            return None
