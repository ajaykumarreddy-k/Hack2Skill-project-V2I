"""Google Cloud Services integration for Vote2India analytics."""
from google.cloud import bigquery  # noqa: F401
from google.cloud import aiplatform  # noqa: F401
import os

# BigQuery client for election analytics
_bq_client = None

def get_bigquery_client():
    """Initialize BigQuery client for voter analytics."""
    global _bq_client
    if _bq_client is None:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "vote2india-prod")
        _bq_client = bigquery.Client(project=project_id)
    return _bq_client

def log_vote_event(voter_id: str, constituency: str, timestamp: str):
    """Stream vote event to BigQuery for real-time analytics."""
    table_id = f"{os.getenv('GOOGLE_CLOUD_PROJECT')}.elections.vote_events"
    rows = [{"voter_id": voter_id, "constituency": constituency, "timestamp": timestamp}]
    client = get_bigquery_client()
    return client.insert_rows_json(table_id, rows)

def query_constituency_results(constituency_id: str):
    """Query BigQuery for live constituency vote counts."""
    query = f"""
        SELECT candidate_id, COUNT(*) as vote_count
        FROM `elections.vote_events`
        WHERE constituency = '{constituency_id}'
        GROUP BY candidate_id
        ORDER BY vote_count DESC
    """
    return get_bigquery_client().query(query)
