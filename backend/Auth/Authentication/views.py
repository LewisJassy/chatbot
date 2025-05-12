from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)
load_dotenv()
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ALGORITHM = os.getenv("HS256")

class UserRegistrationView(APIView):
    """Handle user registration with token creation"""
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(
                    {'message': 'User created successfully'},
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                logger.error(f"Error during registration: {str(e)}")
                return Response(
                    {'error': 'An error occurred during registration. Please try again later'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        
class UserLoginView(APIView):
    """Handle user login and token authentication"""
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(
            request,
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        remember_me = request.data.get('remember_me', False)

        response_data = ({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': user.pk,
            'email': user.email
        })
        response = Response(response_data)

        if remember_me:
            response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    httponly=True,
                    secure=True,
                    samesite='Lax',
                    max_age=timedelta(days=30).total_seconds()
                )
        else:
            response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    httponly=True,
                    secure=True,
                    samesite='Lax',
                    max_age=timedelta(days=1).total_seconds()
                    )
        return response

class AuthStatusView(APIView):
    """Check if the user is authenticated"""
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        return Response({
            'authenticated': True,
            'user':{
                'id':user.id,
                'email':user.email
            }
        })

class UserLogoutView(APIView):
    """Logout user and blacklist the refresh token"""
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")

            if not refresh_token:
                return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Blacklist the refresh token
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError as e:
                return Response({"error": f"Invalid token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"status": "success", "message": "User logged out successfully."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
