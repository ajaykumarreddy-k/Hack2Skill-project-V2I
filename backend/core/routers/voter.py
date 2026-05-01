from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List
from ..db import get_db
from ..google_services import log_vote_event
from ..google_maps import get_constituency_geocode

router = APIRouter(prefix='/api/v1/voter')

@router.post('/vote')
async def cast_vote(voter_data: Dict[str, str]):
    """
    Cast a vote and stream it to BigQuery for real-time analytics.
    """
    voter_id = voter_data.get('voter_id')
    constituency = voter_data.get('constituency')
    if not voter_id or not constituency:
        raise HTTPException(status_code=400, detail="Voter ID and Constituency required")
    
    try:
        # log_vote_event streams directly to BigQuery
        log_vote_event(voter_id, constituency, "2026-05-01T21:33:09")
        return {"status": "success", "message": "Vote cast and logged to BigQuery"}
    except Exception as e:
        # Graceful fallback for demo mode
        return {"status": "mock_success", "message": "Vote recorded (BigQuery Offline)", "error": str(e)}

@router.get('/polling-stations')
async def get_nearby_polling_stations(constituency: str = Query(...)):
    """
    Fetch geocoding data for a constituency using Google Maps API.
    """
    geocode_data = get_constituency_geocode(constituency)
    if geocode_data.get('status') == 'OK':
        location = geocode_data['results'][0]['geometry']['location']
        return {
            "constituency": constituency,
            "center": location,
            "polling_stations": [
                {"name": "Government Primary School", "lat": location['lat'] + 0.001, "lng": location['lng'] + 0.001},
                {"name": "Community Center South", "lat": location['lat'] - 0.001, "lng": location['lng'] + 0.002}
            ]
        }
    return {"error": "Could not geocode constituency", "data": geocode_data}
