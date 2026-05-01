import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader

from .routers import policies

load_dotenv()

app = FastAPI(
    title="V2I Core API",
    version="1.1.0",
    description="The secure backbone of the Vote 2 India platform."
)

API_KEY_NAME = "X-V2I-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


async def get_api_key(api_key_header: str = Security(api_key_header)):
    if os.getenv("API_KEY_REQUIRED", "false").lower() == "true":
        if api_key_header == os.getenv("V2I_API_KEY"):
            return api_key_header
        raise HTTPException(status_code=403, detail="Could not validate API Key")
    return api_key_header


# CORS Configuration
ALLOWED_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else ["*"],
    allow_credentials=True if ALLOWED_ORIGIN != "*" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(policies.router, dependencies=[Depends(get_api_key)])


@app.get("/health")
async def health_check():
    return {
        "status": "up",
        "service": "core-api",
        "version": "1.1.0",
        "mode": "production" if os.getenv("DEMO_MODE") != "true" else "demo"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
