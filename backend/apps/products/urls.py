from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views.product import ProductViewSet

router = SimpleRouter()
router.register(r'', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]
