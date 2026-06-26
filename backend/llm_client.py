"""
Unified LLM Client — supports both Groq and Google Gemini with AUTO-DETECTION
and automatic runtime fallback.

How provider selection works:
    LLM_PROVIDER=auto    (default) -> use whichever key is present. If both are
                                      present, try Groq first then Gemini.
    LLM_PROVIDER=groq              -> prefer Groq, fall back to Gemini on failure
    LLM_PROVIDER=gemini            -> prefer Gemini, fall back to Groq on failure

On every call we try providers in priority order. If the first provider raises
(missing/invalid key, rate limit, network error), we automatically try the next
one. This means "use whichever key is there and working" just works.

Public API (unchanged):
    llm_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode)  -> str   (sync)
    allm_complete(system_prompt, user_prompt, temperature, max_tokens, json_mode) -> str   (async)
    get_provider_name() -> str
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
        logger.info(f"Groq client initialized ({GROQ_MODEL})")
    return _groq_client


def _init_gemini():
    global _gemini_client, _genai
    if _gemini_client is None:
        from google import genai
        _genai = genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info(f"Gemini client initialized ({GEMINI_MODEL})")
    return _gemini_client


def _provider_priority() -> list:
    """
    Returns an ordered list of providers to attempt, based on which API keys
    are present and the LLM_PROVIDER preference. Only providers with a key are
    included.
    """
    available = []
    if GROQ_API_KEY:
        available.append("groq")
    if GEMINI_API_KEY:
        available.append("gemini")

    if not available:
        raise RuntimeError("No LLM API key configured. Set GROQ_API_KEY and/or GEMINI_API_KEY in .env")

    # Apply preference: move the preferred provider to the front (if it has a key)
    preferred = LLM_PROVIDER
    if preferred in ("groq", "gemini") and preferred in available:
        available.remove(preferred)
        available.insert(0, preferred)
    # "auto" or unknown -> keep natural order (groq first, then gemini)

    return available


def get_provider_name() -> str:
    """Human-readable view of the active priority order, for logging."""
    try:
        order = _provider_priority()
    except RuntimeError:
        return "None"
    label = {"groq": f"Groq({GROQ_MODEL})", "gemini": f"Gemini({GEMINI_MODEL})"}
    return " -> ".join(label[p] for p in order)


# ═══════════════════════════════════════════════════════
# PROVIDER IMPLEMENTATIONS
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


_IMPL = {"groq": _groq_complete, "gemini": _gemini_complete}


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
    """
    Synchronous completion. Tries providers in priority order and falls back
    to the next provider if one fails.
    """
    order = _provider_priority()
    last_error = None

    for provider in order:
        try:
            result = _IMPL[provider](system_prompt, user_prompt, temperature, max_tokens, json_mode)
            return result
        except Exception as e:
            last_error = e
            # If there's another provider to try, log and continue
            if provider != order[-1]:
                logger.warning(f"LLM provider '{provider}' failed ({e}). Falling back to next provider...")
            else:
                logger.error(f"LLM provider '{provider}' failed and no fallback left: {e}")

    # All providers failed
    raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")


async def allm_complete(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> str:
    """Async completion. Wraps the sync (fallback-aware) call in a thread."""
    return await asyncio.to_thread(
        llm_complete, system_prompt, user_prompt, temperature, max_tokens, json_mode
    )
