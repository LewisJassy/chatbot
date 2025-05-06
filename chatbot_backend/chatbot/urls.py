from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    UserRegistrationView,
    UserLoginView,
    AuthStatusView,
    UserLogoutView,
    ChatbotView,
    ChatHistoryView,
    api_home,
)

urlpatterns = [
    path('', api_home, name='api_home'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('status/', AuthStatusView.as_view(), name='status'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('history/', ChatHistoryView.as_view(), name='history'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]