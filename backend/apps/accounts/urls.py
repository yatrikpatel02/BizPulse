from django.urls import path
from .views import auth
from .views import social_auth
from .views.user_settings import UserSettingsView

urlpatterns = [
    path('register/', auth.RegisterView.as_view(), name='register'),
    path('login/', auth.LoginView.as_view(), name='login'),
    path('logout/', auth.LogoutView.as_view(), name='logout'),
    path('token/refresh/', auth.CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', auth.ProfileView.as_view(), name='profile'),
    path('profile/change-password/', auth.ChangePasswordView.as_view(), name='change_password'),
    path('profile/delete/', auth.DeleteAccountView.as_view(), name='delete_account'),
    path('settings/', UserSettingsView.as_view(), name='user_settings'),
    path('social/google/', social_auth.GoogleAuthView.as_view(), name='social_google'),
]
