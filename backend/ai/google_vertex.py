"""Vertex AI integration for manifesto analysis."""
import os
import vertexai  # noqa: F401
from vertexai.generative_models import GenerativeModel  # noqa: F401

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "vote2india-prod")
LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")

def analyze_manifesto(manifesto_text: str) -> dict:
    """Use Gemini Pro to analyze political manifesto sentiment and key promises."""
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = GenerativeModel("gemini-1.5-pro")
    prompt = f"""Analyze this election manifesto. Extract:
    1. Key promises
    2. Policy areas
    3. Sentiment score
    
    Manifesto: {manifesto_text[:500]}"""
    # Graceful fallback if API unavailable
    try:
        response = model.generate_content(prompt)
        return {"analysis": response.text, "model": "gemini-1.5-pro"}
    except Exception:
        return {"analysis": "offline-mode", "model": "fallback"}
