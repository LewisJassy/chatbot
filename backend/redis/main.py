import os
import redis
from flask import Flask

app = Flask(__name__)

redis_client = redis.Redis(
    host='localhost',
    port='6379',
    db=0,
    decode_responses=True
)

