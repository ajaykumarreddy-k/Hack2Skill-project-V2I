import os

import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

async def get_cache():
    """
    Get a Redis cache connection.
    
    Yields:
        redis.Redis: Async Redis client instance
    """
    r = redis.from_url(REDIS_URL, decode_responses=True)
    try:
        yield r
    finally:
        await r.aclose()
        # await r.close() # redis-py 5.0+ uses aclose for async
