from rest_framework import views, permissions, status
from rest_framework.response import Response
from ..models.user_settings import UserSettings
from ..serializers.user_settings import UserSettingsSerializer


class UserSettingsView(views.APIView):
    """
    GET  /api/accounts/settings/  — retrieve current user's settings (auto-creates with defaults if missing)
    PATCH /api/accounts/settings/ — partial update of user's settings
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create_settings(self, user):
        settings_obj, _ = UserSettings.objects.get_or_create(user=user)
        return settings_obj

    def get(self, request, *args, **kwargs):
        settings_obj = self._get_or_create_settings(request.user)
        serializer = UserSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        settings_obj = self._get_or_create_settings(request.user)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
