from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_user_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='auth_provider',
            field=models.CharField(
                choices=[('local', 'Local'), ('google', 'Google'), ('facebook', 'Facebook')],
                default='local',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='social_uid',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='avatar',
            field=models.URLField(blank=True, null=True),
        ),
    ]
