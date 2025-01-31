import json
import os
from django.http import JsonResponse
from dotenv import load_dotenv
import cohere
from django.contrib.auth import authenticate, login
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework.authentication import TokenAuthentication
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import logging
from datetime import datetime
import uuid
# Load environment variables
load_dotenv()
cohere_api_key = os.getenv('COHERE_API_KEY')

# Initialize the Cohere client
co = cohere.Client(cohere_api_key)

# Initialize logging
logging.basicConfig(
    filename='chatbot_logs.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)

def log_interaction(user, message):
    try:
        logging.info(f"User: {user}, Message: {message}")
    except Exception as e:
        logging.error(f"Error logging interaction: {e}")

def session_view(request):
    """Generate a session token for the user."""
    if request.method == 'GET':
        if not request.session.session_key:
            request.session.create()
        session_token = str(uuid.uuid4())  # Generate a unique session token
        return JsonResponse({'session_token': session_token})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user:
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})
    return Response({"error": "Invalid credentials"}, status=401)

# Session Management
@csrf_protect
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def save_chat_history(request, message):
    session_key = request.session.session_key
    if not session_key:
        request.session.create()
        request.session.save()
    chat_history = request.session.get('chat_history', [])
    
    chat_history.append({
        'message': message,
        'timestamp': datetime.now().isoformat()
    })
    request.session['chat_history'] = chat_history
    log_interaction(request.user.username, message)
    return JsonResponse({"status": "success", "chat_history": chat_history})

# Logging and Monitoring
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def chatbot_response(request):
    print(f"Requesting method: {request.method}")
    if request.method == 'POST':
        try:
            if not request.body:
                return JsonResponse({'error': 'Empty request body'}, status=400)
            
            body = json.loads(request.body)
            user_input = body.get('message', '')
            short_reply = body.get('short_reply', False)

            if not user_input:
                return JsonResponse({'error': 'Message is required'}, status=400)
            

            max_token = 50 if short_reply else 150

            # Call Cohere's Generate API
            response = co.generate(
                model='command',
                prompt=f"You are a helpful assistant.\nUser: {user_input}\nAssistant:",
                max_tokens=max_token,
                temperature=0.7,
                p=0.9,
            )

            bot_response = response.generations[0].text.strip()
            log_interaction('User', user_input)
            log_interaction('Chatbot', bot_response)

            save_chat_history(request, user_input)
            save_chat_history(request, bot_response)

            return JsonResponse({'response': bot_response})
        
        except cohere.CohereError as e:
            logging.error(f"Cohere API Error: {e}")
            return JsonResponse({'error': 'Chat service unavailable'}, status=503)
        
        except KeyError as e:
            logging.error(f"KeyError: {e}")
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except cohere.CohereError as e:
            print(f"Error communicating with Cohere: {e}")
            return JsonResponse({'error': f"Error communicating with Cohere: {e}"}, status=500)
        except Exception as e:
            print(f"Exception: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    elif request.method == 'GET':
        return JsonResponse({'message': 'This endpoint only accepts POST requests'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def chatbot_interaction(request):
    user_message = request.data.get('message')
    log_interaction(request.user.username, user_message)
    # Simulate chatbot response
    bot_response = f"Hello, {request.user.username}. You said: {user_message}"
    log_interaction('Chatbot', bot_response)
    return Response({"user_message": user_message, "bot_response": bot_response})

# Security Measures
class SecureChatbotCsrfMiddleware(CsrfViewMiddleware):
    def process_view(self, request, callback, callback_args, callback_kwargs):
        if request.method == 'POST':
            super().process_view(request, callback, callback_args, callback_kwargs)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def secure_api_endpoint(request):
    # Example endpoint with security measures
    data = request.data.get('payload')
    log_interaction(request.user.username, f"Accessed secure endpoint with payload: {data}")
    return Response({"status": "secure data received"})

# Home Endpoint
def api_home(request):
    return JsonResponse({'message': 'Welcome to the Chatbot API!'})
