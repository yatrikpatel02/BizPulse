from rest_framework import serializers
from integrations.models import ColumnMapping
from integrations.services import ColumnMappingService


class ColumnMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColumnMapping
        fields = [
            'id',
            'business',
            'source_type',
            'original_column',
            'mapped_column',
            'confidence',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'business', 'created_at', 'updated_at']

    def validate(self, data):
        source_type = data.get('source_type') or (self.instance.source_type if self.instance else None)
        mapped_column = data.get('mapped_column') or (self.instance.mapped_column if self.instance else None)

        if not source_type:
            raise serializers.ValidationError({"source_type": "Source type is required."})

        valid_targets = ColumnMappingService.TARGET_COLUMNS.get(source_type)
        if not valid_targets:
            raise serializers.ValidationError({"source_type": f"Invalid source type. Allowed types: {list(ColumnMappingService.TARGET_COLUMNS.keys())}."})

        if mapped_column and mapped_column not in valid_targets:
            raise serializers.ValidationError({
                "mapped_column": f"Invalid target column '{mapped_column}' for source type '{source_type}'. Valid targets: {valid_targets}."
            })

        return data


class BulkColumnMappingItemSerializer(serializers.Serializer):
    original_column = serializers.CharField(max_length=100)
    mapped_column = serializers.CharField(max_length=100, allow_null=True, required=False)


class BulkColumnMappingSerializer(serializers.Serializer):
    source_type = serializers.ChoiceField(choices=ColumnMapping.SOURCE_TYPE_CHOICES)
    mappings = BulkColumnMappingItemSerializer(many=True)

    def validate(self, data):
        source_type = data.get('source_type')
        mappings = data.get('mappings', [])

        valid_targets = ColumnMappingService.TARGET_COLUMNS.get(source_type)
        if not valid_targets:
            raise serializers.ValidationError({"source_type": "Invalid source type."})

        # Validate each mapped column target
        for item in mappings:
            mapped_col = item.get('mapped_column')
            # If mapping is blank/None, that means they unmapped it, which is valid.
            if mapped_col and mapped_col not in valid_targets:
                raise serializers.ValidationError({
                    "mappings": f"Invalid target column '{mapped_col}' for source type '{source_type}'. Valid targets: {valid_targets}."
                })

        return data
