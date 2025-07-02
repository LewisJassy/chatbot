from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chat_router import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://chatbot-gilt-tau.vercel.app",
        "https://chatbot-liart-nine-45.vercel.app",
        "https://vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
