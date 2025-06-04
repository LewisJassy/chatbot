from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password
from .serializers import UserRegistrationSerializer
import os
import logging
import redis
import json
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

UserModel = get_user_model()

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=os.getenv('REDIS_PORT', 6379),
    db=os.getenv('REDIS_DB', 0),
    decode_responses=True,
    connection_pool=redis.ConnectionPool(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=os.getenv('REDIS_PORT', 6379),
        db=os.getenv('REDIS_DB', 0),
        max_connections=20
    )
)

_shared_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="auth_async")

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
    Optimized API endpoint for user login with efficient Redis caching.
    """
    USER_CACHE_TTL = 3600    
    def _get_cached_user_data(self, email):
        """Get user data from cache with error handling."""
        try:
            cache_key = f'user:{email}'
            cached_data = redis_client.get(cache_key)
            if cached_data:
                logger.debug(f"Found cached data for user: {email}")
                return json.loads(cached_data)
            else:
                logger.debug(f"No cached data found for user: {email}")
        except (redis.RedisError, json.JSONDecodeError) as e:
            logger.warning(f"Cache error for user {email}: {e}")
        return None    
    def _cache_user_data(self, user):
        """Cache user data efficiently."""
        try:
            cache_key = f'user:{user.email}'
            user_data = {
                'id': user.pk,
                'email': user.email,
                'password_hash': user.password,
                'is_active': user.is_active
            }
            # Use pipeline for atomic operation
            pipe = redis_client.pipeline()
            pipe.setex(cache_key, self.USER_CACHE_TTL, json.dumps(user_data))
            pipe.execute()
            logger.debug(f"Cached user data for {user.email}")
        except redis.RedisError as e:
            logger.warning(f"Failed to cache user data for {user.email}: {e}")
    def post(self, request):
        # Minimal validation for speed
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response({'error': 'Email and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Try cache-first authentication
        cached_user_data = self._get_cached_user_data(email)
        user = None
        
        if cached_user_data and cached_user_data.get('is_active', True):
            # Fast password verification using cached hash
            if check_password(password, cached_user_data.get('password_hash', '')):
                try:
                    # Create user object from cache data - no DB query needed
                    user = UserModel(
                        pk=cached_user_data['id'],
                        email=cached_user_data['email'],
                        is_active=cached_user_data.get('is_active', True)
                    )
                    # Set the password field for JWT token generation
                    user.password = cached_user_data.get('password_hash', '')
                    logger.info(f"User {email} authenticated via cache")
                except Exception as e:
                    logger.warning(f"Cache authentication failed for {email}: {e}")
                    user = None
        
        # Fallback to database authentication only if cache failed
        if not user:
            user = authenticate(request, username=email, password=password)
            if user and user.is_active:
                # Cache for next time
                self._cache_user_data(user)
                logger.info(f"User {email} authenticated via database")

        if not user:
            return Response({'error': 'Invalid credentials'}, 
                          status=status.HTTP_401_UNAUTHORIZED)

        # Generate tokens efficiently
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user_id': user.pk,
            'email': user.email
        }

        response = Response(response_data)

        # Set cookie efficiently
        cookie_age = 2592000 if request.data.get('remember_me') else 86400  # 30 days or 1 day in seconds
        response.set_cookie(
            'refresh_token',
            str(refresh),
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=cookie_age
        )

        logger.info(f"Login completed for {email}")

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
    Optimized API endpoint for user logout with efficient cache invalidation.
    """
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def _invalidate_user_cache(self, user_id, email):
        """Efficiently invalidate user cache using Redis pipeline."""
        try:
            pipe = redis_client.pipeline()
            pipe.delete(f'user:{email}')
            pipe.delete(f'user_info:{user_id}')
            pipe.execute()
            logger.debug(f"Cache invalidated for user {email}")
        except redis.RedisError as e:
            logger.warning(f"Cache invalidation failed for user {email}: {e}")

    def _blacklist_token_async(self, refresh_token):
        """Blacklist token in a separate thread to avoid blocking."""
        def blacklist_worker():
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.debug("Token blacklisted successfully")
            except TokenError as e:
                logger.warning(f"Token blacklisting failed: {e}")
            except Exception as e:
                logger.error(f"Unexpected error during token blacklisting: {e}")
        
        # Submit to shared thread pool for non-blocking execution
        _shared_executor.submit(blacklist_worker)

    def post(self, request):
        try:
            user_id = request.user.id
            email = request.user.email
            
            # Get refresh token from multiple sources efficiently
            refresh_token = (
                request.data.get("refresh_token") or 
                request.COOKIES.get('refresh_token')
            )
            
            # Run cache invalidation and token blacklisting in parallel
            self._invalidate_user_cache(user_id, email)
            
            if refresh_token:
                self._blacklist_token_async(refresh_token)
            
            response = Response(
                {"status": "success", "message": "User logged out successfully."},
                status=status.HTTP_200_OK
            )
            response.delete_cookie('refresh_token')
            
            logger.info(f"Logout completed for {email}")
            
            return response
            
        except Exception as e:
            logger.exception("Logout failed")
            return Response(
                {"error": "Logout failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
