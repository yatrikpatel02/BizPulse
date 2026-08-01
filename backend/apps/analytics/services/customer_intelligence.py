import pandas as pd
from django.db.models import Avg, Count
from analytics.models import CustomerReview, ReviewSentiment, ComplaintCategory
from analytics.services.nlp_service import NLPService


class CustomerIntelligenceService:
    @classmethod
    def calculate_satisfaction_metrics(cls, business):
        # 1. Run NLP analysis for unanalyzed reviews of this business
        NLPService.analyze_business_reviews(business)

        reviews = CustomerReview.objects.filter(business=business)
        total_reviews = reviews.count()

        if total_reviews == 0:
            return {
                'average_rating': 0.0,
                'csat_score_pct': 0.0,
                'total_reviews': 0,
                'sentiment_distribution': {
                    'positive': 0, 'positive_pct': 0.0,
                    'neutral': 0, 'neutral_pct': 0.0,
                    'negative': 0, 'negative_pct': 0.0
                },
                'complaints_by_category': [],
                'recent_complaints': [],
                'trends': []
            }

        # 2. Average rating and CSAT
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0.0
        csat_reviews_count = reviews.filter(rating__gte=4).count()
        csat_score_pct = (csat_reviews_count / total_reviews) * 100.0

        # 3. Sentiment distribution
        sentiments = ReviewSentiment.objects.filter(review__business=business)
        sent_counts = sentiments.values('sentiment').annotate(count=Count('id'))
        
        sent_dict = {item['sentiment']: item['count'] for item in sent_counts}
        pos = sent_dict.get('positive', 0)
        neu = sent_dict.get('neutral', 0)
        neg = sent_dict.get('negative', 0)

        sentiment_dist = {
            'positive': pos,
            'positive_pct': round((pos / total_reviews) * 100.0, 2),
            'neutral': neu,
            'neutral_pct': round((neu / total_reviews) * 100.0, 2),
            'negative': neg,
            'negative_pct': round((neg / total_reviews) * 100.0, 2),
        }

        # 4. Complaints by category
        complaint_cats = ComplaintCategory.objects.filter(review__business=business)
        cat_counts = complaint_cats.values('category').annotate(count=Count('id')).order_by('-count')
        complaints_by_category = [
            {'category': item['category'], 'count': item['count']}
            for item in cat_counts
        ]

        # 5. Recent complaints
        recent_complaints_qs = complaint_cats.select_related('review', 'review__product').order_by('-analyzed_at')[:5]
        recent_complaints = []
        for cc in recent_complaints_qs:
            recent_complaints.append({
                'review_id': cc.review.id,
                'date': cc.review.review_date.strftime('%Y-%m-%d'),
                'product_name': cc.review.product.name if cc.review.product else 'N/A',
                'product_sku': cc.review.product.sku if cc.review.product else 'N/A',
                'rating': cc.review.rating,
                'text': cc.review.text,
                'author_name': cc.review.author_name,
                'category': cc.category,
                'keywords': cc.keywords
            })

        # 6. Historical sentiment trends using Pandas
        records = list(reviews.values('review_date', 'sentiment__sentiment'))
        df = pd.DataFrame(records)
        df['date'] = pd.to_datetime(df['review_date'])
        
        # Resample to Month Start ('MS') and count sentiments
        # Group by month and sentiment type, then unstack to format columns
        df['sentiment'] = df['sentiment__sentiment'].fillna('neutral')
        
        # Pivot table grouping
        pivot_df = df.groupby([pd.Grouper(key='date', freq='MS'), 'sentiment']).size().unstack(fill_value=0)
        
        # Ensure all columns are present
        for col in ['positive', 'neutral', 'negative']:
            if col not in pivot_df.columns:
                pivot_df[col] = 0

        pivot_df = pivot_df.reset_index()
        
        trends = []
        for _, row in pivot_df.iterrows():
            trends.append({
                'date': row['date'].strftime('%Y-%m'),
                'positive': int(row['positive']),
                'neutral': int(row['neutral']),
                'negative': int(row['negative'])
            })

        return {
            'average_rating': round(float(avg_rating), 2),
            'csat_score_pct': round(csat_score_pct, 2),
            'total_reviews': total_reviews,
            'sentiment_distribution': sentiment_dist,
            'complaints_by_category': complaints_by_category,
            'recent_complaints': recent_complaints,
            'trends': trends
        }
