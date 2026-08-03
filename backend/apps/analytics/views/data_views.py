from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.paginator import Paginator

from analytics.models import SalesRecord, InventorySnapshot, CustomerReview
from analytics.serializers import SalesRecordSerializer, InventorySnapshotSerializer, CustomerReviewSerializer


def get_business(request):
    business_id = request.headers.get('X-Business-Id')
    business = request.user.businesses.filter(id=business_id).first() if business_id else request.user.businesses.first()
    return business


class SalesRecordListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = get_business(request)
        if not business:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = SalesRecord.objects.filter(business=business).select_related('product').order_by('-date')

        # Search
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(product__name__icontains=search)

        # Date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Pagination
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        paginator = Paginator(qs, page_size)
        page_obj = paginator.get_page(page)

        serializer = SalesRecordSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page,
            'results': serializer.data
        })


class InventorySnapshotListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = get_business(request)
        if not business:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = InventorySnapshot.objects.filter(business=business).select_related('product').order_by('-date')

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(product__name__icontains=search)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        paginator = Paginator(qs, page_size)
        page_obj = paginator.get_page(page)

        serializer = InventorySnapshotSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page,
            'results': serializer.data
        })


class CustomerReviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = get_business(request)
        if not business:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = CustomerReview.objects.filter(business=business).select_related('product').order_by('-review_date')

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(text__icontains=search) | qs.filter(product__name__icontains=search)

        rating = request.query_params.get('rating')
        if rating:
            qs = qs.filter(rating=int(rating))

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(review_date__gte=date_from)
        if date_to:
            qs = qs.filter(review_date__lte=date_to)

        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        paginator = Paginator(qs, page_size)
        page_obj = paginator.get_page(page)

        serializer = CustomerReviewSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page,
            'results': serializer.data
        })
