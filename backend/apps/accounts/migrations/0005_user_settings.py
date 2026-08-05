from django.conf import settings
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_alter_user_auth_provider'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('safety_stock', models.PositiveIntegerField(default=50)),
                ('csat_threshold', models.PositiveIntegerField(default=80)),
                ('star_rating', models.DecimalField(decimal_places=1, default=4.0, max_digits=3)),
                ('email_alerts', models.BooleanField(default=True)),
                ('auto_sync', models.BooleanField(default=True)),
                ('sync_frequency', models.CharField(
                    choices=[('on_demand', 'On Demand'), ('daily', 'Daily'), ('weekly', 'Weekly')],
                    default='daily',
                    max_length=20,
                )),
                ('import_method', models.CharField(
                    choices=[('csv', 'CSV Upload'), ('serpapi', 'SerpAPI'), ('flipkart', 'Flipkart Scraper'), ('google_trends', 'Google Trends')],
                    default='csv',
                    max_length=20,
                )),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='settings',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'User Settings',
                'verbose_name_plural': 'User Settings',
            },
        ),
    ]
