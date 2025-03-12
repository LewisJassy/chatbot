from django.shortcuts import render
from rest_framework.generics import CreateAPIView, ListAPIView
from .models import CustomUser
from .serializers import CustomUserSerializer, UserCreateSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# Create your views here.


class ListUserAPIView(ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]


class CustomUserCreateView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]
