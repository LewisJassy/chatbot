from django.urls import path
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    ChatbotView,
    ChatHistoryView,
    api_home,
)

urlpatterns = [
    path('', api_home, name='api_home'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('history/', ChatHistoryView.as_view(), name='history'),
]