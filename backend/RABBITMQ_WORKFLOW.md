# RabbitMQ Workflow in Your Chatbot System

## 🔄 Complete Message Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│    User     │───▶│ Chat Service │───▶│  RabbitMQ   │───▶│History Service│───▶│ PostgreSQL  │
│  (Frontend) │    │ (Port 8001)  │    │   Queue     │    │ (Port 8003)   │    │  Database   │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘    └─────────────┘
```

## 📝 Step-by-Step Process

### 1. User Interaction
- User types message in frontend
- Frontend sends POST request to `/chat` endpoint
- Auth token is verified

### 2. Chat Processing
- Vector service provides context
- LangChain + OpenAI generates response
- Response is returned to user immediately

### 3. Background Logging (RabbitMQ)
```python
# This happens asynchronously after user gets response
await _log_interaction(
    user_id=user_id,
    user_input=request.message,
    bot_response=bot_response
)
```

### 4. Message Publishing
- Chat service connects to RabbitMQ
- Creates JSON message with chat data
- Publishes to "chat_history" queue
- Message is persistent (survives RabbitMQ restarts)

### 5. Message Consumption
- History service has background consumer running
- Listens to "chat_history" queue continuously
- When message arrives:
  - Parses JSON
  - Validates data
  - Saves to PostgreSQL
  - Acknowledges message (removes from queue)

## 🚀 How to Test Your Setup

### Prerequisites
1. Make sure RabbitMQ is running on localhost:5672
2. Make sure PostgreSQL is running with chat_history database
3. Both services (chat and history) should be running

### Step 1: Run Basic Tests
```bash
cd e:\Desktop\chatbot\backend
python test_rabbitmq.py
```

This will test:
- ✅ RabbitMQ connection
- ✅ Queue operations
- ✅ Message sending
- ✅ Message flow simulation

### Step 2: Monitor in Real-Time
```bash
python monitor_rabbitmq.py
```

Choose option 2 to see real-time queue monitoring:
- Message count
- Consumer count
- Processing speed

### Step 3: Test End-to-End
1. Start both services:
   ```bash
   # Terminal 1: Start chat service
   cd chatbot
   python -m uvicorn main:app --host 0.0.0.0 --port 8001

   # Terminal 2: Start history service
   cd chatbot_history
   python -m uvicorn user_history:app --host 0.0.0.0 --port 8003
   ```

2. Send a chat message through your frontend or API
3. Check if message appears in database:
   ```sql
   SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT 5;
   ```

## 🔍 How to Verify Everything is Working

### 1. Check RabbitMQ Management UI
- Go to http://localhost:15672 (if management plugin enabled)
- Login: guest/guest
- Look for "chat_history" queue
- Should show consumers connected

### 2. Check Application Logs
**Chat Service logs should show:**
```
INFO: Logged interaction for user {user_id}
```

**History Service logs should show:**
```
INFO: Saved history for user {user_id}
```

### 3. Check Database
```sql
-- Count total messages
SELECT COUNT(*) FROM chat_history;

-- Check recent messages
SELECT user_id, message, timestamp 
FROM chat_history 
ORDER BY timestamp DESC 
LIMIT 10;
```

### 4. Monitor Queue Health
Use the monitoring script to check:
- ✅ Messages are being processed (count decreases)
- ✅ Consumers are active (consumer_count > 0)
- ✅ No messages piling up

## 🛠️ Troubleshooting

### Problem: Messages not being processed
**Symptoms:** Queue message count keeps increasing
**Solutions:**
1. Check history service is running
2. Check database connection
3. Check for errors in history service logs

### Problem: No messages in queue
**Symptoms:** Queue always shows 0 messages
**Solutions:**
1. Check chat service is publishing messages
2. Check RabbitMQ connection in chat service
3. Verify _log_interaction is being called

### Problem: Connection errors
**Symptoms:** "RabbitMQ connection error" in logs
**Solutions:**
1. Ensure RabbitMQ server is running
2. Check RABBITMQ_URL in .env files
3. Verify port 5672 is accessible

## 🎯 Key Benefits

1. **Async Processing**: Users get chat responses immediately
2. **Reliability**: Messages won't be lost if history service is down
3. **Scalability**: Can add multiple history service instances
4. **Monitoring**: Easy to track message processing
5. **Error Handling**: Failed messages can be retried

## 📊 Performance Monitoring

### Good Indicators:
- ✅ Queue message count: 0-5 (messages processed quickly)
- ✅ Consumer count: 1+ (history service connected)
- ✅ Database writes: Consistent with chat volume

### Warning Signs:
- ⚠️ Queue message count: >50 (processing bottleneck)
- ⚠️ Consumer count: 0 (history service down)
- ⚠️ Growing queue without consumers (immediate attention needed)

## 🔧 Configuration Tips

### For High Volume:
- Increase history service instances
- Use multiple consumers
- Optimize database queries
- Monitor queue size

### For Development:
- Use non-persistent messages for testing
- Enable RabbitMQ management UI
- Add more detailed logging
- Use shorter queue names for easier debugging
