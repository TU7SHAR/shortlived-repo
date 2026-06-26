"""
Unified LLM Client — supports both Groq and Google Gemini.

Switch providers with a single env var:  LLM_PROVIDER=groq  or  LLM_PROVIDER=gemini

Public API:
    llm_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode)  -> str   (sync)
    allm_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode) -> str   (async)
    get_provider_name() -> str

Both providers expose the SAME interface so the rest of the codebase doesn't
care which one is active. Only this file knows about provider SDK differences.
"""

import logging
import asyncio
from config import (
    LLM_PROVIDER,
    GROQ_API_KEY, GROQ_MODEL,
    GEMINI_API_KEY, GEMINI_MODEL,
)

logger = logging.getLogger(__name__)

_groq_client = None
_gemini_client = None
_genai = None


def _init_groq():
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info(f"LLM Provider initialized: GROQ ({GROQ_MODEL})")
    return _groq_client


def _init_gemini():
    global _gemini_client, _genai
    if _gemini_client is None:
        from google import genai
        _genai = genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info(f"LLM Provider initialized: GEMINI ({GEMINI_MODEL})")
    return _gemini_client


def _active_provider() -> str:
    """Resolve which provider to use, with graceful fallback."""
    if LLM_PROVIDER == "gemini" and GEMINI_API_KEY:
        return "gemini"
    if LLM_PROVIDER == "groq" and GROQ_API_KEY:
        return "groq"
    # Fallbacks if the configured provider has no key
    if GROQ_API_KEY:
        return "groq"
    if GEMINI_API_KEY:
        return "gemini"
    raise RuntimeError("No LLM API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env")


def get_provider_name() -> str:
    """Human-readable active provider for logging."""
    try:
        provider = _active_provider()
    except RuntimeError:
        return "None"
    return f"Gemini ({GEMINI_MODEL})" if provider == "gemini" else f"Groq ({GROQ_MODEL})"


# ═══════════════════════════════════════════════════════
# GROQ
# ═══════════════════════════════════════════════════════

def _groq_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode) -> str:
    client = _init_groq()
    kwargs = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content.strip()


# ═══════════════════════════════════════════════════════
# GEMINI
# ═══════════════════════════════════════════════════════

def _gemini_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode) -> str:
    client = _init_gemini()
    full_prompt = f"{system_prompt}\n\n{user_prompt}"
    config = _genai.types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    if json_mode:
        config.response_mime_type = "application/json"
    resp = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=full_prompt,
        config=config,
    )
    return (resp.text or "").strip()


# ═══════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════

def llm_complete(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 4000,
    json_mode: bool = False,
) -> str:
    """Synchronous completion. Used by condensation, constraint extraction, summarization."""
    provider = _active_provider()
    if provider == "gemini":
        return _gemini_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode)
    return _groq_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode)


async def allm_complete(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> str:
    """Async completion. Used by chat responses. Wraps the sync SDK call in a thread."""
    return await asyncio.to_thread(
        llm_complete, system_prompt, user_prompt, temperature, max_tokens, json_mode
    )
