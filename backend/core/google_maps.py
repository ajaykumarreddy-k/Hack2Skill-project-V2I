"""Google Maps integration for constituency visualization."""
import os
import requests

MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

def get_constituency_geocode(constituency_name: str) -> dict:
    """Geocode constituency name using Google Maps Geocoding API."""
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": f"{constituency_name}, India", "key": MAPS_API_KEY}
    try:
        resp = requests.get(url, params=params, timeout=5)
        return resp.json()
    except Exception:
        return {"status": "OFFLINE", "results": []}
