from pydantic import BaseModel

class SimilaritySearchRequest(BaseModel):
    query: str
    role: str