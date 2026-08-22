"""
LLM Client — Gemini only.

Groq has been fully removed. All Groq models were decommissioned and the
free tier was too restrictive for production (12k TPM, constant 429s).

Gemini provides:
- gemini-3.1-flash-lite (primary) — fast, cheap, ~1B tokens/day free
- gemini-2.5-flash (fallback) — more capable, still generous limits
- gemini-2.5-flash-lite (last resort)

Public API (unchanged — drop-in replacement):
    llm_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode)  -> str   (sync)
    allm_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode) -> str   (async)
    get_provider_name() -> str
"""

import logging
import asyncio
from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_FALLBACK_MODELS

logger = logging.getLogger(__name__)

_gemini_client = None
_genai = None


def _init_gemini():
    global _gemini_client, _genai
    if _gemini_client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured in .env")
        from google import genai
        _genai = genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info(f"Gemini client initialized (primary: {GEMINI_MODEL})")
    return _gemini_client


def get_provider_name() -> str:
    """Human-readable provider info for logging."""
    models = [GEMINI_MODEL] + GEMINI_FALLBACK_MODELS
    return f"Gemini({' -> '.join(models)})"


def llm_complete(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 4000,
    json_mode: bool = False,
) -> str:
    """
    Synchronous Gemini completion with model fallback chain.
    Tries primary model first, then fallbacks on 429/404 errors.
    """
    client = _init_gemini()
    models_to_try = [GEMINI_MODEL] + GEMINI_FALLBACK_MODELS
    last_error = None

    for model in models_to_try:
        try:
            full_prompt = f"{system_prompt}\n\n{user_prompt}"
            config = _genai.types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            if json_mode:
                config.response_mime_type = "application/json"

            resp = client.models.generate_content(
                model=model,
                contents=full_prompt,
                config=config,
            )
            return (resp.text or "").strip()

        except Exception as e:
            last_error = e
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                logger.warning(f"Gemini model '{model}' rate limited, trying next...")
                continue
            elif "404" in error_str or "not found" in error_str.lower():
                logger.warning(f"Gemini model '{model}' not found, trying next...")
                continue
            elif "413" in error_str or "too large" in error_str.lower():
                logger.warning(f"Gemini model '{model}' request too large, trying next...")
                continue
            else:
                # Unknown error — still try next model before giving up
                logger.warning(f"Gemini model '{model}' failed ({e}), trying next...")
                continue

    raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")


async def allm_complete(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> str:
    """Async completion. Wraps the sync call in a thread."""
    return await asyncio.to_thread(
        llm_complete, system_prompt, user_prompt, temperature, max_tokens, json_mode
    )
