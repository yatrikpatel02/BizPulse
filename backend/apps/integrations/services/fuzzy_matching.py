import difflib
import re
from integrations.models import ColumnMapping


class ColumnMappingService:
    TARGET_COLUMNS = {
        'sales': ['date', 'product_name', 'category', 'quantity', 'revenue', 'cost'],
        'inventory': ['date', 'product_name', 'category', 'quantity_on_hand', 'reorder_point', 'unit_cost', 'location', 'supplier'],
        'reviews': ['date', 'product_name', 'rating', 'text', 'author_name', 'source', 'external_id']
    }

    ALIASES = {
        'sales': {
            'date': ['date', 'sale date', 'transaction date', 'timestamp', 'sold_at', 'sales date'],
            'product_name': ['product', 'product_name', 'item', 'item_name', 'sku', 'product_sku', 'product_id', 'item_code', 'item sku', 'item_sku'],
            'category': ['category', 'product_category', 'type', 'product_type', 'group', 'department'],
            'quantity': ['quantity', 'qty', 'count', 'units', 'quantity_sold', 'qty_sold', 'number_of_items', 'volume'],
            'revenue': ['revenue', 'amount', 'total_amount', 'sales', 'price', 'total_price', 'value', 'turnover', 'gross_amount'],
            'cost': ['cost', 'unit_cost', 'cost_price', 'cogs', 'expenses', 'cost of goods sold']
        },
        'inventory': {
            'date': ['date', 'snapshot_date', 'timestamp', 'recorded_at', 'inventory date'],
            'product_name': ['product', 'product_name', 'item', 'item_name', 'sku', 'product_sku', 'product_id', 'item_code', 'item sku', 'item_sku'],
            'category': ['category', 'product_category', 'type', 'product_type', 'group', 'department'],
            'quantity_on_hand': ['quantity_on_hand', 'qty_on_hand', 'stock', 'stock_level', 'quantity', 'qty', 'on_hand', 'stock_quantity', 'available_qty', 'closing_stock'],
            'reorder_point': ['reorder_point', 'reorder', 'reorder_level', 'minimum_stock', 'min_stock', 'alert_threshold', 'safety_stock'],
            'unit_cost': ['unit_cost', 'cost', 'purchase_price', 'cost_price', 'buying_price', 'unit_price', 'avg_cost'],
            'location': ['location', 'warehouse', 'warehouse_location', 'bin', 'shelf', 'store', 'godown'],
            'supplier': ['supplier', 'supplier_name', 'vendor', 'vendor_name', 'manufacturer'],
        },
        'reviews': {
            'date': ['date', 'review_date', 'timestamp', 'created_at', 'review date', 'posted_date', 'post_date'],
            'product_name': ['product', 'product_name', 'item', 'item_name', 'sku', 'product_sku', 'item sku', 'item_sku'],
            'rating': ['rating', 'score', 'stars', 'review_rating', 'points', 'star_rating', 'review_score'],
            'text': ['text', 'review', 'comment', 'review_text', 'body', 'content', 'message', 'feedback', 'description', 'remarks'],
            'author_name': ['author_name', 'author', 'reviewer', 'reviewer_name', 'customer_name', 'name', 'reviewer name', 'user_name', 'username'],
            'source': ['source', 'platform', 'channel', 'source_platform', 'origin', 'review_source'],
            'external_id': ['external_id', 'ext_id', 'review_id', 'id', 'external_review_id', 'ref_id'],
        }
    }

    @classmethod
    def normalize_string(cls, s: str) -> str:
        """Helper to lowercase, strip, and clean strings to make them comparable."""
        s = s.lower().strip()
        s = re.sub(r'[^a-z0-9]', ' ', s)
        return ' '.join(s.split())

    @classmethod
    def get_suggestions(cls, business, source_type: str, headers: list) -> list:
        """
        Generates suggested mappings for a list of header columns.
        Uses existing database mappings first, then falls back to fuzzy matching.
        """
        if source_type not in cls.TARGET_COLUMNS:
            return []

        suggestions = []
        targets = cls.TARGET_COLUMNS[source_type]
        aliases = cls.ALIASES[source_type]

        # Optimize: Fetch all existing mappings for the business + source_type
        existing_mappings = {
            m.original_column: m.mapped_column
            for m in ColumnMapping.objects.filter(business=business, source_type=source_type)
        }

        for col in headers:
            # 1. Prioritize saved database mappings
            if col in existing_mappings:
                suggestions.append({
                    'original_column': col,
                    'mapped_column': existing_mappings[col],
                    'confidence': 1.0
                })
                continue

            col_normalized = cls.normalize_string(col)
            best_target = None
            best_score = 0.0

            for target in targets:
                target_normalized = cls.normalize_string(target)

                # Exact direct match
                if col_normalized == target_normalized:
                    best_target = target
                    best_score = 1.0
                    break

                # Exact alias match
                alias_matched = False
                for alias in aliases.get(target, []):
                    alias_normalized = cls.normalize_string(alias)
                    if col_normalized == alias_normalized:
                        best_target = target
                        best_score = 1.0
                        alias_matched = True
                        break

                if alias_matched:
                    break

                # Fuzzy matching direct target name
                score = difflib.SequenceMatcher(None, col_normalized, target_normalized).ratio()

                # Fuzzy matching aliases (with a minor penalty)
                for alias in aliases.get(target, []):
                    alias_normalized = cls.normalize_string(alias)
                    alias_score = difflib.SequenceMatcher(None, col_normalized, alias_normalized).ratio()
                    if (alias_score * 0.95) > score:
                        score = alias_score * 0.95

                if score > best_score:
                    best_score = score
                    best_target = target

            # Only suggest if match quality exceeds a minimum threshold (0.4)
            threshold = 0.4
            if best_score >= threshold:
                suggestions.append({
                    'original_column': col,
                    'mapped_column': best_target,
                    'confidence': round(best_score, 2)
                })
            else:
                suggestions.append({
                    'original_column': col,
                    'mapped_column': None,
                    'confidence': 0.0
                })

        return suggestions
