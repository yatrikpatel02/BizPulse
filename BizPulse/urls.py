from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/businesses/', include('businesses.urls')),
    path('api/products/', include('products.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/integrations/', include('integrations.urls')),
    path('api/reports/', include('reports.urls')),
]
