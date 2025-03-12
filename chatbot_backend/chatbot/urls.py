from django.urls import path, include
from . import views
from . import chat_views


urlpatterns = [
    path("ls-users/", views.ListUserAPIView.as_view(), name="ls-users"),
    path("register/", views.CustomUserCreateView.as_view(), name="register"),
    path("chat/", chat_views.ChatbotView.as_view(), name="chat"),
]
