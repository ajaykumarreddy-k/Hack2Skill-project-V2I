from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class PolicyMatrixRequest(BaseModel):
    """Schema for policy comparison matrix requests."""
    category: Optional[str] = None
    party_ids: Optional[List[str]] = None
    lang: str = "en"


class AlignmentRequest(BaseModel):
    """Schema for political alignment scoring requests."""
    weights: Dict[str, int] = Field(..., example={"healthcare": 5, "education": 4})


class HealthResponse(BaseModel):
    """Schema for service health check responses."""
    status: str
    service: str
    version: str
