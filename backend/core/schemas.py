from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class PolicyMatrixRequest(BaseModel):
    category: Optional[str] = None
    party_ids: Optional[List[str]] = None
    lang: str = "en"

class AlignmentRequest(BaseModel):
    weights: Dict[str, int] = Field(..., example={"healthcare": 5, "education": 4})

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
