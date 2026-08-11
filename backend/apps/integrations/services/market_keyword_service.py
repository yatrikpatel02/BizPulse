from typing import List

from integrations.models import MarketKeyword
from products.models import Product


def get_market_keywords(business) -> List[str]:
    """Return a deduplicated list of market-analysis keywords for ``business``.

    Combines:
        * Active product names from the ``Product`` table.
        * Active opportunity keywords from the ``MarketKeyword`` table.

    The result is case-insensitively deduplicated. Keyword casing from the
    opportunity keyword table is preserved; product names are used as-is.
    """
    product_names = list(
        Product.objects.filter(business=business, is_active=True)
        .values_list('name', flat=True)
        .order_by('name')
    )

    opportunity_keywords = list(
        MarketKeyword.objects.filter(business=business, is_active=True)
        .values_list('keyword', flat=True)
        .order_by('keyword')
    )

    seen = set()
    unified = []
    for keyword in product_names + opportunity_keywords:
        lowered = keyword.casefold()
        if lowered not in seen:
            seen.add(lowered)
            unified.append(keyword)

    return unified
