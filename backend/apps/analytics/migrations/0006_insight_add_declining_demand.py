# Generated manually to add declining_demand insight type

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0005_prediction_model_name_prediction_product'),
    ]

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
                    ('inventory_risk', 'Inventory Risk'),
                ],
                max_length=30,
            ),
        ),
    ]
