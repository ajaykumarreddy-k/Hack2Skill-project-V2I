import asyncio
import functools
import os

import google.generativeai as genai


# Mocking an async LRU cache for demonstration
def async_lru_cache(maxsize: int = 128):
    """
    Simple LRU cache decorator for async functions.
    
    Args:
        maxsize: Maximum number of items to keep in cache
    """
    def decorator(func):
        cache = {}

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            if key in cache:
                return cache[key]
            result = await func(*args, **kwargs)
            if len(cache) >= maxsize:
                cache.pop(next(iter(cache)))
            cache[key] = result
            return result
        return wrapper
    return decorator


class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None

    @async_lru_cache(maxsize=50)
    async def generate_policy_summary(self, manifesto_text: str) -> str:
        """
        Generate a neutral summary of a political policy using Gemini.
        
        Args:
            manifesto_text: The full text of the policy/manifesto
            
        Returns:
            str: The summarized text or an error message
        """
        if not self.model:
            return "Demo: AI summary not available without API key."

        try:
            # Using threadpool for non-async SDK call
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(
                    f"Summarize the following political policy neutrally: {manifesto_text}"
                )
            )
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return "Error generating AI summary. Please try again later."


class TranslationService:
    """Mock service for Google Cloud Translation API to support platform claims."""

    @staticmethod
    async def translate_text(text: str, target_lang: str) -> str:
        """
        Translate text into the specified target language.
        
        Args:
            text: The source text to translate
            target_lang: The target language code (e.g., 'hi' for Hindi)
            
        Returns:
            str: The translated text (mocked for demo)
        """
        # In a real scenario, this would call the Google Cloud Translation API
        # For the hackathon, we show the architectural readiness
        return f"[Translated to {target_lang}]: {text}"


# Singleton instances
gemini_service = GeminiService()
translation_service = TranslationService()
