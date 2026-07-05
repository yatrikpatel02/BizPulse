from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views.business import BusinessViewSet

router = SimpleRouter()
router.register(r'', BusinessViewSet, basename='business')

urlpatterns = [
    path('', include(router.urls)),
]
