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


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
    "database": os.getenv("POSTGRES_DB", "chat_history")
}

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
    try:
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
    except asyncpg.PostgresError as e:
        logger.error(f"Database error saving history: {str(e)}")
        raise
# RabbitMQ Consumer
async def consume_messages():
    shutdown_event = asyncio.Event()
    
    async def shutdown_handler():
        shutdown_event.set()
    
    app.state.shutdown_handlers = app.state.shutdown_handlers if hasattr(app.state, "shutdown_handlers") else []
    app.state.shutdown_handlers.append(shutdown_handler)
    while not shutdown_event.is_set():
        try:
            connection = await aio_pika.connect_robust(
                os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
            )
            channel = await connection.channel()
            queue = await channel.declare_queue("chat_history", durable=True)

            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    if shutdown_event.is_set():
                        break
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
                            # Only acknowledge after successful processing
                            await message.ack()
                        except json.JSONDecodeError:
                            logger.error(f"Invalid JSON in message: {message.body.decode()}")
                            # Reject the message as it cannot be processed
                            await message.reject(requeue=False)
                        except KeyError as e:
                            logger.error(f"Missing required field in message: {e}")
                            # Reject the message as it is malformed
                            await message.reject(requeue=False)
                        except Exception as e:
                            logger.error(f"Error processing message: {str(e)}")
                            # Requeue the message for retry
                            await message.reject(requeue=True)
                    

        except Exception as e:
            logger.error(f"RabbitMQ connection error: {str(e)}")
            await asyncio.sleep(5)  # Wait before reconnecting

@app.get("/history/{user_id}")  
async def get_user_history(user_id: str):  
    async with connection_pool.acquire() as conn:  
        rows = await conn.fetch(  
            """  
            SELECT user_id, message, response, timestamp 
            FROM chat_history 
            WHERE user_id = $1  
            ORDER BY timestamp DESC  
            LIMIT 50  
            """,  
            user_id  
        )  
        return [dict(row) for row in rows]
