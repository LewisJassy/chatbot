from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chat_router import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (enable CORS universally)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
