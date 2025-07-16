from pydantic import BaseModel

class SimilaritySearchRequest(BaseModel):
    query: str
    role: str

class UpsertHistoryRequest(BaseModel):
    user_id: str
    message: str
    response: str
    timestamp: str  # ISO format
    role: str = "user"  # Optional, default to 'user'
