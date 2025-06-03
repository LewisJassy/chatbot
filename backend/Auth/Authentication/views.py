from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, get_user_model
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import logging
import redis
import json

logger = logging.getLogger(__name__)
load_dotenv()
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ALGORITHM = os.getenv("HS256")

UserModel = get_user_model()

# Initialize Redis client
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=os.getenv('REDIS_PORT', 6379),
    db=os.getenv('REDIS_DB', 0),
    decode_responses=True
)

class UserRegistrationView(APIView):
    """
    API endpoint for user registration.
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
    API endpoint for user login with Redis caching.
    """
    USER_CACHE_TTL = 300
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Check cache first
        cache_key = f'user:{email}'
        cached_user = redis_client.get(cache_key)
        
        user = None
        if cached_user != None:
            try:
                user_data = json.loads(cached_user)
                # Validate cached credentials
                if user_data.get('password') == password:
                    try:
                        user = UserModel.objects.get(email=email)
                        logger.info(f"User {email} authenticated via cache")
                    except UserModel.DoesNotExist:
                        logger.error(f"User {email} not found in database during cache validation")
                    except Exception as e:
                        logger.error(f"Unexpected error during database query for {email}: {str(e)}")
            except json.JSONDecodeError:
                logger.warning("Cache decode error for user: %s", email)
        
        if not user:
            user = authenticate(request, username=email, password=password)
            if not user:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Cache valid authentication
        try:
            user_data = {
                # 'id': user.pk,
                'email': user.email,
                'password': password
            }
            redis_client.setex(
                cache_key, 
                self.USER_CACHE_TTL, 
                json.dumps(user_data)
            )
            logger.info(f"User {email} authenticated via DB and cached")
        except redis.RedisError as e:
            logger.error(f"Redis cache error: {str(e)}")
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response_data = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': user.pk,
            'email': user.email
        }
        response = Response(response_data)

        cookie_age = timedelta(days=30).total_seconds() if request.data.get('remember_me') else timedelta(days=1).total_seconds()
        
        response.set_cookie(
            'refresh_token',
            refresh_token,
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=cookie_age
        )
        return response


class AuthStatusView(APIView):
    """
    API endpoint to check authentication status with caching.
    """
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        cache_key = f'user_info:{user.id}'
        cached_user = redis_client.get(cache_key)
        
        if cached_user:
            try:
                user_info = json.loads(cached_user)
                logger.info(f"Returned cached user info for {user.email}")
                return Response(user_info)
            except json.JSONDecodeError:
                pass
        
        response_data = {
            'authenticated': True,
            'user': {
                'id': user.id,
                'email': user.email
            }
        }
        
        try:
            redis_client.setex(cache_key, 3600, json.dumps(response_data))
        except redis.RedisError as e:
            logger.error(f"Redis cache error: {str(e)}")
        
        return Response(response_data)


class UserLogoutView(APIView):
    """
    API endpoint to log out with cache invalidation.
    """
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            user_id = request.user.id
            email = request.user.email
            
            redis_client.delete(f'user:{email}')
            redis_client.delete(f'user_info:{user_id}')
            
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            response = Response(
                {"status": "success", "message": "User logged out successfully."},
                status=status.HTTP_200_OK
            )
            response.delete_cookie('refresh_token')
            return response
            
        except TokenError as exc:
            logger.warning("Logout token error: %s", exc)
            return Response(
                {"error": "Invalid refresh token"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("Logout failed")
            return Response(
                {"error": "Logout failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
