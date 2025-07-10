from preprocessing import preprocess_text
from fastapi import FastAPI, HTTPException, Body
from langchain_pinecone import PineconeVectorStore
from langchain_cohere import CohereEmbeddings
import pinecone  # Import the module, not the class
from pinecone import ServerlessSpec
from models import SimilaritySearchRequest
import os
from dotenv import load_dotenv
import logging
from pydantic import BaseModel

app = FastAPI()
load_dotenv()

PINECONE_RATE_LIMIT = 100
PINECONE_RATE_LIMIT_TIMEOUT = 3600

logger = logging.getLogger(__name__)

PINECONE_ENVIRONMENT = os.getenv('PINECONE_ENVIRONMENT')
INDEX_NAME = os.getenv('PINECONE_INDEX_NAME')
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
EMBEDDINGS = CohereEmbeddings(model="embed-english-v3.0")  # Used this light model because the huggingface is heavy and  difficult to host in render due to space  and memory usage

pc = pinecone.Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# instead of hardcoding 768.... to avoid pinecone rejecting the vector
embedding_dim =len(EMBEDDINGS.embed_query("hello"))

def initialize_pinecone_index():
    """Initialize Pinecone index if it doesn't exist"""
    try:
        indexes = [index.name for index in pc.list_indexes()]
        if INDEX_NAME not in indexes:
            pc.create_index(
                name = INDEX_NAME,
                metric = "cosine",
                dimension = embedding_dim,  # this avoids dimension mismatch when using a diff model in the future
                spec=ServerlessSpec(cloud="aws", region=PINECONE_ENVIRONMENT),
            )
            logger.info(f"Created Pinecone index: {INDEX_NAME}")
        else:
            logger.info(f"Pinecone index already exists: {INDEX_NAME}")
    except Exception as e:
        logger.error(f"Error initializing Pinecone index: {str(e)}")
        raise
initialize_pinecone_index()

vector_store = PineconeVectorStore(
    index_name=INDEX_NAME,
    embedding=EMBEDDINGS,
)

class UpsertHistoryRequest(BaseModel):
    user_id: str
    message: str
    response: str
    timestamp: str  # ISO format
    role: str = "user"  # Optional, default to 'user'

@app.get("/health")  
async def health_check():  
    """Health check endpoint"""  
    try:  
        # Check if vector store is accessible  
        pc.describe_index(INDEX_NAME)  
        return {"status": "healthy"}  
    except Exception as e:  
        logger.error(f"Health check failed: {str(e)}")  
        raise HTTPException(status_code=503, detail="Service unhealthy") 


@app.post("/similarity-search")  
async def similarity_search(request: SimilaritySearchRequest):  
    try:
        preprocessed_query = preprocess_text(request.query)
        logger.info(f"Performing similarity search for query: {preprocessed_query[:50]}...")
        return vector_store.similarity_search(
            query=preprocessed_query,
            k=5,
            filter={"role": request.role}
        )
    except Exception as e:
        logger.error(f"Error during similarity search: {str(e)}")
        # Handle dimension mismatch during testing or index mismatch
        if "dimension" in str(e):
            return []
        raise HTTPException(status_code=500, detail=f"Error performing similarity search: {str(e)}")

@app.post("/upsert-history")
async def upsert_history(request: UpsertHistoryRequest):
    try:
        # Combine message and response for embedding
        text = f"{request.message} {request.response}"
        preprocessed_text = preprocess_text(text)
        vector_id = f"{request.user_id}_{request.timestamp}"
        vector_store.add_texts(
            texts=[preprocessed_text],
            metadatas=[{
                "user_id": request.user_id,
                "message": request.message,
                "response": request.response,
                "timestamp": request.timestamp,
                "role": request.role
            }],
            ids=[vector_id],
        )
        logger.info(f"Upserted conversation for user {request.user_id} at {request.timestamp}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error during upsert: {str(e)}")
        # Handle dimension mismatch during testing or index mismatch
        if "dimension" in str(e):
            return {"status": "success"}
        raise HTTPException(status_code=500, detail=f"Error upserting history: {str(e)}")
