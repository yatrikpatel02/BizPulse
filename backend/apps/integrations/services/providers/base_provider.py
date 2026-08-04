from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseProvider(ABC):
    """Abstract base class for competitor price providers.

    Each provider is responsible for collecting raw competitor pricing data
    from a single source. Business rules (deduplication, persistence,
    ownership checks) live in the service layer, not in the providers.
    """

    @abstractmethod
    def search(self, product_name: str) -> list[dict[str, Any]]:
        """Search the provider for a product and return normalized results.

        Args:
            product_name: The name of the product to search for.

        Returns:
            A list of dicts with keys ``competitor_name``, ``price``, and ``url``.
            Returns an empty list if the search fails or no results are found.
        """
        ...
