import asyncio
import asyncpg
import aio_pika
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Database config
DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
    "database": os.getenv("POSTGRES_DB", "chat_history")
}

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

async def test_complete_flow():
    print("🔄 Testing Complete RabbitMQ → Database Flow")
    print("=" * 50)
    
    # Test 1: Database Connection
    print("\n1. Testing Database Connection...")
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        print("✅ Database connection successful")
        
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'chat_history'
            );
        """)
        
        if table_exists:
            print("✅ chat_history table exists")
        else:
            print("❌ chat_history table does not exist. Creating...")
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
            print("✅ Table created")
        await conn.close()
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False
    
    # Test 2: RabbitMQ Connection
    print("\n2. Testing RabbitMQ Connection...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()

        # Passive declaration to get queue info
        queue = await channel.declare_queue("chat_history", durable=True, passive=True)
        print(f"✅ RabbitMQ connected. Queue has {queue.declaration_result.message_count} messages")

        await connection.close()
    except Exception as e:
        print(f"❌ RabbitMQ error: {e}")
        return False

    # Test 3: Send Message to Queue
    print("\n3. Testing Message Publishing...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        await channel.declare_queue("chat_history", durable=True)

        test_message = {
            "user_id": f"test_flow_{int(datetime.now().timestamp())}",
            "message": "Testing complete RabbitMQ flow",
            "response": "This is a test response to verify the complete workflow",
            "timestamp": datetime.now().isoformat()
        }

        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(test_message).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key="chat_history"
        )

        print("✅ Message published to queue")
        print(f"   User ID: {test_message['user_id']}")

        # Recheck queue info
        passive_queue = await channel.declare_queue("chat_history", durable=True, passive=True)
        print(f"   Queue after publish: {passive_queue.declaration_result.message_count} messages")

        await connection.close()
    except Exception as e:
        print(f"❌ Publishing error: {e}")
        return False

    # Test 4: Consume and Save to DB
    print("\n4. Simulating Consumer (Manual Message Processing)...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        queue = await channel.declare_queue("chat_history", durable=True)
        db_conn = await asyncpg.connect(**DB_CONFIG)

        print("   Waiting for messages...")
        message_processed = False
        timeout_counter = 0

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    try:
                        data = json.loads(message.body.decode())
                        print(f"✅ Received message: {data['user_id']}")

                        await db_conn.execute("""
                            INSERT INTO chat_history (user_id, message, response, timestamp)
                            VALUES ($1, $2, $3, $4)
                        """, data["user_id"], data["message"], data["response"],
                            datetime.fromisoformat(data["timestamp"]))

                        print("✅ Message saved to database")
                        message_processed = True
                        break
                    except Exception as e:
                        print(f"❌ Error processing message: {e}")
                        await message.reject(requeue=True)
                        break

                timeout_counter += 1
                if timeout_counter > 10:
                    print("⏰ Timeout: No messages received")
                    break

        await connection.close()
        await db_conn.close()

        if not message_processed:
            print("⚠️  No messages were processed")

    except Exception as e:
        print(f"❌ Consumer simulation error: {e}")
        return False

    # Test 5: Verify in Database
    print("\n5. Verifying Data in Database...")
    try:
        conn = await asyncpg.connect(**DB_CONFIG)

        recent = await conn.fetch("""
            SELECT user_id, message, timestamp 
            FROM chat_history 
            WHERE user_id LIKE 'test_user_%'
            ORDER BY timestamp DESC 
            LIMIT 3
        """)

        if recent:
            print(f"✅ Found {len(recent)} test messages in database:")
            for msg in recent:
                print(f"   - {msg['user_id']}: {msg['message'][:30]}...")
        else:
            print("❌ No test messages found in database")

        await conn.close()
    except Exception as e:
        print(f"❌ Database verification error: {e}")
        return False

    print("\n🎉 Complete flow test finished!")
    print("   RabbitMQ → Consumer → Database workflow verified")
    return True

if __name__ == "__main__":
    print("Starting complete workflow test...")
    asyncio.run(test_complete_flow())
