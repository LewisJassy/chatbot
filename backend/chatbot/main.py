from fastapi import FastAPI
from chat_router import router

app = FastAPI()

app.include_router(router, prefix="/api")
