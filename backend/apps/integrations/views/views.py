from rest_framework import viewsets, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from django.core.exceptions import ValidationError

from integrations.models import ColumnMapping
from integrations.serializers import ColumnMappingSerializer, BulkColumnMappingSerializer
from integrations.services import (
    TemporaryStorageService,
    ColumnDetectionService,
    ColumnMappingService
)


class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        business_id = request.headers.get('X-Business-Id')
        business = request.user.businesses.filter(id=business_id).first() if business_id else request.user.businesses.first()
        if not business:
            return Response(
                {"detail": "Business profile not found. Please create a business profile first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get file
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response(
                {"detail": "CSV file not provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get source type
        source_type = request.data.get('source_type') or request.query_params.get('source_type')
        if not source_type:
            return Response(
                {"source_type": "Source type is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_source_types = [choice[0] for choice in ColumnMapping.SOURCE_TYPE_CHOICES]
        if source_type not in valid_source_types:
            return Response(
                {"source_type": f"Invalid source type. Allowed values are: {valid_source_types}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save and process file
        temp_file_id = None
        try:
            temp_file_id = TemporaryStorageService.save_temp_file(uploaded_file)
            temp_path = TemporaryStorageService.get_temp_file_path(temp_file_id)

            # Detect headers
            headers = ColumnDetectionService.detect_headers(temp_path)

            # Get suggested mappings
            suggested_mappings = ColumnMappingService.get_suggestions(
                business=business,
                source_type=source_type,
                headers=headers
            )

            return Response({
                "temp_file_id": temp_file_id,
                "headers": headers,
                "suggested_mappings": suggested_mappings
            }, status=status.HTTP_200_OK)

        except ValidationError as e:
            # Clean up temp file if saved but failed later
            if temp_file_id:
                TemporaryStorageService.delete_temp_file(temp_file_id)

            # Extract list or string error message
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            if temp_file_id:
                TemporaryStorageService.delete_temp_file(temp_file_id)
            return Response({"detail": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class ColumnMappingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ColumnMappingSerializer

    def get_queryset(self):
        business_id = self.request.headers.get('X-Business-Id')
        business = self.request.user.businesses.filter(id=business_id).first() if business_id else self.request.user.businesses.first()
        if not business:
            return ColumnMapping.objects.none()

        queryset = ColumnMapping.objects.filter(business=business)
        source_type = self.request.query_params.get('source_type')
        if source_type:
            queryset = queryset.filter(source_type=source_type)

        return queryset

    def perform_create(self, serializer):
        business_id = self.request.headers.get('X-Business-Id')
        business = self.request.user.businesses.filter(id=business_id).first() if business_id else self.request.user.businesses.first()
        if not business:
            raise serializers.ValidationError("Business profile not found. Please create a business profile first.")
        serializer.save(business=business)

    @action(detail=False, methods=['post'], url_path='bulk-save')
    def bulk_save(self, request):
        """
        Saves multiple column mappings for a specific source_type.
        Overwrites any existing mappings for this business and source_type.
        """
        business_id = request.headers.get('X-Business-Id')
        business = request.user.businesses.filter(id=business_id).first() if business_id else request.user.businesses.first()
        if not business:
            return Response(
                {"detail": "Business profile not found. Please create a business profile first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BulkColumnMappingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source_type = serializer.validated_data['source_type']
        mappings_data = serializer.validated_data['mappings']

        # Clear existing mappings for this source_type to allow full update
        ColumnMapping.objects.filter(business=business, source_type=source_type).delete()

        saved_mappings = []
        for item in mappings_data:
            mapped_col = item.get('mapped_column')
            # If the user maps it to empty/None, we don't save it (it is unmapped)
            if mapped_col:
                mapping = ColumnMapping.objects.create(
                    business=business,
                    source_type=source_type,
                    original_column=item['original_column'],
                    mapped_column=mapped_col,
                    confidence=1.0  # Confirming mappings explicitly gives 1.0 confidence
                )
                saved_mappings.append(mapping)

        response_serializer = ColumnMappingSerializer(saved_mappings, many=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
