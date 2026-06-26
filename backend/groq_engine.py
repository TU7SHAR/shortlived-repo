"""
Primary chat LLM engine. Provider-agnostic (Groq or Gemini) via llm_client.
Function name `get_groq_response` is kept for backward compatibility with
existing imports in handlers.py.
"""

import logging
import re
from llm_client import allm_complete, get_provider_name

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are Salesji, an expert internal Sales Assistant for this company. \n"
    "Your ONLY source of truth is the CONTEXT provided below. \n\n"
    "CRITICAL INSTRUCTIONS:\n"
    "1. You MUST answer the user's question using ONLY the provided CONTEXT.\n"
    "2. If the answer cannot be found in the CONTEXT, you MUST refuse to answer and say exactly: 'I do not have information on that in the company knowledge base.'\n"
    "3. DO NOT use outside world knowledge. DO NOT guess, infer, or make up information.\n"
    "4. Always mention the source file(s) you used at the very end of your answer in a new line (e.g., 'Source: [filename]').\n"
)


async def get_groq_response(user_message: str, context: str, temperature: float = 0.3) -> str:
    """Primary chat response. Uses whichever provider LLM_PROVIDER selects."""
    MAX_CHARS = 110000
    if len(context) > MAX_CHARS:
        context = context[:MAX_CHARS] + "\n... [Context truncated to fit AI memory limits]"

    provider = get_provider_name()
    logger.info(f"LLM API CALL [{provider}] -> Query: '{user_message[:50]}...' | Temp: {temperature} | Context Size: {len(context)} chars")

    try:
        system_with_context = f"{SYSTEM_PROMPT}\nCONTEXT:\n{context}"

        response = await allm_complete(
            system_prompt=system_with_context,
            user_prompt=user_message,
            temperature=temperature,
            max_tokens=4096,
        )

        final_answer = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()

        # Strip markdown formatting — models often ignore prompt instructions about this
        final_answer = re.sub(r'^#{1,6}\s*', '', final_answer, flags=re.MULTILINE)   # ## headers
        final_answer = re.sub(r'\*\*(.+?)\*\*', r'\1', final_answer)                  # **bold**
        final_answer = re.sub(r'\*(.+?)\*', r'\1', final_answer)                      # *italic*
        final_answer = re.sub(r'`(.+?)`', r'\1', final_answer)                        # `code`
        final_answer = re.sub(r'^[-*]\s', '• ', final_answer, flags=re.MULTILINE)     # bullets -> •

        logger.info(f"LLM API 200 -> Success. Response length: {len(final_answer)} chars")
        return final_answer

    except Exception as e:
        logger.error(f"LLM API ERROR -> {e}")
        return "I apologize, but I encountered an error processing that request."
