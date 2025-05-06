import json
import os
import logging
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from dotenv import load_dotenv
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .preprocessing import preprocess_text
from .models import ChatHistory

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()



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


class ChatbotView(APIView):
    """Handle authenticated chatbot interactions"""
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)
    def post(self, request):
        try:
            user_input = request.data.get('message', '').strip()
            role = request.data.get("role", "assistant").strip().lower()
            stream = request.data.get("stream", False)
            if not user_input:
                return Response(
                    {'error': 'Message is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )


            preprocessed_input = preprocess_text(user_input)
            # Use a concise system prompt for all roles
            system_message = "You are a helpful and knowledgeable assistant. Answer questions clearly and directly in plain text."

            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(system_message),
                HumanMessagePromptTemplate.from_template("{input}")
            ])

            
            model = ChatOpenAI(
                model="mistralai/mixtral-8x7b-instruct",
                openai_api_base = "https://openrouter.ai/api/v1",
                openai_api_key = os.getenv('OPENROUTER_API_KEY'),
                temperature=0.6,
                max_tokens=800,
                streaming=stream,
                top_p = 0.85,
                frequency_penalty= 0.3,
                presence_penalty= 0.6,
                stop= ["User:", "AI:"],
            )
 
            chain = prompt | model | StrOutputParser()

            bot_response = ""
            if stream:
                for chunk in chain.stream({"input": preprocessed_input}):
                    bot_response += chunk
            else:
                try:
                    bot_response = chain.invoke({"input": preprocessed_input})
                except Exception as e:
                    logger.error(f"Model invocation error: {str(e)}")
                    return Response(
                        {'error': 'Failed to get response from chatbot'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            if not bot_response.strip():
                return Response(
                    {'error': 'Empty response from the chatbot'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


            if request.user.is_authenticated:
                self._log_interaction(request.user, user_input, bot_response)

            return Response({
                'user_message': user_input,
                'bot_response': bot_response,
                'role': role,
                'timestamp': datetime.now().isoformat()
            })

        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("Unexpected error in chatbot view: %s", str(e))
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
    
    return JsonResponse({'message': 'Welcome to the chatbot API!'})
