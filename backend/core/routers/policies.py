import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query

from ..cache import get_cache
from ..db import get_db
from ...ai.google_vertex import analyze_manifesto
from ..google_maps import get_constituency_geocode

router = APIRouter(prefix='/api/v1')


@router.get('/policies/compare')
async def compare_policies(
    category: Optional[str] = Query(None),
    party_ids: Optional[List[str]] = Query(None),
    lang: str = Query('en'),
    db=Depends(get_db),
    cache=Depends(get_cache)
):
    """
    Compare political policies across different parties and categories.
    
    Args:
        category: Filter by policy category (e.g., 'Economy')
        party_ids: List of party IDs to compare
        lang: Target language code for translation
        db: Database connection dependency
        cache: Cache connection dependency
        
    Returns:
        dict: Matrix of policies grouped by category
    """
    cache_key = f'compare:{category}:{sorted(party_ids or [])}:{lang}'
    cached = await cache.get(cache_key)
    if cached:
        return json.loads(cached)

    query = '''
        SELECT p.id, p.title, p.category, p.stance,
               pr.name as party_name, pr.abbreviation,
               COALESCE(t.value, p.stance) as localized_stance
        FROM policies p
        JOIN parties pr ON p.party_id = pr.id
        LEFT JOIN translations t ON
            t.entity_type = 'policy' AND t.entity_id = p.id
            AND t.field = 'stance' AND t.lang_code = $1
        WHERE ($2::text IS NULL OR p.category = $2)
        AND ($3::uuid[] IS NULL OR pr.id = ANY($3::uuid[]))
        ORDER BY p.category, pr.abbreviation
    '''

    rows = await db.fetch(query, lang, category, party_ids)

    # Simple matrix builder
    matrix = {}
    for row in rows:
        cat = row['category']
        if cat not in matrix:
            matrix[cat] = []
        matrix[cat].append({
            "party": row['party_name'],
            "abbreviation": row['abbreviation'],
            "stance": row['localized_stance']
        })

    result = {"matrix": matrix}
    await cache.set(cache_key, json.dumps(result), ex=3600)
    return result


@router.post('/alignment/score')
async def compute_alignment(responses: Dict[str, Any], db=Depends(get_db)):
    """
    Compute political alignment score for a user based on their priorities.
    
    Args:
        responses: User weights for different policy categories
        db: Database connection dependency
        
    Returns:
        dict: Alignment scores for each party and the top match
    """
    '''
    responses = { 'weights': { 'healthcare': 5, 'tax_reform': 2, ... } }
    '''
    weights = responses.get('weights', {})
    parties = await db.fetch('SELECT id, abbreviation FROM parties')
    scores = {}

    for party in parties:
        policies = await db.fetch(
            'SELECT category, stance_score FROM policies WHERE party_id=$1',
            party['id']
        )
        policy_map = {r['category']: r['stance_score'] for r in policies}

        # Weighted dot product: user priorities × party stance scores
        numerator = sum(
            weights.get(cat, 0) * policy_map.get(cat, 0.5)
            for cat in weights
        )
        denominator = sum(weights.values()) if weights.values() else 1.0
        scores[party['abbreviation']] = round((numerator / denominator) * 100, 1)

    return {
        'scores': scores,
        'top_match': max(scores, key=scores.get) if scores else None
    }


@router.post('/policies/analyze')
async def analyze_party_manifesto(request: Dict[str, str]):
    """
    Trigger AI analysis of a party manifesto using Google Vertex AI.
    """
    manifesto_text = request.get('text', '')
    if not manifesto_text:
        raise HTTPException(status_code=400, detail="Manifesto text required")
    
    analysis = analyze_manifesto(manifesto_text)
    return analysis
