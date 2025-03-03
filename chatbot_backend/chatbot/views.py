import json
import os
import logging
# import uuid
from datetime import datetime
from openai import OpenAI
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from dotenv import load_dotenv
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .preprocessing import preprocess_text

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
                user = serializer.save()
                token, created = Token.objects.get_or_create(user=user) # Create auth token
                return Response(status=status.HTTP_201_CREATED)
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
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )

        # set cookie for user login data
        if user:
            login(request, user)
            if not request.data.get('remember_me'):
                # Expire session when the browser closes
                request.session.set_expiry(0)
            else:
                # Use default SESSION_COOKIE_AGE
                request.session.set_expiry(None)

        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })

class ChatbotView(APIView):
    """Handle authenticated chatbot interactions"""
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            data = json.loads(request.body)
            user_input = data.get('message', '').strip()
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
                extra_body={
                    "top_p": 1,
                    "temperature": 0.7,
                    "frequency_penalty": 0,
                    "presence_penalty": 0.8,
                    "repetition_penalty": 1,
                    "top_k": 0,
                    "stream": False,
                    "stream option": {
                        'include_usage': True,
                    },
                    "max_tokens": 500,
                    "stop": "\n"

                },
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

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {str(e)}")
            return Response(
                {'error': 'Invalid JSON format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
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

# class SessionView(APIView):
#     """Generate session tokens for anonymous users"""
#     def get(self, request):
#         if not request.session.session_key:
#             request.session.create()
#         return Response({
#             'session_token': str(uuid.uuid4()),
#             'session_key': request.session.session_key
#         })

class ChatHistoryView(APIView):
    """Manage chat history storage"""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            message = request.data.get('message')
            if not message:
                return Response(
                    {'error': 'Message is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            chat_history = request.session.get('chat_history', [])
            entry = {
                'message': message,
                'timestamp': datetime.now().isoformat(),
                'user': request.user.pk
            }
            chat_history.append(entry)
            request.session['chat_history'] = chat_history
            
            return Response({'status': 'success', 'entry': entry})

        except Exception as e:
            logger.error(f"Chat history error: {str(e)}")
            return Response(
                {'error': 'An error occurred while saving chat history. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def api_home(request):
    return JsonResponse({'message': 'Welcome to the chatbot API!'})