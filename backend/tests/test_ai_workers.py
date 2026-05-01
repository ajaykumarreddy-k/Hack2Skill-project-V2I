import pytest
from unittest.mock import AsyncMock, patch
from ai.workers.manifesto_pipeline import validate_manifest_url, process_manifesto
from ai.workers.translation_worker import translate_policy

def test_validate_manifest_url():
    # Valid URLs
    assert validate_manifest_url("https://v2i-manifestos.storage.googleapis.com/test.pdf") == True
    assert validate_manifest_url("gs://v2i-manifestos/test.pdf") == True
    
    # SSRF attempts
    assert validate_manifest_url("https://malicious-site.com/manifesto.pdf") == False
    assert validate_manifest_url("file:///etc/passwd") == False
    assert validate_manifest_url("http://169.254.169.254/metadata") == False

@pytest.mark.asyncio
async def test_process_manifesto_ssrf_protection():
    with pytest.raises(ValueError, match="Untrusted URL blocked"):
        await process_manifesto("https://untrusted.com/file.pdf", "party_1")

@pytest.mark.asyncio
async def test_translation_worker_unsupported_lang():
    result = await translate_policy("policy_1", "fr") # French is not in SUPPORTED_LANGS
    assert result is None

@pytest.mark.asyncio
@patch("ai.workers.translation_worker.AsyncOpenAI")
@patch("ai.workers.translation_worker.redis.from_url")
@patch("ai.workers.translation_worker.asyncpg.connect")
async def test_translation_worker_cached(mock_connect, mock_redis, mock_openai):
    # Setup mock redis to return cached value
    mock_r = AsyncMock()
    mock_r.get.return_value = '{"title": "Translated Title", "stance": "Translated Stance"}'
    mock_redis.return_value = mock_r
    
    result = await translate_policy("policy_1", "hi")
    
    assert result["title"] == "Translated Title"
    mock_r.get.assert_called_once()
    mock_connect.assert_not_called() # Should not hit DB if cached
