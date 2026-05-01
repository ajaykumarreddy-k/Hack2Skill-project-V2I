import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def get_db():
    """
    Get a PostgreSQL database connection.
    
    Yields:
        asyncpg.Connection: Async PostgreSQL connection instance
    """
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()
