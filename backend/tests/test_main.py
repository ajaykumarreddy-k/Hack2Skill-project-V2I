from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from core.cache import get_cache
from core.db import get_db
from core.main import app

# Mock Database
mock_db = AsyncMock()


async def override_get_db():
    yield mock_db


# Mock Cache
mock_cache = AsyncMock()


async def override_get_cache():
    yield mock_cache


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_cache] = override_get_cache


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["version"] == "1.1.0"


@pytest.mark.asyncio
async def test_compare_policies_mocked():
    # Setup mock return value
    mock_cache.get.return_value = None
    mock_db.fetch.return_value = [
        {
            "category": "economy",
            "party_name": "National Unity",
            "abbreviation": "NU",
            "localized_stance": "Target 8% GDP"
        }
    ]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/policies/compare?category=economy")

    assert response.status_code == 200
    data = response.json()
    assert "matrix" in data
    assert "economy" in data["matrix"]
    assert data["matrix"]["economy"][0]["party"] == "National Unity"


@pytest.mark.asyncio
async def test_alignment_scoring_mocked():
    mock_db.fetch.side_effect = [
        [{"id": "uuid1", "abbreviation": "NU"}],  # parties
        [{"category": "healthcare", "stance_score": 0.9}]  # policies for NU
    ]

    payload = {"weights": {"healthcare": 5}}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/alignment/score", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "scores" in data
    assert data["scores"]["NU"] == 90.0
    assert data["top_match"] == "NU"


@pytest.mark.asyncio
async def test_security_headers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health", headers={"Origin": "http://localhost"})
    # Check for basic security headers if added
    assert "access-control-allow-origin" in response.headers
