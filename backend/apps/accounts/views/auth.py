from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, permissions, status, views
from rest_framework.throttling import AnonRateThrottle
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from ..serializers.user import RegisterSerializer, LoginSerializer, UserSerializer, ProfileUpdateSerializer, ChangePasswordSerializer
from ..services.token_utils import (
    get_tokens_for_user,
    set_refresh_cookie,
    clear_refresh_cookie,
    COOKIE_NAME,
)


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        token_data = get_tokens_for_user(user)
        user_data = UserSerializer(user).data
        response = Response({
            'user': user_data,
            'token': {
                'access': token_data['access'],
                'refresh': token_data['refresh'],
            },
        }, status=status.HTTP_201_CREATED)
        set_refresh_cookie(response, token_data['refresh'])
        return response


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        token_data = get_tokens_for_user(user)
        user_data = UserSerializer(user).data
        response = Response({
            'user': user_data,
            'token': {
                'access': token_data['access'],
                'refresh': token_data['refresh'],
            },
        }, status=status.HTTP_200_OK)
        set_refresh_cookie(response, token_data['refresh'])
        return response


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(COOKIE_NAME)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass
        response = Response({'detail': 'Logout successful.'})
        clear_refresh_cookie(response)
        return response


class ProfileView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        user = request.user
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)


class CookieTokenRefreshView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(COOKIE_NAME)
        if not refresh_token:
            return Response({'detail': 'No refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response({'detail': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)

        access = serializer.validated_data['access']
        new_refresh = serializer.validated_data.get('refresh')

        response_data = {'access': access}
        if new_refresh:
            response_data['refresh'] = new_refresh

        response = Response(response_data)
        if new_refresh:
            set_refresh_cookie(response, new_refresh)
        return response


class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
