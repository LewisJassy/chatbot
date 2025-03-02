from django.urls import path
from .views import (
    UserRegistrationView,
    UserLoginView,
    ChatbotView,
    ChatHistoryView,
    api_home,
    get_csrf_token,
)

urlpatterns = [
    path('', api_home, name='api_home'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('history/', ChatHistoryView.as_view(), name='history'),
    path('csrf-token/', get_csrf_token, name='csrf_token'),
]