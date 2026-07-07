from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from ..serializers.user import UserSerializer
from ..serializers.social import GoogleAuthSerializer
from ..services.token_utils import get_tokens_for_user, set_refresh_cookie
from ..services.social_auth import get_or_create_social_user
from ..services.google import verify_google_id_token
from django.conf import settings


class _BaseSocialAuthView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def _issue_tokens(self, user):
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        token_data = get_tokens_for_user(user)
        response = Response(
            {
                'user': UserSerializer(user).data,
                'token': token_data,
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, token_data['refresh'])
        return response


class GoogleAuthView(_BaseSocialAuthView):
    serializer_class = GoogleAuthSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = verify_google_id_token(serializer.validated_data['id_token'])
        except Exception as exc:
            return Response(
                {'detail': f'Google authentication failed: {exc}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        social_id = payload.get('sub')
        email = payload.get('email')
        if not email:
            return Response(
                {'detail': 'Google account did not provide an email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user, created = get_or_create_social_user(
                provider='google',
                social_id=social_id,
                email=email,
                first_name=payload.get('given_name', ''),
                last_name=payload.get('family_name', ''),
                avatar=payload.get('picture', ''),
            )
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return self._issue_tokens(user)
