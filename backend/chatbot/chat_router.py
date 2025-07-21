from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import aio_pika
import os
import sys
# add parent directory (backend) to sys.path for module imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import logging
import json
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, wait_fixed, retry_if_exception_type
from datetime import datetime
from typing import AsyncGenerator
from backend.prompts.loader import PromptLoader

# LangChain Imports
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_redis import RedisChatMessageHistory

# Models
from models import ChatRequest, ChatResponse

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)
load_dotenv()
prompt_loader = PromptLoader()

# Configuration
VECTOR_SERVICES_URL = os.getenv("VECTOR_SERVICES_URL", "http://localhost:82")
AUTH_URL = os.getenv("AUTH_URL", "http://127.0.0.1:8000")
MAX_CONTEXT_TOKENS = 4000
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_ENDPOINT = "https://models.github.ai/inference"
GITHUB_MODEL = "openai/gpt-4.1"

rabbitmq_connection_pool = None

# Establish RabbitMQ connection
async def get_rabbitmq_connection() -> aio_pika.RobustConnection:
    """Get or create a global RabbitMQ connection pool for publishing messages."""
    global rabbitmq_connection_pool
    if not rabbitmq_connection_pool:
        rabbitmq_connection_pool = await aio_pika.connect_robust(RABBITMQ_URL)
    return rabbitmq_connection_pool

# Token verification
async def verify_token(token: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token via the authentication service and return user info payload.

    Raises HTTPException if token is invalid or service is unavailable."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                f"{AUTH_URL}/auth/status/",
                headers={"Authorization": f"Bearer {token.credentials}"}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            return response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=500, detail="Token verification failed")

# Redis chat history
def get_redis_history(session_id: str) -> BaseChatMessageHistory:
    """Return a Redis-based chat history store for the given session ID with 1-day TTL."""
    return RedisChatMessageHistory(
        session_id=session_id,
        redis_url=REDIS_URL,  # Use redis_url instead of url
        ttl=86400,
        key_prefix="LLM-chat:"
    )

# Chat endpoint
@router.post("/chat", response_model=ChatResponse)
async def handle_chat(request: ChatRequest, background_tasks: BackgroundTasks, user_info: dict = Depends(verify_token)):
    """Main chat endpoint: handles user message, retrieves context, generates response (streamed or not),
stores history, and logs interaction asynchronously."""
    user_id = user_info.get("user", {}).get("id")
    history = get_redis_history(str(user_id))
    try:
        history.add_user_message(request.message)
        vector_response = await _call_vector_service(request.message, request.role)
        context_str = _build_context(vector_response)

        if request.stream:
            return StreamingResponse(
                _stream_generator(request.message, context_str, user_id, history, request.role),
                media_type="text/event-stream"
            )

        bot_response = await _generate_response(request.message, context_str, request.role)
        history.add_ai_message(bot_response)
        background_tasks.add_task(_log_interaction, user_id, request.message, bot_response)

        return ChatResponse(
            user_message=request.message,
            bot_response=bot_response,
            role=request.role,
            timestamp=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Chat processing failed")

# Streaming generator
async def _stream_generator(message: str, context: str, user_id: str, history: RedisChatMessageHistory, role: str) -> AsyncGenerator[str, None]:
    """Generator for streaming chat responses as Server-Sent Events, logs complete response after streaming."""
    full_response = []
    try:
        async for chunk in _generate_response_stream(message, context, history, role):
            full_response.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        await _log_interaction(user_id, message, "".join(full_response))
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"data: {json.dumps({'error': 'Stream interrupted'})}\n\n"

# Vector similarity
@retry(stop=stop_after_attempt(5), wait=wait_fixed(2))
async def _call_vector_service(query: str, role: str) -> dict:
    """Call the vector service for similarity search, retrying up to 3 times on failure."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            url = f"{VECTOR_SERVICES_URL}/similarity-search"
            logger.info(f"🔁 Calling vector service at: {url}")
            response = await client.post(
                url,
                json={"query": query, "role": role}
            )
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError as e:
        logger.error(f"❌ Failed to connect to vector service: {e}")
        raise
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logger.warning(f"⚠️ Vector service rate limited (429). Proceeding without context.")
            return []  # fallback to no context when rate limited
        logger.error(f"🚨 Vector service returned error: {e.response.status_code} {e.response.text}")
        raise
    except Exception as e:
        logger.exception("⚠️ Unexpected error while calling vector service.")
        raise


# Build context from vector results
def _build_context(docs: list) -> str:
    """Assemble a context string from vector results, respecting maximum token limits."""
    context_messages = []
    current_tokens = 0
    for doc in docs:
        content = doc.get("text", "")
        metadata = doc.get("metadata", {})
        role = "User" if metadata.get("role") == "user" else "Assistant"
        message = f"{role}: {content}"
        estimated_tokens = len(message) // 4
        if current_tokens + estimated_tokens > MAX_CONTEXT_TOKENS - 200:
            break
        context_messages.append(message)
        current_tokens += estimated_tokens
    return "\n".join(context_messages) if context_messages else "No relevant history found"

# Generate non-streamed response
async def _generate_response(message: str, context: str, role: str = "default") -> str:
    """Generate a non-streamed chatbot response using the configured LLM chain."""
    # Load system prompt and fallback on missing role
    try:
        system_prompt = prompt_loader.load_prompts(role)
    except ValueError:
        logger.warning(f"Prompt for role '{role}' not found, falling back to default")
        system_prompt = prompt_loader.load_prompts('default')
    # Escape braces to avoid format string errors
    escaped_prompt = system_prompt.replace('{', '{{').replace('}', '}}')
    # Truncate context if too long
    if context and len(context) > 2000:
        logger.warning("Context too long, truncating ...")
        context = "...previous context truncated...\n" + context[-2000:]
    full_system_prompt = f"{escaped_prompt}\n\nRelevant context:\n{context}" if context else escaped_prompt
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(full_system_prompt),
        HumanMessagePromptTemplate.from_template("{input}")
    ])
    client = ChatOpenAI(
        base_url=GITHUB_ENDPOINT,
        api_key=GITHUB_TOKEN,
        model=GITHUB_MODEL,
        temperature=1.0,
        top_p=1.0
    )
    chain = prompt | client | StrOutputParser()
    return await chain.ainvoke({"input": message})

# Generate streamed response
async def _generate_response_stream(message: str, context: str, history: RedisChatMessageHistory, role: str = "default") -> AsyncGenerator[str, None]:
    """Generate a streamed chatbot response chunk by chunk with history tracking."""
    chat_history = history.messages[-10:]
    # Load system prompt and fallback on missing role
    try:
        system_prompt = prompt_loader.load_prompts(role)
    except ValueError:
        logger.warning(f"Prompt for role '{role}' not found, falling back to default")
        system_prompt = prompt_loader.load_prompts('default')
    # Escape braces to avoid format string errors
    escaped_prompt = system_prompt.replace('{', '{{').replace('}', '}}')
    # Truncate context if too long
    if context and len(context) > 2000:
        logger.warning("Context too long, truncating ...")
        context = "...previous context truncated...\n" + context[-2000:]
    full_system_prompt = (
        f"{escaped_prompt}\n\nContext: {context}\nChat History: {chat_history}"
        if context else f"{escaped_prompt}\nChat History: {chat_history}"
    )
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(full_system_prompt),
        HumanMessagePromptTemplate.from_template("{input}")
    ])
    client = ChatOpenAI(
        base_url=GITHUB_ENDPOINT,
        api_key=GITHUB_TOKEN,
        model=GITHUB_MODEL,
        temperature=1.0,
        top_p=1.0,
        streaming=True
    )
    chain = prompt | client | StrOutputParser()
    async for chunk in chain.astream({"input": message}):
        yield chunk

# Log interaction to RabbitMQ
async def _log_interaction(user_id: str, user_input: str, bot_response: str):
    """Publish the chat interaction to RabbitMQ queue 'chat_history' for persistence."""
    try:
        connection = await get_rabbitmq_connection()
        channel = await connection.channel()
        await channel.declare_queue("chat_history", durable=True)
        message_data = {
            "user_id": user_id,
            "message": user_input,
            "response": bot_response,
            "timestamp": datetime.now().isoformat()
        }
        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(message_data).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key="chat_history"
        )
        logger.info(f"Interaction logged for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to log interaction: {e}")
