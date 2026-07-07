from rest_framework import serializers


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)

    def validate_id_token(self, value):
        if not value.strip():
            raise serializers.ValidationError('id_token is required.')
        return value.strip()
