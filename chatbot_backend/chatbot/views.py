import json
import os
import logging
# import uuid
# import secrets
from datetime import datetime
from openai import OpenAI
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
# from rest_framework.authentication import BaseAuthentication, TokenAuthentication
# from rest_framework.exceptions import  AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from dotenv import load_dotenv
from .serializers import UserRegistrationSerializer, UserLoginSerializer
# import User from django.contrib.auth.models
from .preprocessing import preprocess_text
from .models import ChatHistory

# Load environment variables
load_dotenv()


# Initialize the OpenAI API
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv('OPENROUTER_API_KEY'),
)

# Configure logging
logger = logging.getLogger(__name__)

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
                logger.error(f"Error during user registration: {str(e)}")
                return Response(
                    {'error': 'An error occurred during registration. Please try again later.'},
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

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': user.pk,
            'email': user.email
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


class ChatbotView(APIView):
    """Handle authenticated chatbot interactions"""
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            user_input = request.data.get('message', '').strip()
            if not user_input:
                return Response(
                    {'error': 'Message is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Preprocess the user input
            preprocessed_input = preprocess_text(user_input)

            # Generate response with DeepSeek
            completion = client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "http://127.0.0.1:8000/chatbot/",
                    "X-Title": "chatbot",
                },
                extra_body = {
                    "top_p": 0.85,
                    "temperature": 0.6,
                    "frequency_penalty": 0.3,
                    "presence_penalty": 0.6,
                    "repetition_penalty": 1.1,
                    "top_k": 50,
                    "stream": False,
                    "stream_options": {
                        "include_usage": True
                    },
                    "max_tokens": 1500,  # Increased max tokens
                    "stop": ["\n", "User:", "AI:"]  # Adjusted stop parameter
                }
                ,

                model="deepseek/deepseek-chat",
                messages=[
                    {
                        "role": "user",
                        "content": preprocessed_input
                    }
                ]
            )

            if not completion.choices:
                return Response(
                    {'error': 'No response from the chatbot'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            bot_response = completion.choices[0].message.content.strip()
            


            # Log interaction
            if request.user.is_authenticated:
                self._log_interaction(request.user, user_input, bot_response)

            return Response({
                'user_message': user_input,
                'bot_response': bot_response,
                'timestamp': datetime.now().isoformat()
            })

        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _log_interaction(self, user, user_input, bot_response):
        """Log user interactions with context"""
        logger.info(
            f"User {user.email} ({user.pk}) - Input: {user_input} | Response: {bot_response}",
            extra={
                'user_id': user.pk,
                'input': user_input,
                'response': bot_response,
                'timestamp': datetime.now().isoformat()
            }
        )

class ChatHistoryView(APIView):
    """Manage chat history storage"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            chat_history = ChatHistory.objects.filter(user=request.user).order_by('-timestamp')
            history_data = [
                {
                    'message': entry.message,
                    'timestamp': entry.timestamp.isoformat()
                }
                for entry in chat_history
            ]
            return Response({'status': 'success', 'history': history_data})
        except Exception as e:
            logger.error(f"Chat history retrieval error: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving chat history. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        try:
            message = request.data.get('message')
            if not message:
                return Response(
                    {'error': 'Message is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            chat_history = ChatHistory.objects.create(
                user=request.user,
                message=message
            )

            return Response({'status': 'success', 'entry': {
                'message': chat_history.message,
                'timestamp': chat_history.timestamp.isoformat(),
                'user': chat_history.user.pk
            }})

        except Exception as e:
            logger.error(f"Chat history error: {str(e)}")
            return Response(
                {'error': 'An error occurred while saving chat history. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def api_home(request):
    cache_info = {
        'cache_engine': 'Redis',
        'cache_status': cache.client.get_client().ping(),
        'cache_keys': cache.client.get_client().dbsize()
    }
    return JsonResponse({'message': 'Welcome to the chatbot API!', 'cache': cache_info})
