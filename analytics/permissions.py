from rest_framework import permissions


class IsAnalyticsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.business.owner == request.user
