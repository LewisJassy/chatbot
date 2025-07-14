from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chat_router import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chatbot-liart-nine-45.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/ping")
def ping():
    return {"message" : "pong" }
