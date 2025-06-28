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
import httpx

load_dotenv()


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
    "database": os.getenv("POSTGRES_DB", "chat_history"),
}

VECTOR_SERVICES_URL = os.getenv(
    "VECTOR_SERVICES_URL", "http://localhost:82/upsert-history"
)


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
    connection_pool = await asyncpg.create_pool(min_size=1, max_size=10, **DB_CONFIG)
    logger.info("Database connection pool established")

    # Create table if it doesn't exist
    async with connection_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                response TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);"
        )
    logger.info("Database table and indexes ensured")

    # Start RabbitMQ consumer in background - FIXED: use asyncio.create_task
    consumer_task = asyncio.create_task(consume_messages())

    yield

    # Cleanup
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
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
                history.timestamp,
            )
        logger.info(f"Saved history for user {history.user_id}")
        # Upsert to vector DB
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "user_id": history.user_id,
                    "message": history.message,
                    "response": history.response,
                    "timestamp": history.timestamp.isoformat(),
                    "role": "user",
                }
                resp = await client.post(VECTOR_SERVICES_URL, json=payload, timeout=10)
                resp.raise_for_status()
                logger.info(f"Upserted history to vector DB for user {history.user_id}")
        except Exception as e:
            logger.error(f"Failed to upsert to vector DB: {e}")
    except asyncpg.PostgresError as e:
        logger.error(f"Database error saving history: {str(e)}")
        raise


# RabbitMQ Consumer
async def consume_messages():
    shutdown_event = asyncio.Event()

    async def shutdown_handler():
        shutdown_event.set()

    app.state.shutdown_handlers = (
        app.state.shutdown_handlers if hasattr(app.state, "shutdown_handlers") else []
    )
    app.state.shutdown_handlers.append(shutdown_handler)

    while not shutdown_event.is_set():
        try:
            connection = await aio_pika.connect_robust(
                os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
            )
            channel = await connection.channel()
            queue = await channel.declare_queue("chat_history", durable=True)
            logger.info("Connected to RabbitMQ and declared queue")

            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    if shutdown_event.is_set():
                        break

                    try:
                        # Use process() context manager which handles ack/nack automatically
                        async with message.process():
                            data = json.loads(message.body.decode())
                            history = ChatHistoryCreate(
                                user_id=data["user_id"],
                                message=data["message"],
                                response=data["response"],
                                timestamp=datetime.fromisoformat(data["timestamp"]),
                            )
                            await save_history(history)
                            logger.info(
                                f"Successfully processed message for user {data['user_id']}"
                            )

                    except json.JSONDecodeError as e:
                        logger.error(
                            f"Invalid JSON in message: {message.body.decode()}"
                        )
                        logger.error(f"JSONDecodeError: {e}")
                        raise
                    except KeyError as e:
                        logger.error(f"Missing required field in message: {e}")
                        logger.error(f"Full message body: {message.body.decode()}")
                        raise
                    except Exception as e:
                        logger.error(f"Error processing message: {str(e)}")
                        logger.error(f"Full message body: {message.body.decode()}")
                        raise

        except Exception as e:
            logger.error(f"RabbitMQ connection error: {str(e)}")
            await asyncio.sleep(5)


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
            user_id,
        )
        return [dict(row) for row in rows]
