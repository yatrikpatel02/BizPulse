from rest_framework import serializers
from integrations.models import ImportBatch


class ImportBatchSerializer(serializers.ModelSerializer):
    business = serializers.ReadOnlyField(source='business.name')

    class Meta:
        model = ImportBatch
        fields = ['id', 'business', 'dataset_type', 'original_filename', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
