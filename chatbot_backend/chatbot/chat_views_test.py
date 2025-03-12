import json
import os
import logging
from datetime import datetime
from openai import OpenAI
from django.http import JsonResponse
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from dotenv import load_dotenv

from .preprocessing import preprocess_text

load_dotenv()


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

logger = logging.getLogger(__name__)


class ChatbotView(APIView):
    """Handle chatbot interactions for both authenticated and non-authenticated users"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            user_input = data.get("message", "").strip()

            if not user_input:
                return Response(
                    {"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            processed_input = preprocess_text(user_input)

            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": processed_input}],
                    max_tokens=200,
                    temperature=0.7,
                )
                bot_response = response.choices[0].message.content.strip()
            except Exception as api_error:
                logger.error(f"OpenAI API error: {str(api_error)}")
                return Response(
                    {"error": "AI service unavailable. Please try again later."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            response_dict = {
                "user_message": user_input,
                "bot_response": "",
                "timestamp": datetime.now().isoformat(),
            }
            if bot_response:
                response_dict["bot_response"] = bot_response
            else:
                response_dict["bot_response"] = "Can't reach the server at the moment!"

            return Response(response_dict)

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
            f"User {user.email if user else 'Anonymous'} - Input: {user_input} | Response: {bot_response}",
            extra={
                "user_id": user.pk if user else None,
                "input": user_input,
                "response": bot_response,
                "timestamp": datetime.now().isoformat(),
            },
        )


class ChatHistoryView(APIView):
    """Manage chat history storage"""

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
