from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from ..serializers.contact import ContactSubmissionSerializer
from ..models import ContactSubmission

class ContactSubmissionView(generics.CreateAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Log to server console for testing/debugging
        print(f"New Contact Submission Received: {serializer.data}")
        
        return Response(
            {"detail": "Thank you! Your message has been sent successfully. We will get back to you shortly."},
            status=status.HTTP_201_CREATED,
            headers=headers
        )
