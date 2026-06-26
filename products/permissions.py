from rest_framework import permissions


class IsProductOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.business.owner == request.user
