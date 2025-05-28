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
    """
    API endpoint for user registration.

    Accepts POST requests with user registration data, validates the input using
    UserRegistrationSerializer, and creates a new user account. On successful registration,
    returns a success message with HTTP 201 status. If registration fails due to validation
    errors or server issues, returns an appropriate error message and status code.
    """
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(
                    {'message': 'User created successfully'},
                    status=status.HTTP_201_CREATED
                )
            except Exception as exc:
                logger.exception("Registration failed")
                return Response(
                    {'error': 'Registration failed – please try again later.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        
class UserLoginView(APIView):
    """
    API endpoint for user login and JWT token authentication.

    Accepts POST requests with user credentials (email and password), validates the input
    using UserLoginSerializer, and authenticates the user. On successful authentication,
    returns access and refresh JWT tokens, user ID, and email. Also sets the refresh token
    as an HTTP-only cookie, with duration based on the 'remember_me' flag. Returns error
    messages and appropriate status codes for invalid credentials or input errors.
    """
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
            return Response({'error': 'Invalid credentials, check your email or password'}, status=status.HTTP_401_UNAUTHORIZED)

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
    """
    API endpoint to check user authentication status.

    Requires a valid JWT token. Accepts GET requests and returns the authentication
    status along with the user's ID and email if authenticated. Used to verify if the
    current session is authenticated.
    """
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
    """
    API endpoint to log out a user and blacklist the refresh token.

    Requires authentication. Accepts POST requests with a refresh token, blacklists the
    provided token to prevent further use, and returns a success message. Handles invalid
    or missing tokens and unexpected errors with appropriate error responses and status codes.
    """
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"status": "success", "message": "User logged out successfully."},
                status=status.HTTP_200_OK
            )
        except TokenError as exc:
            logger.warning("Logout called with invalid token: %s", exc)
            return Response(
                {"error": "Invalid refresh token"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
