import re
from django.db import transaction
from analytics.models import CustomerReview, ReviewSentiment, ComplaintCategory


class NLPService:
    POSITIVE_WORDS = {
        'great', 'excellent', 'good', 'love', 'happy', 'perfect', 'best', 'satisfied',
        'amazing', 'friendly', 'helpful', 'awesome', 'nice', 'pleasant', 'glad',
        'fantastic', 'superb', 'wonderful', 'highly', 'recommend', 'impressed', 'positive'
    }

    NEGATIVE_WORDS = {
        'bad', 'poor', 'worst', 'disappointed', 'terrible', 'broke', 'broken', 'expensive',
        'slow', 'hate', 'rude', 'defect', 'defective', 'issue', 'complaint', 'delay',
        'delayed', 'fail', 'failed', 'useless', 'waste', 'frustrated', 'unhappy',
        'annoyed', 'horrible', 'negative'
    }

    COMPLAINT_CATEGORIES = {
        'Product Quality': [
            'defect', 'broken', 'broke', 'damaged', 'cheap', 'ripped', 'tore', 'low quality',
            'poor quality', 'faulty', 'bad quality', 'durability', 'malfunction', 'flawed'
        ],
        'Customer Service': [
            'support', 'staff', 'service', 'rude', 'agent', 'help', 'manager',
            'unprofessional', 'attitude', 'email', 'phone'
        ],
        'Shipping & Delivery': [
            'shipping', 'delivery', 'package', 'late', 'arrive', 'post office',
            'shipped', 'transit', 'delayed', 'tracking'
        ],
        'Pricing & Billing': [
            'price', 'charge', 'cost', 'expensive', 'billing', 'invoice', 'refund',
            'overcharged', 'receipt', 'payment', 'fee'
        ],
        'Usability': [
            'hard to use', 'difficult', 'setup', 'instructions', 'manual', 'confusing',
            'interface', 'software', 'app', 'navigate', 'install'
        ]
    }

    @classmethod
    def clean_text_and_tokenize(cls, text):
        if not text:
            return []
        text_lower = text.lower()
        # Remove punctuation and split
        words = re.findall(r'\b\w+\b', text_lower)
        return words

    @classmethod
    def analyze_sentiment(cls, text, rating=None):
        words = cls.clean_text_and_tokenize(text)
        
        pos_count = sum(1 for w in words if w in cls.POSITIVE_WORDS)
        neg_count = sum(1 for w in words if w in cls.NEGATIVE_WORDS)

        # Incorporate rating weight if available
        if rating is not None:
            if rating >= 4:
                pos_count += 2
            elif rating <= 2:
                neg_count += 2

        total = pos_count + neg_count
        if pos_count > neg_count:
            sentiment = 'positive'
            confidence = 0.5 + 0.5 * ((pos_count - neg_count) / total) if total > 0 else 1.0
        elif neg_count > pos_count:
            sentiment = 'negative'
            confidence = 0.5 + 0.5 * ((neg_count - pos_count) / total) if total > 0 else 1.0
        else:
            sentiment = 'neutral'
            confidence = 1.0 if total == 0 else 0.5

        return sentiment, round(confidence, 2)

    @classmethod
    def classify_complaints(cls, text, sentiment='neutral', rating=None):
        # Operational heuristic: only classify complaints if sentiment is not positive OR rating is low
        is_low_rating = rating is not None and rating <= 3
        is_negative_sentiment = sentiment in ['negative', 'neutral']

        if not (is_low_rating or is_negative_sentiment):
            return []

        text_lower = (text or '').lower()
        matched_categories = []

        for category, keywords in cls.COMPLAINT_CATEGORIES.items():
            for kw in keywords:
                # Use word boundary to avoid matching sub-words like 'app' in 'disappointed'
                pattern = r'\b' + re.escape(kw) + r'\b'
                if re.search(pattern, text_lower):
                    matched_categories.append(category)
                    break  # Stop checking this category once matched

        return matched_categories

    @classmethod
    def analyze_business_reviews(cls, business):
        # Find all reviews that do not have an associated ReviewSentiment
        unbound_reviews = CustomerReview.objects.filter(
            business=business,
            sentiment__isnull=True
        )

        if not unbound_reviews.exists():
            return 0

        analyzed_count = 0
        with transaction.atomic():
            for review in unbound_reviews:
                # 1. Analyze sentiment
                sentiment_label, score = cls.analyze_sentiment(review.text, review.rating)
                ReviewSentiment.objects.create(
                    review=review,
                    sentiment=sentiment_label,
                    confidence_score=score
                )

                # 2. Classify complaints
                categories = cls.classify_complaints(review.text, sentiment=sentiment_label, rating=review.rating)
                for cat in categories:
                    ComplaintCategory.objects.create(
                        review=review,
                        category=cat,
                        keywords=[kw for kw in cls.COMPLAINT_CATEGORIES[cat] if kw in review.text.lower()]
                    )

                analyzed_count += 1

        return analyzed_count
