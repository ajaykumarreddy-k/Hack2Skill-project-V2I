from openai import AsyncOpenAI
import json
import os
import asyncpg
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SUPPORTED_LANGS = ['hi','bn','te','mr','ta','gu','kn','ml','pa','or','ur']

async def translate_policy(policy_id: str, lang: str):
    if lang not in SUPPORTED_LANGS:
        return None

    cache_key = f'trans:{policy_id}:{lang}'
    r = redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)
    
    cached = await r.get(cache_key)
    if cached:
        await r.aclose()
        return json.loads(cached)

    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    try:
        policy = await conn.fetchrow('SELECT title, stance FROM policies WHERE id=$1', policy_id)
        if not policy:
            return None

        resp = await client.chat.completions.create(
            model='gpt-4o',
            messages=[{
                'role': 'user',
                'content': f'Translate to {lang} (keep political terms accurate): title: {policy["title"]}; stance: {policy["stance"]}. Return JSON with "title" and "stance" fields.'
            }],
            response_format={'type':'json_object'}
        )
        result = json.loads(resp.choices[0].message.content)

        # Cache and persist
        await r.set(cache_key, json.dumps(result), ex=3600)
        await conn.execute(
            '''INSERT INTO translations (entity_type, entity_id, lang_code, field, value)
               VALUES ($1, $2, $3, $4, $5) 
               ON CONFLICT (entity_type, entity_id, lang_code, field) DO UPDATE SET value=$5''',
            'policy', policy_id, lang, 'stance', result['stance']
        )
        return result
    finally:
        await conn.close()
        await r.aclose()
