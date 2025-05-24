#!/usr/bin/env python3
"""
RabbitMQ Testing Script for Chatbot System
This script helps you verify that RabbitMQ is working correctly.
"""

import asyncio
import aio_pika
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

async def test_rabbitmq_connection():
    """Test basic RabbitMQ connection"""
    print("🔍 Testing RabbitMQ Connection...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        print("✅ RabbitMQ connection successful!")
        
        channel = await connection.channel()
        print("✅ Channel created successfully!")
        
        await connection.close()
        return True
    except Exception as e:
        print(f"❌ RabbitMQ connection failed: {e}")
        return False

async def test_queue_operations():
    """Test queue creation and basic operations"""
    print("\n🔍 Testing Queue Operations...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        
        # Declare the same queue used by your app
        queue = await channel.declare_queue("chat_history", durable=True)
        print("✅ Queue 'chat_history' declared successfully!")
        
        # Get queue info
        queue_info = await queue.get_info()
        print(f"📊 Queue info: {queue_info.message_count} messages, {queue_info.consumer_count} consumers")
        
        await connection.close()
        return True
    except Exception as e:
        print(f"❌ Queue operations failed: {e}")
        return False

async def send_test_message():
    """Send a test message to the chat_history queue"""
    print("\n🔍 Sending Test Message...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        
        # Declare queue to ensure it exists
        queue = await channel.declare_queue("chat_history", durable=True)
        
        test_data = {
            "user_id": "test_user_123",
            "message": "Hello, this is a test message",
            "response": "This is a test response from the bot",
            "timestamp": datetime.now().isoformat()
        }
        
        # Publish message (same way as your chat service does)
        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(test_data).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT  # Make message persistent
            ),
            routing_key="chat_history"
        )
        
        print("✅ Test message sent successfully!")
        print(f"📝 Message content: {test_data}")
        
        await connection.close()
        return True
    except Exception as e:
        print(f"❌ Failed to send test message: {e}")
        return False

async def consume_test_messages(timeout=10):
    """Consume messages from the queue to verify they're being processed"""
    print(f"\n🔍 Consuming Messages (timeout: {timeout}s)...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        queue = await channel.declare_queue("chat_history", durable=True)
        
        messages_received = 0
        start_time = time.time()
        
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                if time.time() - start_time > timeout:
                    break
                    
                async with message.process():
                    try:
                        data = json.loads(message.body.decode())
                        print(f"✅ Received message: {data}")
                        messages_received += 1
                        # Don't acknowledge here - let your actual consumer handle it
                        break  # Exit after first message for testing
                    except json.JSONDecodeError as e:
                        print(f"❌ Invalid JSON: {e}")
        
        print(f"📊 Received {messages_received} messages")
        await connection.close()
        return messages_received > 0
    except Exception as e:
        print(f"❌ Failed to consume messages: {e}")
        return False

async def check_queue_status():
    """Check current queue status"""
    print("\n🔍 Checking Queue Status...")
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        queue = await channel.declare_queue("chat_history", durable=True)
        
        # Get queue information
        info = await queue.get_info()
        print(f"📊 Queue 'chat_history' status:")
        print(f"   - Messages: {info.message_count}")
        print(f"   - Consumers: {info.consumer_count}")
        
        await connection.close()
        return True
    except Exception as e:
        print(f"❌ Failed to check queue status: {e}")
        return False

async def simulate_chat_interaction():
    """Simulate a complete chat interaction"""
    print("\n🔍 Simulating Complete Chat Interaction...")
    
    # This simulates what happens in your chat_router.py
    user_id = "test_user_456"
    user_message = "What is artificial intelligence?"
    bot_response = "Artificial intelligence (AI) is a branch of computer science..."
    
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        
        # Ensure queue exists
        await channel.declare_queue("chat_history", durable=True)
        
        # Send message exactly like your _log_interaction function
        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps({
                    "user_id": user_id,
                    "message": user_message,
                    "response": bot_response,
                    "timestamp": datetime.now().isoformat()
                }).encode()
            ),
            routing_key="chat_history"
        )
        
        print("✅ Chat interaction logged to RabbitMQ!")
        print(f"   - User: {user_id}")
        print(f"   - Message: {user_message}")
        print(f"   - Response: {bot_response[:50]}...")
        
        await connection.close()
        return True
    except Exception as e:
        print(f"❌ Failed to simulate chat interaction: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 RabbitMQ Testing Suite for Chatbot System")
    print("=" * 50)
    
    tests = [
        ("Connection Test", test_rabbitmq_connection),
        ("Queue Operations", test_queue_operations),
        ("Queue Status Check", check_queue_status),
        ("Send Test Message", send_test_message),
        ("Chat Interaction Simulation", simulate_chat_interaction),
        ("Queue Status After Tests", check_queue_status),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        result = await test_func()
        results.append((test_name, result))
        
        if not result:
            print(f"❌ {test_name} FAILED - Check RabbitMQ setup")
        
        await asyncio.sleep(1)  # Brief pause between tests
    
    # Summary
    print(f"\n{'='*50}")
    print("📋 TEST SUMMARY:")
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} - {test_name}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! RabbitMQ is working correctly.")
    else:
        print("⚠️  Some tests failed. Check your RabbitMQ setup.")

if __name__ == "__main__":
    print("Starting RabbitMQ tests...")
    asyncio.run(main())
