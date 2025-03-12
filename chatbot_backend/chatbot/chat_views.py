import json
import os
import logging

# import uuid
import secrets
from datetime import datetime
from openai import OpenAI
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import BaseAuthentication, TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from dotenv import load_dotenv

# import User from django.contrib.auth.models
from .preprocessing import preprocess_text
from .models import CustomUser
from django.views.decorators.csrf import csrf_exempt

# Load environment variables
load_dotenv()


# Initialize the OpenAI API
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Configure logging
logger = logging.getLogger(__name__)


class ChatbotView(APIView):
    """Handle authenticated chatbot interactions"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:

            data = request.data
            user_input = data.get("message", "").strip()

            if not user_input:
                return Response(
                    {"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            preprocessed_input = preprocess_text(user_input)

            # Generate response with DeepSeek
            completion = client.chat.completions.create(
                # extra_headers={
                #     "HTTP-Referer": "http://127.0.0.1:8000/chatbot/",
                #     "X-Title": "chatbot",
                # },
                extra_body={
                    "top_p": 0.85,
                    "temperature": 0.6,
                    "frequency_penalty": 0.3,
                    "presence_penalty": 0.6,
                    "repetition_penalty": 1.1,
                    "top_k": 50,
                    "stream": True,
                    "stream option": {"include_usage": True},
                    "max_tokens": 1000,
                    "stop": ["\n\n", "User:", "AI:"],
                },
                model="deepseek/deepseek-chat",
                messages=[{"role": "user", "content": preprocessed_input}],
            )

            data = json.loads(completion)  # Parse the JSON string
            if not data.get("choices"):
                return Response(
                    {"error": "No response from the chatbot"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            bot_response = completion.choices[0].message.content.strip()

            # Log interaction
            if request.user.is_authenticated:
                self._log_interaction(request.user, user_input, bot_response)

            return Response(
                {
                    "user_message": user_input,
                    "bot_response": bot_response,
                    "timestamp": datetime.now().isoformat(),
                }
            )

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {str(e)}")
            return Response(
                {"error": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _log_interaction(self, user, user_input, bot_response):
        """Log user interactions with context"""
        logger.info(
            f"User {user.email} ({user.pk}) - Input: {user_input} | Response: {bot_response}",
            extra={
                "user_id": user.pk,
                "input": user_input,
                "response": bot_response,
                "timestamp": datetime.now().isoformat(),
            },
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
            message = request.data.get("message")
            if not message:
                return Response(
                    {"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            chat_history = request.session.get("chat_history", [])
            entry = {
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "user": request.user.pk,
            }
            chat_history.append(entry)
            request.session["chat_history"] = chat_history

            return Response({"status": "success", "entry": entry})

        except Exception as e:
            logger.error(f"Chat history error: {str(e)}")
            return Response(
                {
                    "error": "An error occurred while saving chat history. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def api_home(request):
    return JsonResponse({"message": "Welcome to the chatbot API!"})
