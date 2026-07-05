from rest_framework import serializers
from businesses.models.business import Business

class BusinessSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.email')

    class Meta:
        model = Business
        fields = ['id', 'owner', 'name', 'industry', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
