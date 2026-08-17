"""
Lightweight HTTP wrapper around the EXISTING RAG engine so the web chat
(app.salesji.com/chat) uses the exact same brain as the Telegram bot.

It does NOT reimplement anything — it imports and calls the same functions
the Telegram handler uses:
  - database.search_knowledge_base   (pgvector search via match_embeddings)
  - embedder.get_embedding           (fastembed, lazy-loaded)
  - context_ranker.ContextRanker     (sandwich reranking)
  - constraint_extractor.*           (budget/timeline extraction + validation)
  - groq_engine.get_groq_response    (Gemini/Groq with fallback)

Run separately from the bot:
    uvicorn chat_api:app --host 127.0.0.1 --port 8001
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Reuse the exact same engine modules as the Telegram bot
from database import (
    supabase,
    get_bot_settings,
    log_chat_interaction,
    search_knowledge_base,
)
from embedder import get_embedding
from context_ranker import ContextRanker
from constraint_extractor import ConstraintExtractor, ConstraintValidator
from groq_engine import get_groq_response

logger = logging.getLogger(__name__)

app = FastAPI(title="Salesji Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_CATEGORIES = {"Our Products", "Competitor Products", "Price Lists"}

# Same system rules the Telegram bot uses (kept identical for parity)
AI_RULES = (
    "--- CORE SYSTEM IDENTITY ---\n"
    "You are Salesji, an elite, hyper-intelligent AI Sales Coach and Strategist built strictly for our internal sales department. "
    "Your absolute objective is to arm our sales team with devastatingly effective knowledge, word-for-word scripts, and tactical advantages to ruthlessly close deals, overcome any objection, and completely dominate the competition. You do not just provide information; you provide STRATEGY.\n\n"
    "--- 1. IRONCLAD FORMATTING RULES ---\n"
    "A) YOU MUST OUTPUT PLAIN TEXT ONLY. No Markdown of any kind.\n"
    "B) NEVER use # ## ### * ** ``` or any markdown symbols.\n"
    "C) If you must emphasize, USE ALL CAPITAL LETTERS.\n"
    "D) Use numbers like 1), 2), 3) or letters A), B), C) for lists — never dashes/asterisks.\n"
    "E) Keep sentences punchy and readable.\n\n"
    "--- 2. STRICT RAG PROTOCOL (ZERO HALLUCINATION) ---\n"
    "Base your advice EXCLUSIVELY on the SOURCE documents in the context below. "
    "If the exact answer cannot be found or logically deduced from the provided files, reply EXACTLY with: "
    "'I could not find the exact answer to this in the current company knowledge base. Please ask an Admin to upload the relevant documentation.'\n\n"
    "--- 3. GOLDEN RULE: OUR PRODUCTS FIRST ---\n"
    "REGARDLESS of what the user asks, ALWAYS start by pitching OUR products that fit the scenario, then address competitors and explain why OUR option is superior. "
    "Always end by listing the exact file names you pulled data from."
)


# Mode-specific directives layered on top of AI_RULES. All modes use the
# same knowledge base + engine; only the coaching instruction changes.
MODE_DIRECTIVES = {
    "assistant": "",
    "onboarding": (
        "\n\n--- MODE: ONBOARDING ---\n"
        "You are onboarding a new sales rep. Warmly welcome them, then ask ONE question "
        "at a time to learn their name, role, experience level, and primary sales goal. "
        "Keep it conversational and brief. After they answer, acknowledge and continue."
    ),
    "training": (
        "\n\n--- MODE: TRAINING ---\n"
        "You are running an interactive sales training session using ONLY the knowledge base. "
        "Give a concise briefing on our products/competitors relevant to the rep's message, "
        "then pose a short roleplay objection for them to handle. Coach them on their answers."
    ),
    "testing": (
        "\n\n--- MODE: TESTING ---\n"
        "You are quizzing the sales rep on the company's knowledge base. Ask ONE clear question "
        "at a time (mix factual and situational). After they answer, tell them if they're right, "
        "give the correct answer from the knowledge base, and then ask the next question."
    ),
}


# Modes that must work even when no documents are ingested yet.
MODES_WITHOUT_KB = {"onboarding"}


class ChatRequest(BaseModel):
    admin_id: str
    message: str
    telegram_id: int | None = None  # optional; for analytics parity
    mode: str | None = "assistant"  # assistant | onboarding | training | testing


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(req: ChatRequest):
    admin_id = req.admin_id
    user_text = (req.message or "").strip()

    if not admin_id or not user_text:
        return {"response": "Missing admin_id or message."}

    # ── Maintenance check (same settings the bot reads) ──
    try:
        settings = get_bot_settings(admin_id) or {}
    except Exception:
        settings = {}
    if settings.get("maintenance_mode"):
        return {
            "response": "The system is currently in maintenance mode. Please check back later.",
            "maintenance": True,
        }
    temperature = settings.get("temperature", 0.2)

    # ── Phase 1: Constraints (same engine) ──
    merged_constraints = {}
    try:
        merged_constraints = ConstraintExtractor.extract_constraints_from_text(
            user_text, req.telegram_id or 0
        )
    except Exception as e:
        logger.debug(f"Constraint extraction skipped: {e}")
    try:
        constraint_block = ConstraintExtractor.format_for_llm_context(merged_constraints)
    except Exception:
        constraint_block = ""

    mode = (req.mode or "assistant").lower()
    mode_directive = MODE_DIRECTIVES.get(mode, "")
    full_context = (
        (constraint_block + "\n\n" if constraint_block else "")
        + AI_RULES
        + mode_directive
    )
    has_data = False

    # ── Phase 2: Knowledge cards (categorized, same as bot) ──
    our_products = ""
    competitors = ""
    prices = ""
    try:
        files_res = (
            supabase.table("ingested_files")
            .select("id, filename, category")
            .eq("admin_id", admin_id)
            .execute()
        )
        for f in (files_res.data or []):
            # Parity with handlers.py: files with no category recorded are
            # treated as "Our Products" (the Telegram bot does the same via
            # data.get('category', 'Our Products')). Without this default,
            # every NULL-category file was silently dropped, which made the
            # web chat report an empty knowledge base.
            category = f.get("category") or "Our Products"
            if category not in VALID_CATEGORIES:
                logger.info(
                    f"Skipping file '{f.get('filename')}' — unrecognized category: '{category}'"
                )
                continue
            cards_res = (
                supabase.table("condensed_knowledge_cards")
                .select("card_json")
                .eq("file_id", f["id"])
                .execute()
            )
            if not cards_res.data:
                continue
            import json as _json
            text = "\n".join(
                _json.dumps(c.get("card_json")) if isinstance(c.get("card_json"), (dict, list))
                else str(c.get("card_json"))
                for c in cards_res.data
                if c.get("card_json")
            )
            if not text.strip():
                continue
            name = f.get("filename", "file")
            if category == "Our Products":
                our_products += f"\n\n--- OUR PRODUCT FILE: {name} ---\n{text}"
            elif category == "Competitor Products":
                competitors += f"\n\n--- COMPETITOR FILE: {name} ---\n{text}"
            elif category == "Price Lists":
                prices += f"\n\n--- PRICE LIST FILE: {name} ---\n{text}"
    except Exception as e:
        logger.error(f"KB load failed: {e}")

    if our_products:
        full_context += "\n\n=== OUR COMPANY'S PRODUCTS (PITCH THESE AGGRESSIVELY) ===" + our_products
        has_data = True
    if prices:
        full_context += "\n\n=== OUR PRICE LISTS (USE FOR ANCHORING) ===" + prices
        has_data = True
    if competitors:
        full_context += "\n\n=== COMPETITOR DATA (USE ONLY TO COUNTER) ===" + competitors
        has_data = True

    # ── Phase 3: Vector search when inline context is thin (same heuristic) ──
    inline_len = len(our_products) + len(competitors) + len(prices)
    if inline_len < 2000 or not has_data:
        try:
            query_vector = get_embedding(user_text)
            if query_vector:
                matches = search_knowledge_base(query_vector, threshold=0.3, limit=5)
                if matches:
                    has_data = True
                    chunk_dicts = [
                        {
                            "content": f"[Source: {m['file_name']}] {m['content']}",
                            "score": m["similarity"],
                            "source_type": "vector_db",
                        }
                        for m in matches
                    ]
                    ranked = ContextRanker.create_context_block(
                        chunks=chunk_dicts,
                        user_constraints=merged_constraints,
                        user_query=user_text,
                        max_chunks=5,
                        include_hierarchy=True,
                    )
                    full_context += "\n\n" + ranked
        except Exception as e:
            logger.error(f"Vector search failed: {e}")

    # Onboarding is about the REP (name, role, experience, goals), not about
    # product data, so it must never be blocked by an empty knowledge base.
    if not has_data and mode not in MODES_WITHOUT_KB:
        return {"response": "The knowledge base is currently empty. Please ask an Admin to upload documents first."}

    # ── LLM (same provider engine + fallback) ──
    try:
        response = await get_groq_response(user_text, full_context, temperature=temperature)
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return {"response": "I apologize, but I encountered an error processing that request."}

    # ── Validate against constraints (same validator) ──
    try:
        is_valid, violations = ConstraintValidator.validate_response(
            response, merged_constraints, req.telegram_id or 0
        )
        if not is_valid and violations:
            response += f"\n\n[System Note: Missing constraint - {violations[0]}]"
    except Exception:
        pass

    # ── Log to analytics (parity with bot) ──
    # chat_analytics.mode only allows: normal | training | testing
    analytics_mode = mode
    if analytics_mode not in ("training", "testing"):
        analytics_mode = "normal"
    try:
        log_chat_interaction(
            telegram_id=req.telegram_id or 0,
            username="web_user",
            query=user_text,
            response=response,
            admin_id=admin_id,
            mode=analytics_mode,
        )
    except Exception as e:
        logger.debug(f"Analytics log skipped: {e}")

    return {"response": response}
