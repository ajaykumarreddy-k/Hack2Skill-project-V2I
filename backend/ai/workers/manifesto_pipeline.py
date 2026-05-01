import json
import os
from urllib.parse import urlparse

import asyncpg
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader
from openai import AsyncOpenAI

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# VULN-FIX: SSRF protection — only allow GCS or HTTPS URLs from trusted buckets.
# Without this, an attacker could pass file:///etc/passwd or http://169.254.169.254
# (AWS metadata endpoint) and PyMuPDFLoader would happily read it.
TRUSTED_BUCKET = os.getenv("STORAGE_BUCKET", "v2i-manifestos")
ALLOWED_SCHEMES = {"gs", "https"}


def validate_manifest_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        return False
    # For https links, ensure they point to our storage bucket only
    if parsed.scheme == "https" and TRUSTED_BUCKET not in parsed.netloc:
        return False
    return True


CLASSIFY_PROMPT = '''
Analyze this excerpt from an Indian political manifesto.
Return JSON: {{ "category": one of [economy|healthcare|education|environment|
  governance|agriculture|defense],
  "stance": "plain English summary max 20 words",
  "stance_score": float 0.0-1.0 (0=conservative, 1=progressive),
  "confidence": float 0.0-1.0 }}
Excerpt: {text}
'''


async def process_manifesto(gcs_url: str, party_id: str):
    # VULN-FIX: Validate URL before passing to file loader (SSRF guard)
    if not validate_manifest_url(gcs_url):
        raise ValueError(f"Untrusted URL blocked by SSRF guard: {gcs_url}")

    loader = PyMuPDFLoader(gcs_url)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
    chunks = splitter.split_documents(docs)

    results = []
    for chunk in chunks:
        resp = await client.chat.completions.create(
            model='gpt-4o',
            messages=[{'role': 'user', 'content': CLASSIFY_PROMPT.format(text=chunk.page_content)}],
            response_format={'type': 'json_object'}
        )
        data = json.loads(resp.choices[0].message.content)
        if data['confidence'] > 0.7:  # Only store high-confidence extractions
            results.append({'party_id': party_id, **data})

    await upsert_policies(results)  # Deduplicate by category
    return {'processed_chunks': len(chunks), 'stored_policies': len(results)}


async def upsert_policies(policies):
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    try:
        for p in policies:
            await conn.execute(
                '''INSERT INTO policies (party_id, category, title, stance, stance_score,
                   confidence_score)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (party_id, category) DO UPDATE SET
                   stance = EXCLUDED.stance,
                   stance_score = EXCLUDED.stance_score,
                   confidence_score = EXCLUDED.confidence_score''',
                p['party_id'], p['category'], p['category'].capitalize(),
                p['stance'], p['stance_score'], p['confidence']
            )
    finally:
        await conn.close()
