from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import policies
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="V2I Core API", version="1.0.0")

# VULN-FIX: Restrict CORS to the configured frontend origin.
# allow_origins=["*"] with allow_credentials=True is a high-severity misconfiguration
# that lets any website make credentialed requests to this API.
ALLOWED_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(policies.router)

@app.get("/health")
async def health_check():
    return {"status": "up", "service": "core-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
