from rest_framework import serializers
from reports.models import Report


class ReportSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')

    class Meta:
        model = Report
        fields = [
            'id', 'business', 'report_type', 'generated_at',
            'file_path', 'parameters', 'status'
        ]
        read_only_fields = ['id', 'generated_at']
