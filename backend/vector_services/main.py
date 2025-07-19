from fastapi import FastAPI
from dotenv import load_dotenv
import redis
from redis import Redis
import os
from fastapi import Depends
from redis.commands.search.field import VectorField, TextField, TagField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query
import cohere
import logging
import numpy as np
from preprocessing import preprocess_text
from models import UpsertHistoryRequest, SimilaritySearchRequest
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)
load_dotenv()
REDIS_URL = os.getenv("REDIS_URL")
INDEX_NAME = "Chatbot_Index"
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
co = cohere.ClientV2(COHERE_API_KEY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_index(redis_client)
    yield

app = FastAPI(lifespan=lifespan)

# Set embedding dimension from environment or use default
embedding_dim = int(os.getenv("DEFAULT_EMBED_DIM", 768))



pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=False)
redis_client = Redis(connection_pool=pool)

try:
    default_dim = int(os.getenv("DEFAULT_EMBED_DIM", 768))
except Exception as e:
    logger.warning(f"Could not determine embedding dimension from Cohere: {e}. Falling back to default embedding dimension: 768")
    default_dim = 768
embedding_dim = default_dim


def create_index(r: Redis):
    try:
        r.ft(INDEX_NAME).info()
    except:
        schema = [
            TextField("user_id"),
            TextField("message"),
            TextField("response"),
            TextField("timestamp"),
            TagField("role"),
            VectorField(
                "embedding", "HNSW", {
                    "TYPE": "FLOAT32",
                    "DIM": embedding_dim,  # same as your Cohere dims
                    "DISTANCE_METRIC": "COSINE"
                }
            )
        ]
        r.ft(INDEX_NAME).create_index(
            fields=schema,
            definition=IndexDefinition(prefix=["doc:"], index_type=IndexType.HASH)
        )

@app.post("/upsert-history")
async def upsert_history(request: UpsertHistoryRequest):
    text = f"{request.message} {request.response}"
    preprocessed_text = preprocess_text(text)
    embed_response = co.embed(texts=[preprocessed_text], model="embed-english-v3.0", input_type="search_document")

    vector = embed_response.embeddings.embeddings[0]
    vector_bytes = np.array(vector, dtype=np.float32).tobytes()
    
    key = f"doc:{request.user_id}_{request.timestamp}"
    redis_client.hset(key, mapping={
        "user_id": request.user_id,
        "message": request.message,
        "response": request.response,
        "timestamp": request.timestamp,
        "role": request.role,
        "embedding": vector_bytes
    })

    return {"status": "success"}

@app.post("/similarity-search")
async def similarity_search(request: SimilaritySearchRequest):
    preprocessed_query = preprocess_text(request.query)
    embed_response = co.embed(texts=[preprocessed_query], model="embed-english-v3.0", input_type="search_document")
    query_vector = np.array(embed_response.embeddings[0], dtype=np.float32).tobytes()
    base_query = f'@role:{{{request.role}}}=>[KNN 5 @embedding $embedding]'
    redis_query = Query(base_query).paging(0, 5).dialect(2).return_fields("user_id", "message", "response", "timestamp", "role", "__embedding_score")

    results = redis_client.ft(INDEX_NAME).search(redis_query, query_params={
        "embedding": query_vector
    })

    return [
        {
            "message": getattr(r, "message", r.get("message", None)),
            "response": getattr(r, "response", r.get("response", None)),
            "user_id": getattr(r, "user_id", r.get("user_id", None))
        }
        for r in results.docs
    ]

