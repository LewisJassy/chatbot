from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import aio_pika
import os
import logging
import json
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed
from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import AsyncGenerator
from models import ChatRequest, ChatResponse

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)
load_dotenv()

# Configuration
VECTOR_SERVICE_URL = os.getenv("VECTOR_SERVICE_URL", "http://localhost:82")
AUTH_URL = os.getenv("AUTH_URL", "http://127.0.0.1:8000")
MAX_CONTEXT_TOKENS = 4000
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

# GitHub AI Models Configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_ENDPOINT = "https://models.github.ai/inference"
GITHUB_MODEL = "openai/gpt-4.1"

# Connection pool for RabbitMQ
rabbitmq_connection_pool = None

async def get_rabbitmq_connection() -> aio_pika.RobustConnection:
    global rabbitmq_connection_pool
    if not rabbitmq_connection_pool:
        rabbitmq_connection_pool = await aio_pika.connect_robust(RABBITMQ_URL)
    print(rabbitmq_connection_pool)
    return rabbitmq_connection_pool

async def verify_token(token: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token_str = token.credentials
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                f"{AUTH_URL}/auth/status/",
                headers={"Authorization": f"Bearer {token_str}"}
            )
            if response.status_code != status.HTTP_200_OK:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token"
                )
            return response.json()
    except httpx.TimeoutException:
        logger.error("Token verification timeout")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token verification failed"
        )

@router.post("/chat", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    user_info: dict = Depends(verify_token)
):
    user_id = user_info.get("user", {}).get("id")
    
    try:
        # Get context from vector service
        vector_response = await _call_vector_service(request.message, request.role)
        context_str = _build_context(vector_response)
        
        # Generate response
        if request.stream:
            return StreamingResponse(
                _stream_generator(
                    message=request.message,
                    context=context_str,
                    user_id=user_id
                ),
                media_type="text/event-stream"
            )
        
        # Non-streaming response
        bot_response = await _generate_response(request.message, context_str)
        background_tasks.add_task(
            _log_interaction,
            user_id=user_id,
            user_input=request.message,
            bot_response=bot_response
        )
        
        return ChatResponse(
            user_message=request.message,
            bot_response=bot_response,
            role=request.role,
            timestamp=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat processing failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat processing failed"
        )

async def _stream_generator(message: str, context: str, user_id: str) -> AsyncGenerator[str, None]:
    full_response = []
    
    try:
        async for chunk in _generate_response_stream(message, context):
            full_response.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        
        # Log complete interaction after streaming finishes
        await _log_interaction(
            user_id=user_id,
            user_input=message,
            bot_response="".join(full_response)
        )
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(f"Streaming error: {str(e)}")
        yield f"data: {json.dumps({'error': 'Stream interrupted'})}\n\n"

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
async def _call_vector_service(query: str, role: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{VECTOR_SERVICE_URL}/similarity-search",
                json={"query": query, "role": role}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Vector service error: {e}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail="Vector service error"
        )

def _build_context(docs: list) -> str:
    context_messages = []
    current_tokens = 0
    for doc in docs:
        # Approximate token count (4 chars ≈ 1 token)
        content = doc.get("text", "")
        metadata = doc.get("metadata", {})
        
        msg_type = "User" if metadata.get("role") == "user" else "Assistant"
        message = f"{msg_type}: {content}"
        estimated_tokens = len(message) // 4
        
        if current_tokens + estimated_tokens > (MAX_CONTEXT_TOKENS - 200):
            break
            
        context_messages.append(message)
        current_tokens += estimated_tokens
        
    return "\n".join(context_messages) if context_messages else "No relevant history found"

async def _generate_response(message: str, context: str) -> str:
    system_prompt = f"Relevant history:\n{context}\n\nCurrent conversation:"
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt),
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

async def _generate_response_stream(message: str, context: str) -> AsyncGenerator[str, None]:
    system_prompt = f"Relevant history:\n{context}\n\nCurrent conversation:"
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt),
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

async def _log_interaction(user_id: str, user_input: str, bot_response: str):
    try:
        connection = await get_rabbitmq_connection()
        channel = await connection.channel()
        
        # Declare queue to ensure it exists
        await channel.declare_queue("chat_history", durable=True)
        
        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps({
                    "user_id": user_id,
                    "message": user_input,
                    "response": bot_response,
                    "timestamp": datetime.now().isoformat()
                }).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT  # Make message persistent
            ),
            routing_key="chat_history"
        )
        logger.info(f"Logged interaction for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to log interaction: {str(e)}")