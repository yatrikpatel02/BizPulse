from rest_framework import serializers
from ..models.user_settings import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            'safety_stock',
            'csat_threshold',
            'star_rating',
            'email_alerts',
            'auto_sync',
            'sync_frequency',
            'import_method',
            'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate_safety_stock(self, value):
        if not (5 <= value <= 500):
            raise serializers.ValidationError('Safety stock must be between 5 and 500.')
        return value

    def validate_csat_threshold(self, value):
        if not (50 <= value <= 98):
            raise serializers.ValidationError('CSAT threshold must be between 50 and 98.')
        return value

    def validate_star_rating(self, value):
        if not (3.0 <= float(value) <= 4.8):
            raise serializers.ValidationError('Star rating must be between 3.0 and 4.8.')
        return value
