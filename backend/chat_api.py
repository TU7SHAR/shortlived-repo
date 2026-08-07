"""
HTTP wrapper that gives the web chat the EXACT same flows as the Telegram bot:
  - Assistant  : knowledge-base RAG Q&A
  - Onboarding : 6-step profile capture -> onboarding_leads
  - Training   : 2-lesson product/competitor briefing (+ mid-lesson Q&A)
  - Testing    : 9 generated questions -> evaluation -> test_results

It reuses the same engine functions the bot uses (get_groq_response,
get_embedding, search_knowledge_base) and mirrors the exact prompts,
steps, validation and DB writes from handlers.py. Web users are keyed by
their Supabase auth uuid via the web_user_states table.

Run:  uvicorn chat_api:app --host 127.0.0.1 --port 8001
"""

import json
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    supabase,
    get_bot_settings,
    log_chat_interaction,
    search_knowledge_base,
)
from embedder import get_embedding
from context_ranker import ContextRanker
from constraint_extractor import ConstraintExtractor
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
FLOW_MODES = {"onboarding", "training", "testing"}
CANCEL_WORDS = {"/cancel", "cancel", "/menu", "menu", "exit", "quit", "/start"}
ACK_WORDS = {"ok", "understood", "ready", "got it", "yes", "yeah", "sure", "alright", "next", "okay"}

AI_RULES = (
    "--- CORE SYSTEM IDENTITY ---\n"
    "You are Salesji, an elite AI Sales Coach for our internal sales department. "
    "Arm the rep with knowledge, scripts, and tactics to close deals and beat competitors.\n\n"
    "--- FORMATTING ---\n"
    "Plain text ONLY. No markdown (# * ** ``` etc). Use CAPS for emphasis, 1) 2) 3) for lists.\n\n"
    "--- STRICT RAG ---\n"
    "Base answers ONLY on the SOURCE documents below. If the answer isn't there, say: "
    "'I could not find the exact answer to this in the current company knowledge base. "
    "Please ask an Admin to upload the relevant documentation.'\n\n"
    "--- GOLDEN RULE ---\n"
    "Always pitch OUR products first, then counter competitors. End by listing the source file names."
)


class ChatRequest(BaseModel):
    admin_id: str
    message: str
    user_id: str | None = None       # web auth uuid (keys web_user_states)
    telegram_id: int | None = None   # optional, for analytics parity
    mode: str | None = "assistant"   # assistant | onboarding | training | testing


@app.get("/health")
def health():
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────────
# WEB FLOW STATE (mirror of user_states, keyed by auth uuid)
# ─────────────────────────────────────────────────────────────
def get_web_state(user_id: str) -> dict:
    if not user_id:
        return {"current_mode": "assistant", "current_step": 0, "metadata": {}}
    try:
        res = supabase.table("web_user_states").select("*").eq("user_id", user_id).execute()
        if res.data:
            row = res.data[0]
            return {
                "current_mode": row.get("current_mode", "assistant"),
                "current_step": row.get("current_step", 0),
                "metadata": row.get("metadata") or {},
            }
    except Exception as e:
        logger.debug(f"get_web_state failed: {e}")
    return {"current_mode": "assistant", "current_step": 0, "metadata": {}}


def set_web_state(user_id: str, admin_id: str, mode: str, step: int = 0, metadata: dict = None):
    if not user_id:
        return
    try:
        supabase.table("web_user_states").upsert(
            {
                "user_id": user_id,
                "admin_id": admin_id,
                "current_mode": mode,
                "current_step": step,
                "metadata": metadata or {},
            },
            on_conflict="user_id",
        ).execute()
    except Exception as e:
        logger.error(f"set_web_state failed: {e}")


def reset_web_state(user_id: str, admin_id: str):
    set_web_state(user_id, admin_id, "assistant", 0, {})


# ─────────────────────────────────────────────────────────────
# KNOWLEDGE BASE LOADER (same categorization the bot uses)
# ─────────────────────────────────────────────────────────────
def load_knowledge(admin_id: str) -> dict:
    our_text, comp_text, price_text = "", "", ""
    our_files, comp_files, price_files = [], [], []
    try:
        files_res = (
            supabase.table("ingested_files")
            .select("id, filename, category")
            .eq("admin_id", admin_id)
            .execute()
        )
        for f in (files_res.data or []):
            category = f.get("category")
            if category not in VALID_CATEGORIES:
                continue
            cards_res = (
                supabase.table("condensed_knowledge_cards")
                .select("card_json")
                .eq("file_id", f["id"])
                .execute()
            )
            if not cards_res.data:
                continue
            text = "\n".join(
                json.dumps(c.get("card_json")) if isinstance(c.get("card_json"), (dict, list))
                else str(c.get("card_json"))
                for c in cards_res.data
                if c.get("card_json")
            )
            if not text.strip():
                continue
            name = f.get("filename", "file")
            if category == "Our Products":
                our_text += f"\n\n--- OUR PRODUCT FILE: {name} ---\n{text}"
                our_files.append(name)
            elif category == "Competitor Products":
                comp_text += f"\n\n--- COMPETITOR FILE: {name} ---\n{text}"
                comp_files.append(name)
            elif category == "Price Lists":
                price_text += f"\n\n--- PRICE LIST FILE: {name} ---\n{text}"
                price_files.append(name)
    except Exception as e:
        logger.error(f"load_knowledge failed: {e}")

    combined = ""
    if our_text:
        combined += "\n\n=== OUR PRODUCTS ===" + our_text
    if price_text:
        combined += "\n\n=== PRICE LISTS ===" + price_text
    if comp_text:
        combined += "\n\n=== COMPETITOR DATA ===" + comp_text

    return {
        "our_text": our_text,
        "comp_text": comp_text,
        "price_text": price_text,
        "our_files": our_files,
        "comp_files": comp_files,
        "price_files": price_files,
        "combined": combined,
        "has_data": bool(our_text or comp_text or price_text),
    }



# ─────────────────────────────────────────────────────────────
# ASSISTANT (normal RAG) — same engine as the bot's handle_message
# ─────────────────────────────────────────────────────────────
async def run_assistant(admin_id: str, user_text: str, telegram_id, temperature: float) -> str:
    merged_constraints = {}
    try:
        merged_constraints = ConstraintExtractor.extract_constraints_from_text(user_text, telegram_id or 0)
        constraint_block = ConstraintExtractor.format_for_llm_context(merged_constraints)
    except Exception:
        constraint_block = ""

    kb = load_knowledge(admin_id)
    full_context = (constraint_block + "\n\n" if constraint_block else "") + AI_RULES
    has_data = kb["has_data"]
    if kb["our_text"]:
        full_context += "\n\n=== OUR COMPANY'S PRODUCTS (PITCH THESE FIRST) ===" + kb["our_text"]
    if kb["price_text"]:
        full_context += "\n\n=== OUR PRICE LISTS ===" + kb["price_text"]
    if kb["comp_text"]:
        full_context += "\n\n=== COMPETITOR DATA (USE ONLY TO COUNTER) ===" + kb["comp_text"]

    inline_len = len(kb["our_text"]) + len(kb["comp_text"]) + len(kb["price_text"])
    if inline_len < 2000 or not has_data:
        try:
            qv = get_embedding(user_text)
            if qv:
                matches = search_knowledge_base(qv, threshold=0.3, limit=5)
                if matches:
                    has_data = True
                    chunks = [
                        {"content": f"[Source: {m['file_name']}] {m['content']}", "score": m["similarity"], "source_type": "vector_db"}
                        for m in matches
                    ]
                    full_context += "\n\n" + ContextRanker.create_context_block(
                        chunks=chunks, user_constraints=merged_constraints,
                        user_query=user_text, max_chunks=5, include_hierarchy=True,
                    )
        except Exception as e:
            logger.error(f"assistant vector search failed: {e}")

    if not has_data:
        return "The knowledge base is currently empty. Please ask an Admin to upload documents first."

    return await get_groq_response(user_text, full_context, temperature=temperature)


# ─────────────────────────────────────────────────────────────
# MAIN ENDPOINT — dispatches to the active flow (like handle_message)
# ─────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):
    admin_id = req.admin_id
    user_id = req.user_id
    user_text = (req.message or "").strip()
    requested_mode = (req.mode or "assistant").lower()

    if not admin_id or not user_text:
        return {"response": "Missing admin_id or message."}

    # Maintenance check (same setting the bot reads)
    try:
        settings = get_bot_settings(admin_id) or {}
    except Exception:
        settings = {}
    if settings.get("maintenance_mode"):
        return {"response": "The system is currently in maintenance mode. Please check back later.", "maintenance": True}
    temperature = settings.get("temperature", 0.2)

    state = get_web_state(user_id)
    active_mode = state.get("current_mode", "assistant")

    # Assistant requested → if a flow was active, exit it, then answer normally
    if requested_mode not in FLOW_MODES:
        if active_mode in FLOW_MODES:
            reset_web_state(user_id, admin_id)
        response = await run_assistant(admin_id, user_text, req.telegram_id, temperature)
        _log(admin_id, req.telegram_id, user_text, response, "normal")
        return {"response": response}

    # Flow requested. Start it fresh if not already the active flow.
    starting = active_mode != requested_mode
    if requested_mode == "onboarding":
        return await flow_onboarding(user_id, admin_id, user_text, state, starting)
    if requested_mode == "training":
        return await flow_training(user_id, admin_id, user_text, state, starting, temperature)
    if requested_mode == "testing":
        return await flow_testing(user_id, admin_id, user_text, state, starting, temperature)

    # Fallback
    response = await run_assistant(admin_id, user_text, req.telegram_id, temperature)
    return {"response": response}


def _log(admin_id, telegram_id, query, response, mode):
    try:
        log_chat_interaction(
            telegram_id=telegram_id or 0, username="web_user",
            query=query, response=response, admin_id=admin_id, mode=mode,
        )
    except Exception as e:
        logger.debug(f"analytics log skipped: {e}")



# ─────────────────────────────────────────────────────────────
# ONBOARDING — strict 6-step machine (name→phone→role→exp→goal→passion)
# ─────────────────────────────────────────────────────────────
async def flow_onboarding(user_id, admin_id, text, state, starting):
    # Start: block re-onboarding, then ask for name
    if starting:
        try:
            existing = (
                supabase.table("onboarding_leads").select("id")
                .eq("web_user_id", user_id).limit(1).execute()
            )
            if existing.data:
                return {"response": "You have already completed onboarding! You are all set to use the assistant."}
        except Exception:
            pass
        set_web_state(user_id, admin_id, "onboarding", 1, {})
        return {"response": "Welcome to Onboarding! Let's get you set up.\n\nFirst, what is your full name?"}

    step = state.get("current_step", 1)
    metadata = state.get("metadata", {}) or {}

    if step == 1:
        name = text.replace(" ", "")
        if len(text) < 2 or not name.isalpha():
            return {"response": "Please enter a valid name (letters and spaces only)."}
        metadata["full_name"] = text
        set_web_state(user_id, admin_id, "onboarding", 2, metadata)
        return {"response": f"Nice to meet you, {text}! What's the best phone number to reach you at?"}

    if step == 2:
        digits = text.replace("+", "").replace("-", "").replace(" ", "")
        if not digits.isdigit() or not (7 <= len(digits) <= 15):
            return {"response": "Please enter a valid phone number (e.g., +1234567890)."}
        metadata["phone_number"] = text
        set_web_state(user_id, admin_id, "onboarding", 3, metadata)
        return {"response": "Got it. What is your current role or job title in the company?"}

    if step == 3:
        if len(text) < 2:
            return {"response": "Please enter a valid role or job title."}
        metadata["role"] = text
        set_web_state(user_id, admin_id, "onboarding", 4, metadata)
        return {"response": "Great! How many years of experience do you have in sales?"}

    if step == 4:
        if not (1 <= len(text) <= 30):
            return {"response": "Please provide a brief answer for your experience (e.g., '5 years')."}
        metadata["experience_level"] = text
        set_web_state(user_id, admin_id, "onboarding", 5, metadata)
        return {"response": "Understood. What is your primary goal for using this AI assistant?"}

    if step == 5:
        if len(text) < 3:
            return {"response": "Please provide a bit more detail about your goal."}
        metadata["goal"] = text
        set_web_state(user_id, admin_id, "onboarding", 6, metadata)
        return {"response": "Awesome. Finally, tell me a bit about yourself — what is your passion, or what drives you to succeed in your career?"}

    if step == 6:
        if len(text) < 3:
            return {"response": "Please provide a bit more detail about what drives you."}
        try:
            supabase.table("onboarding_leads").insert({
                "web_user_id": user_id,
                "admin_id": admin_id,
                "full_name": metadata.get("full_name", "Unknown"),
                "phone_number": metadata.get("phone_number"),
                "role": metadata.get("role"),
                "experience_level": metadata.get("experience_level"),
                "goal": metadata.get("goal"),
                "passion": text,
                "training_status": "not_started",
            }).execute()
        except Exception as e:
            logger.error(f"onboarding save failed: {e}")
        reset_web_state(user_id, admin_id)
        return {"response": (
            "Profile Locked In!\n\nWelcome aboard. I am your Sales Assistant. Here's how to use me:\n\n"
            "1) ASK ANYTHING: Type a question and I'll pull the exact answer from the company knowledge base.\n"
            "2) TRAINING: Use the Training mode for bite-sized modules based on real company documents.\n"
            "3) TEST: Use the Test mode to evaluate your knowledge.\n\n"
            "Let's get to work! Switch to Use Assistant and ask me anything."
        )}

    # Unknown step — reset safely
    reset_web_state(user_id, admin_id)
    return {"response": "Onboarding reset. Please start again from the Onboarding tab."}



# ─────────────────────────────────────────────────────────────
# TRAINING — 2 lessons (products, competitors) + mid-lesson Q&A
# ─────────────────────────────────────────────────────────────
def _set_training_status(user_id, admin_id, status):
    try:
        existing = (
            supabase.table("onboarding_leads").select("id")
            .eq("web_user_id", user_id).limit(1).execute()
        )
        if existing.data:
            supabase.table("onboarding_leads").update({"training_status": status}) \
                .eq("web_user_id", user_id).execute()
        else:
            supabase.table("onboarding_leads").insert({
                "web_user_id": user_id, "admin_id": admin_id,
                "full_name": "Unknown", "training_status": status,
            }).execute()
    except Exception as e:
        logger.debug(f"training_status update skipped: {e}")


async def flow_training(user_id, admin_id, text, state, starting, temperature):
    if starting:
        set_web_state(user_id, admin_id, "training", 1, {"category": "ALL"})
        return {"response": (
            "Welcome to the Sales Training Module.\n\n"
            "First, I'll give you a short summary of our products and key features. "
            "Then I'll brief you on how to beat the competition.\n\n"
            "Are you ready to begin? Reply with 'Ready' to start!"
        )}

    lower = text.lower().strip()
    if lower in CANCEL_WORDS:
        reset_web_state(user_id, admin_id)
        return {"response": "Training session paused. Switch to Use Assistant anytime."}

    metadata = state.get("metadata", {}) or {}
    step = state.get("current_step", 1)

    # First real turn: initialize + mark partial
    if "current_lesson" not in metadata:
        metadata["current_lesson"] = 0
        metadata["history"] = []
        _set_training_status(user_id, admin_id, "partial")

    kb = load_knowledge(admin_id)
    current_lesson = metadata.get("current_lesson", 0)

    # Mid-lesson Q&A: a real question (not an acknowledgement) pauses teaching
    if current_lesson > 0 and lower not in ACK_WORDS and len(text.split()) > 3:
        qa_context = kb["combined"]
        try:
            qv = get_embedding(text)
            if qv:
                matches = search_knowledge_base(qv, threshold=0.3, limit=5)
                if matches:
                    qa_context += "\n\n" + "\n".join(
                        f"[{m['file_name']}] {m['content']}" for m in matches
                    )
        except Exception:
            pass
        resp = await get_groq_response(
            f"Answer briefly for a sales trainee:\nQuestion: {text}", qa_context, temperature=0.3
        )
        set_web_state(user_id, admin_id, "training", step + 1, metadata)
        return {"response": resp + "\n\n(Type 'ok' to continue)"}

    # LESSON 1 — OUR PRODUCTS
    if current_lesson == 0:
        if not kb["our_files"]:
            metadata["current_lesson"] = 1
        else:
            teach = (
                "You are a Sales Trainer. Give ONE comprehensive briefing about ALL our products.\n\n"
                f"DATA:\n{kb['our_text']}\n\n"
                "RULES:\n1. 2-3 sentence overview of who we are.\n"
                "2. List ALL key models/products (one line each with standout feature).\n"
                "3. End with 3-4 KEY SELLING POINTS the salesperson should memorize.\n"
                "4. Punchy, no jargon, plain text, NO markdown.\n"
                "5. End with: \"Got it? Type 'ok' and I'll brief you on the competition.\""
            )
            resp = await get_groq_response(teach, kb["our_text"], temperature=0.3)
            metadata["current_lesson"] = 1
            set_web_state(user_id, admin_id, "training", step + 1, metadata)
            _log(admin_id, None, text, resp, "training")
            return {"response": resp}

    # LESSON 2 — COMPETITORS
    if metadata.get("current_lesson") == 1:
        if not kb["comp_files"]:
            metadata["current_lesson"] = 2
        else:
            teach = (
                "You are a Sales Trainer teaching how to CRUSH competitors.\n\n"
                f"OUR PRODUCTS:\n{kb['our_text'][:8000]}\n\n"
                f"COMPETITORS:\n{kb['comp_text']}\n\n"
                "RULES:\n1. List each competitor (1 line — what they sell).\n"
                "2. For each: 1-2 WEAKNESSES where WE are better.\n"
                "3. Give 3-4 COUNTER SCRIPTS: \"If customer says [X], you say: [Y]\"\n"
                "4. Be aggressive for OUR products. This is a sales war room.\n"
                "5. Plain text only, NO markdown. End with: \"You're armed. Type 'ok' to finish.\""
            )
            resp = await get_groq_response(teach, kb["comp_text"], temperature=0.3)
            metadata["current_lesson"] = 2
            set_web_state(user_id, admin_id, "training", step + 1, metadata)
            _log(admin_id, None, text, resp, "training")
            return {"response": resp}

    # COMPLETION
    reset_web_state(user_id, admin_id)
    _set_training_status(user_id, admin_id, "completed")
    return {"response": (
        "TRAINING COMPLETE!\n\nYou know our products AND how to counter every competitor. "
        "Go close deals. Switch to Use Assistant to ask anything, or take the Test."
    )}



# ─────────────────────────────────────────────────────────────
# TESTING — generate 9 Qs, walk them, evaluate, save test_results
# ─────────────────────────────────────────────────────────────
def _render_question(q, index, total):
    out = f"Question {index + 1} of {total}:\n{q['text']}\n\n"
    if q.get("type") == "mcq" and q.get("options"):
        letters = ["A", "B", "C", "D"]
        out += "Options:\n"
        for i, opt in enumerate(q["options"][:4]):
            out += f"{letters[i]}) {opt.strip()}\n"
        out += "\nType the letter of your answer (A, B, C, or D):"
    else:
        out += "Type your answer below:"
    return out


async def flow_testing(user_id, admin_id, text, state, starting, temperature):
    if starting:
        kb = load_knowledge(admin_id)
        if not kb["has_data"]:
            return {"response": "No documents found in your repository. Ask an Admin to upload first."}

        # personalize with passion if available
        passion = "achieving career success"
        try:
            lead = (
                supabase.table("onboarding_leads").select("passion")
                .eq("web_user_id", user_id).limit(1).execute()
            )
            if lead.data and lead.data[0].get("passion"):
                passion = lead.data[0]["passion"]
        except Exception:
            pass

        our_str = ", ".join(kb["our_files"]) or "our products"
        comp_str = ", ".join(kb["comp_files"]) or "competitors"
        price_str = ", ".join(kb["price_files"]) or "our pricing"

        gen_prompt = (
            "Based ONLY on these documents, generate a dynamic sales test with EXACTLY 9 questions. "
            "Do NOT use line breaks inside a question.\n\n"
            "--- CRITICAL CORPORATE ALIGNMENT ---\n"
            f"The trainee is an employee of OUR company. Our products are in files marked 'Our Products' (e.g., {our_str}).\n"
            f"Files marked 'Competitive List' (e.g., {comp_str}) are competitors. The trainee must NEVER pitch competitors; only defend OUR products.\n"
            f"Files marked 'Price List' (e.g., {price_str}) contain our pricing. Test the trainee's ability to defend pricing / pitch ROI / use anchoring.\n\n"
            "REQUIREMENTS:\n"
            "- 4 Subjective questions about OUR products, pricing, and specs. Format on a single line:\n"
            "TEXT_Q::: [Question Text]\n\n"
            f"- 3 Multiple Choice Questions integrating the user's passion: \"{passion}\", framed as situational sales strategies. Format on a single line:\n"
            "MCQ::: [Question Text] ||| [Option A] ||| [Option B] ||| [Option C] ||| [Option D]\n\n"
            "- 2 Real-World Situational Roleplays (highly emotional, specific). Format on a single line using SITUATION:::\n"
            "  1. Q8 (CUSTOMER POV): a customer walks in with a heavy emotion (skeptical/angry about price/anxious) with a companion; ask exactly how the trainee tackles that emotional dynamic and pricing objection using OUR data.\n"
            f"  2. Q9 (EMPLOYEE POV): an active outreach scenario where the client throws out a competitor advantage (from {comp_str}); ask exactly how the trainee handles the objection and pivots back to our supremacy.\n"
        )

        raw = await get_groq_response(gen_prompt, kb["combined"], temperature=0.3)
        questions = []
        for line in raw.splitlines():
            line = line.strip()
            if line.startswith("TEXT_Q:::"):
                questions.append({"type": "text", "text": line.replace("TEXT_Q:::", "").strip()})
            elif line.startswith("SITUATION:::"):
                questions.append({"type": "text", "text": line.replace("SITUATION:::", "").strip()})
            elif line.startswith("MCQ:::"):
                parts = [p.strip() for p in line.replace("MCQ:::", "").split("|||")]
                if len(parts) >= 5:
                    questions.append({"type": "mcq", "text": parts[0], "options": parts[1:5]})

        if len(questions) < 3:
            return {"response": "Failed to generate the test format correctly. Please try again."}

        metadata = {"category": "ALL", "questions": questions, "answers": [], "total_questions": len(questions)}
        set_web_state(user_id, admin_id, "testing", 0, metadata)
        return {"response": "Comprehensive Test Started\n\n" + _render_question(questions[0], 0, len(questions))}

    # Continue — exam is locked
    if text.lower().strip() in CANCEL_WORDS:
        return {"response": "You cannot leave an active exam. Please answer the current question to proceed."}

    metadata = state.get("metadata", {}) or {}
    step = state.get("current_step", 0)
    questions = metadata.get("questions", [])
    answers = metadata.get("answers", [])
    total = metadata.get("total_questions", len(questions) or 3)

    answers.append(text)
    metadata["answers"] = answers

    if step + 1 < total:
        next_step = step + 1
        set_web_state(user_id, admin_id, "testing", next_step, metadata)
        _log(admin_id, None, text, "(answer recorded)", "testing")
        return {"response": _render_question(questions[next_step], next_step, total)}

    # Last answer — evaluate
    kb = load_knowledge(admin_id)
    qa_log = ""
    for i, q in enumerate(questions):
        qtext = q["text"]
        if q.get("type") == "mcq" and q.get("options"):
            qtext += " Options: " + " | ".join(q["options"])
        ans = answers[i] if i < len(answers) else ""
        qa_log += f"Q{i+1}: {qtext}\nUser Answer: {ans}\n\n"

    eval_prompt = (
        f"You are an expert Sales Manager evaluating a trainee. Assess these {total} answers based ONLY on the provided documents.\n\n"
        f"--- Q&A LOG ---\n{qa_log}--- END LOG ---\n\n"
        "Instructions:\n"
        f"1. Award exactly 1 mark for each completely correct/highly effective answer (max {total}).\n"
        "2. If an answer is blank, only punctuation, or generic nonsense, mark it INCORRECT (0 marks).\n"
        "3. For free-text/situational, provide the ideal benchmark in 'correct_answer'.\n"
        "4. For MCQs, state the correct option in 'correct_answer'.\n"
        "5. In 'explanation', detail why the answer was correct or where it fell short.\n\n"
        "OUTPUT (CRITICAL):\n"
        "1. Return a single valid JSON object ONLY. No text before or after.\n"
        "2. Structure: {\"score\": int, \"total\": int, \"results\": [ {\"question\": str, \"user_answer\": str, \"correct_answer\": str, \"is_correct\": bool, \"explanation\": str} ]}\n"
    )

    raw = await get_groq_response(eval_prompt, kb["combined"], temperature=0.1)
    reset_web_state(user_id, admin_id)

    try:
        clean = raw.replace("```json", "").replace("```", "").strip()
        start_idx, end_idx = clean.find("{"), clean.rfind("}")
        eval_data = json.loads(clean[start_idx:end_idx + 1])
        results = eval_data.get("results", [])
        calculated = sum(1 for r in results if r.get("is_correct"))
        eval_data["score"] = calculated
        eval_data["total"] = eval_data.get("total", total)

        try:
            supabase.table("test_results").insert({
                "web_user_id": user_id,
                "admin_id": admin_id,
                "category": "ALL",
                "qa_data": eval_data,
                "score": calculated,
                "total_questions": eval_data.get("total", total),
                "remarks": str(results),
            }).execute()
        except Exception as e:
            logger.error(f"test_result save failed: {e}")

        report = f"OFFICIAL TEST REPORT | Score: {calculated}/{eval_data.get('total', total)}\n\n"
        for r in results:
            mark = "[CORRECT]" if r.get("is_correct") else "[INCORRECT]"
            report += (
                f"{mark} {r.get('question','')}\n"
                f"Your answer: {r.get('user_answer','')}\n"
                f"Correct: {r.get('correct_answer','')}\n"
                f"Why: {r.get('explanation','')}\n"
                "──────────────\n"
            )
        return {"response": report}
    except Exception as e:
        logger.error(f"eval parse failed: {e}")
        return {"response": "Evaluation finished. Your results have been saved."}
