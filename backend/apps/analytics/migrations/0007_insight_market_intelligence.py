# Generated for the persisted per-keyword market intelligence insight type.
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('analytics', '0006_insight_add_declining_demand')]

    operations = [
        migrations.AlterField(
            model_name='insight',
            name='insight_type',
            field=models.CharField(
                choices=[
                    ('revenue_declining', 'Revenue Declining'),
                    ('competitor_price_lower', 'Competitor Price Lower'),
                    ('growing_demand', 'Growing Market Demand'),
                    ('declining_demand', 'Declining Market Demand'),
                    ('market_intelligence', 'Market Intelligence'),
                    ('inventory_risk', 'Inventory Risk'),
                ],
                max_length=30,
            ),
        ),
    ]
