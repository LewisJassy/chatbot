#!/usr/bin/env python3
"""
RabbitMQ Monitoring Script for Chatbot System
This script monitors RabbitMQ queues and provides real-time insights.
"""

import asyncio
import aio_pika
import json
import time
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

class RabbitMQMonitor:
    def __init__(self):
        self.connection = None
        self.channel = None
        
    async def connect(self):
        """Connect to RabbitMQ"""
        try:
            self.connection = await aio_pika.connect_robust(RABBITMQ_URL)
            self.channel = await self.connection.channel()
            print("✅ Connected to RabbitMQ")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to RabbitMQ: {e}")
            return False
    
    async def get_queue_stats(self, queue_name="chat_history"):
        """Get detailed queue statistics"""
        try:
            queue = await self.channel.declare_queue(queue_name, durable=True)
            info = await queue.get_info()
            
            return {
                "queue_name": queue_name,
                "message_count": info.message_count,
                "consumer_count": info.consumer_count,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"❌ Error getting queue stats: {e}")
            return None
    
    async def monitor_queue(self, queue_name="chat_history", interval=5):
        """Monitor queue in real-time"""
        print(f"🔍 Monitoring queue '{queue_name}' every {interval} seconds...")
        print("Press Ctrl+C to stop")
        print("-" * 80)
        print(f"{'Time':<20} {'Messages':<10} {'Consumers':<10} {'Status':<15}")
        print("-" * 80)
        
        try:
            while True:
                stats = await self.get_queue_stats(queue_name)
                if stats:
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    status = "🟢 Active" if stats['consumer_count'] > 0 else "🔴 No Consumers"
                    
                    print(f"{timestamp:<20} {stats['message_count']:<10} {stats['consumer_count']:<10} {status:<15}")
                    
                    # Alert if messages are piling up
                    if stats['message_count'] > 10:
                        print(f"⚠️  WARNING: {stats['message_count']} messages in queue!")
                    
                    # Alert if no consumers
                    if stats['consumer_count'] == 0:
                        print("⚠️  WARNING: No consumers processing messages!")
                
                await asyncio.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped")
        except Exception as e:
            print(f"❌ Monitoring error: {e}")
    
    async def peek_messages(self, queue_name="chat_history", count=5):
        """Peek at messages in queue without consuming them"""
        print(f"👀 Peeking at last {count} messages in '{queue_name}'...")
        try:
            queue = await self.channel.declare_queue(queue_name, durable=True)
            
            messages_seen = 0
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    if messages_seen >= count:
                        break
                    
                    try:
                        data = json.loads(message.body.decode())
                        print(f"\n📝 Message {messages_seen + 1}:")
                        print(f"   User ID: {data.get('user_id', 'N/A')}")
                        print(f"   Message: {data.get('message', 'N/A')[:50]}...")
                        print(f"   Response: {data.get('response', 'N/A')[:50]}...")
                        print(f"   Timestamp: {data.get('timestamp', 'N/A')}")
                        messages_seen += 1
                        
                        # Don't acknowledge - just peek
                        await message.reject(requeue=True)
                        
                    except json.JSONDecodeError:
                        print(f"❌ Invalid JSON in message {messages_seen + 1}")
                        await message.reject(requeue=True)
                        messages_seen += 1
            
            if messages_seen == 0:
                print("📭 No messages in queue")
                
        except Exception as e:
            print(f"❌ Error peeking at messages: {e}")
    
    async def health_check(self):
        """Perform comprehensive health check"""
        print("🏥 RabbitMQ Health Check")
        print("=" * 40)
        
        # Connection test
        connected = await self.connect()
        if not connected:
            return False
        
        # Queue stats
        stats = await self.get_queue_stats()
        if stats:
            print(f"✅ Queue 'chat_history' is accessible")
            print(f"   Messages: {stats['message_count']}")
            print(f"   Consumers: {stats['consumer_count']}")
            
            # Health indicators
            if stats['consumer_count'] == 0:
                print("⚠️  No consumers - history service may be down")
            else:
                print("✅ Consumers are active")
            
            if stats['message_count'] > 100:
                print("⚠️  High message count - processing may be slow")
            elif stats['message_count'] > 0:
                print(f"ℹ️  {stats['message_count']} messages waiting")
            else:
                print("✅ Queue is empty - messages are being processed")
        
        return True
    
    async def test_end_to_end(self):
        """Test end-to-end message flow"""
        print("🔄 Testing End-to-End Message Flow...")
        
        # Send test message
        test_id = f"test_{int(time.time())}"
        test_data = {
            "user_id": test_id,
            "message": "Test message for monitoring",
            "response": "Test response from monitoring script",
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            queue = await self.channel.declare_queue("chat_history", durable=True)
            
            # Get initial count
            initial_stats = await self.get_queue_stats()
            initial_count = initial_stats['message_count'] if initial_stats else 0
            
            # Send message
            await self.channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(test_data).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                ),
                routing_key="chat_history"
            )
            print(f"✅ Test message sent (ID: {test_id})")
            
            # Check if message count increased
            await asyncio.sleep(1)
            final_stats = await self.get_queue_stats()
            final_count = final_stats['message_count'] if final_stats else 0
            
            if final_count > initial_count:
                print("✅ Message successfully queued")
            else:
                print("✅ Message was immediately processed")
            
            # Monitor for processing (wait up to 10 seconds)
            for i in range(10):
                await asyncio.sleep(1)
                current_stats = await self.get_queue_stats()
                current_count = current_stats['message_count'] if current_stats else 0
                
                if current_count <= initial_count:
                    print(f"✅ Message processed successfully ({i+1}s)")
                    break
            else:
                print("⚠️  Message not processed within 10 seconds")
                
        except Exception as e:
            print(f"❌ End-to-end test failed: {e}")
    
    async def close(self):
        """Close connection"""
        if self.connection:
            await self.connection.close()

async def main():
    """Main monitoring interface"""
    monitor = RabbitMQMonitor()
    
    print("🐰 RabbitMQ Monitor for Chatbot System")
    print("=" * 50)
    
    if not await monitor.connect():
        return
    
    while True:
        print("\nSelect an option:")
        print("1. Health Check")
        print("2. Monitor Queue (real-time)")
        print("3. Peek at Messages")
        print("4. Test End-to-End Flow")
        print("5. Exit")
        
        try:
            choice = input("\nEnter choice (1-5): ").strip()
            
            if choice == "1":
                await monitor.health_check()
            elif choice == "2":
                await monitor.monitor_queue()
            elif choice == "3":
                await monitor.peek_messages()
            elif choice == "4":
                await monitor.test_end_to_end()
            elif choice == "5":
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    await monitor.close()

if __name__ == "__main__":
    asyncio.run(main())
