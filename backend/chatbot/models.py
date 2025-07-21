from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    role: str = "default"
    stream: bool = True

class ChatResponse(BaseModel):
    user_message: str
    bot_response: str
    role: str
    timestamp: str