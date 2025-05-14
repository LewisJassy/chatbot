from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import aio_pika
import asyncio
import asyncpg
import json
import logging
from datetime import datetime
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
    "database": os.getenv("POSTGRES_DB", "chat_history")
}

# Models
class ChatHistoryCreate(BaseModel):
    user_id: str
    message: str
    response: str
    timestamp: datetime

# Database connection pool
connection_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global connection_pool
    # Initialize DB connection pool
    connection_pool = await asyncpg.create_pool(
        min_size=1,
        max_size=10,
        **DB_CONFIG
    )
    logger.info("Database connection pool established")
    
    # Start RabbitMQ consumer in background
    background_tasks = BackgroundTasks()
    background_tasks.add_task(consume_messages)
    
    yield
    
    # Cleanup
    await connection_pool.close()
    logger.info("Database connection pool closed")

app = FastAPI(lifespan=lifespan)

# Database operations
async def save_history(history: ChatHistoryCreate):
    async with connection_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO chat_history (user_id, message, response, timestamp)
            VALUES ($1, $2, $3, $4)
            """,
            history.user_id,
            history.message,
            history.response,
            history.timestamp
        )
    logger.info(f"Saved history for user {history.user_id}")

# RabbitMQ Consumer
async def consume_messages():
    while True:
        try:
            connection = await aio_pika.connect_robust(
                os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
            )
            channel = await connection.channel()
            queue = await channel.declare_queue("chat_history", durable=True)
            
            logger.info("History consumer started")
            
            async for message in queue:
                async with message.process():
                    try:
                        data = json.loads(message.body.decode())
                        history = ChatHistoryCreate(
                            user_id=data["user_id"],
                            message=data["message"],
                            response=data["response"],
                            timestamp=datetime.fromisoformat(data["timestamp"])
                        )
                        await save_history(history)
                    except Exception as e:
                        logger.error(f"Error processing message: {str(e)}")
                        
        except Exception as e:
            logger.error(f"RabbitMQ connection error: {str(e)}")
            await asyncio.sleep(5)  # Wait before reconnecting