"""
Lightweight HTTP wrapper around the EXISTING RAG engine so the web chat
(app.salesji.com/chat) uses the exact same brain as the Telegram bot.

It does NOT reimplement anything — it imports and calls the same functions
the Telegram handler uses:
  - database.search_knowledge_base   (pgvector search via match_embeddings)
  - database.get_user_state / update_user_state / save_onboarding_lead / etc.
  - embedder.get_embedding           (fastembed, lazy-loaded)
  - context_ranker.ContextRanker     (sandwich reranking)
  - constraint_extractor.*           (budget/timeline extraction + validation)
  - groq_engine.get_groq_response    (Gemini/Groq with fallback)
  - sliding_window.SlidingWindowMemory (training conversation compression)

Stateful flows (onboarding, training, testing) are IDENTICAL to the
Telegram bot's handlers.py — same steps, same prompts, same DB writes.

Run separately from the bot:
    uvicorn chat_api:app --host 127.0.0.1 --port 8001
"""

import json
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
    get_onboarding_lead,
    save_onboarding_lead,
    save_test_result,
)
from embedder import get_embedding
from context_ranker import ContextRanker
from constraint_extractor import ConstraintExtractor, ConstraintValidator
from groq_engine import get_groq_response
from sliding_window import SlidingWindowMemory
from schema_map import TblUserStates, TblOnboarding, TblTests, TblUsers
from cache import files_cache

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


# ═══════════════════════════════════════════════════════
# STATE MANAGEMENT — keyed by web_user_id (UUID)
# Uses the same user_states table but via the user_id column
# (added by migration 007) instead of telegram_id.
# ═══════════════════════════════════════════════════════

def get_web_user_state(web_user_id: str) -> dict | None:
    """Get user state by web_user_id (UUID) from user_states.user_id column."""
    try:
        res = supabase.table(TblUserStates.TABLE).select("*").eq("user_id", web_user_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Error fetching web user state: {e}")
        return None


def update_web_user_state(web_user_id: str, mode: str, step: int = 0, metadata: dict = {}):
    """Update user state keyed by web_user_id — upserts on user_id column."""
    try:
        update_dict = {
            "user_id": web_user_id,
            TblUserStates.CURRENT_MODE: mode,
            TblUserStates.CURRENT_STEP: step,
            TblUserStates.METADATA: metadata,
        }
        supabase.table(TblUserStates.TABLE).upsert(
            update_dict, on_conflict="user_id"
        ).execute()
    except Exception as e:
        logger.error(f"Web user state update error: {e}")


def get_web_onboarding_lead(web_user_id: str) -> dict | None:
    """Check if this web user already completed onboarding."""
    try:
        res = supabase.table(TblOnboarding.TABLE).select("*").eq("user_id", web_user_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Error fetching web onboarding lead: {e}")
        return None


# ═══════════════════════════════════════════════════════
# KNOWLEDGE BASE LOADER — same as handlers.py get_tenant_files()
# ═══════════════════════════════════════════════════════

def get_tenant_files(admin_id: str) -> dict:
    """Fetch all knowledge cards for an admin — CACHED (60s TTL)."""
    cache_key = f"tenant_files:{admin_id}"
    cached = files_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        files_res = (
            supabase.table("ingested_files")
            .select("id, filename, category")
            .eq("admin_id", admin_id)
            .execute()
        )
        ram_files = {}
        for f in (files_res.data or []):
            file_id = f["id"]
            fname = f["filename"]
            category = f.get("category") or "Our Products"

            cards_res = (
                supabase.table("condensed_knowledge_cards")
                .select("card_json")
                .eq("file_id", file_id)
                .execute()
            )
            card_texts = []
            for card in (cards_res.data or []):
                content = card.get("card_json")
                if content:
                    card_text = json.dumps(content) if isinstance(content, (dict, list)) else str(content)
                    card_texts.append(card_text)
            full_text = "\n".join(card_texts)

            ram_files[fname] = {
                "filename": fname,
                "file_id": file_id,
                "text": full_text,
                "category": category,
            }

        files_cache.set(cache_key, ram_files)
        return ram_files
    except Exception as e:
        logger.error(f"get_tenant_files failed: {e}")
        return {}


# ═══════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    admin_id: str
    message: str
    web_user_id: str | None = None  # Supabase auth UUID for web users
    telegram_id: int | None = None  # optional; for analytics parity
    mode: str | None = "assistant"  # assistant | onboarding | training | testing


@app.get("/health")
def health():
    return {"status": "ok"}


# ═══════════════════════════════════════════════════════
# ONBOARDING — exact same 6-step flow as handlers.py
# ═══════════════════════════════════════════════════════

def handle_onboarding(req: ChatRequest, state: dict | None) -> dict:
    """Stateful onboarding: collects name, phone, role, experience, goal, passion."""
    web_user_id = req.web_user_id
    text = (req.message or "").strip()

    # First entry into onboarding — check if already completed
    if state is None or state.get(TblUserStates.CURRENT_MODE) != "onboarding":
        existing = get_web_onboarding_lead(web_user_id)
        if existing:
            return {"response": "You have already completed onboarding! You are all set to use the assistant."}
        update_web_user_state(web_user_id, mode="onboarding", step=1)
        return {"response": "Welcome to Onboarding! Let's get you set up.\n\nFirst, what is your full name?"}

    step = state.get(TblUserStates.CURRENT_STEP, 1)
    metadata = state.get(TblUserStates.METADATA, {}) or {}

    if step == 1:
        clean_name = text.replace(" ", "")
        if len(clean_name) < 2 or not clean_name.isalpha():
            return {"response": "Please enter a valid name (letters and spaces only)."}
        metadata["full_name"] = text
        update_web_user_state(web_user_id, "onboarding", step=2, metadata=metadata)
        return {"response": f"Nice to meet you, {text}! What's the best phone number to reach you at?"}

    elif step == 2:
        clean_phone = text.replace("+", "").replace("-", "").replace(" ", "")
        if not clean_phone.isdigit() or len(clean_phone) < 7 or len(clean_phone) > 15:
            return {"response": "Please enter a valid phone number (e.g., +1234567890)."}
        metadata["phone_number"] = text
        update_web_user_state(web_user_id, "onboarding", step=3, metadata=metadata)
        return {"response": "Got it. What is your current role or job title in the company?"}

    elif step == 3:
        if len(text) < 2:
            return {"response": "Please enter a valid role or job title."}
        metadata["role"] = text
        update_web_user_state(web_user_id, "onboarding", step=4, metadata=metadata)
        return {"response": "Great! How many years of experience do you have in sales?"}

    elif step == 4:
        if len(text) < 1 or len(text) > 30:
            return {"response": "Please provide a brief answer for your experience (e.g., '5 years')."}
        metadata["experience_level"] = text
        update_web_user_state(web_user_id, "onboarding", step=5, metadata=metadata)
        return {"response": "Understood. What is your primary goal for using this AI assistant?"}

    elif step == 5:
        if len(text) < 3:
            return {"response": "Please provide a bit more detail about your goal."}
        metadata["goal"] = text
        update_web_user_state(web_user_id, "onboarding", step=6, metadata=metadata)
        return {"response": "Awesome. Finally, tell me a bit about yourself — what is your passion, or what drives you to succeed in your career?"}

    elif step == 6:
        if len(text) < 3:
            return {"response": "Please provide a bit more detail about what drives you."}
        try:
            save_onboarding_lead({
                "user_id": web_user_id,
                TblOnboarding.FULL_NAME: metadata.get("full_name", "Unknown"),
                TblOnboarding.PHONE_NUMBER: metadata.get("phone_number", "Unknown"),
                TblOnboarding.ROLE: metadata.get("role", "Unknown"),
                TblOnboarding.EXPERIENCE_LEVEL: metadata.get("experience_level", "Unknown"),
                TblOnboarding.GOAL: metadata.get("goal", "Unknown"),
                TblOnboarding.PASSION: text,
                TblOnboarding.ADMIN_ID: req.admin_id,
            })
        except Exception as e:
            logger.error(f"Failed to save onboarding: {e}")

        update_web_user_state(web_user_id, mode="use", step=0, metadata={})
        return {
            "response": (
                "Profile Locked In!\n\n"
                "Welcome aboard. I am your Sales Assistant. Here is how you can use me:\n\n"
                "1) Ask Anything: Type a question (e.g., 'What are our pricing tiers?') "
                "and I will pull the exact answer from the knowledge base.\n"
                "2) Sales Training: Brush up with bite-sized training modules.\n"
                "3) Take a Test: Quiz yourself on products and competitors.\n\n"
                "Let's get to work! Switch to 'Use Assistant' and ask me anything."
            )
        }

    return {"response": "Something went wrong with onboarding. Please try again."}


# ═══════════════════════════════════════════════════════
# TRAINING — exact same 2-lesson flow as handlers.py
# Lesson 0: Our Products briefing
# Lesson 1: Competitor intelligence
# Mid-lesson Q&A with vector search
# ═══════════════════════════════════════════════════════

async def handle_training(req: ChatRequest, state: dict | None) -> dict:
    """Stateful training: 2-lesson flow identical to Telegram."""
    web_user_id = req.web_user_id
    admin_id = req.admin_id
    text = (req.message or "").strip()

    # First entry — initialize state
    if state is None or state.get(TblUserStates.CURRENT_MODE) != "training":
        update_web_user_state(web_user_id, mode="training", step=1, metadata={"category": "ALL"})
        return {
            "response": (
                "Welcome to the Sales Training Module\n\n"
                "Let's get you up to speed quickly.\n\n"
                "First, I will give you a very short, simple summary of our products and key features. "
                "Then, I will ask you a few normal questions to make sure you understand the basics.\n\n"
                "Are you ready to begin? Reply with 'Ready' to start!"
            )
        }

    # Cancel handler
    if text.lower() in ["/cancel", "cancel", "/menu", "menu", "exit", "quit", "/start"]:
        update_web_user_state(web_user_id, mode="use", step=0, metadata={})
        return {"response": "Training session paused. You can restart anytime from the sidebar."}

    step = state.get(TblUserStates.CURRENT_STEP, 0)
    metadata = state.get(TblUserStates.METADATA, {}) or {}

    # Metadata initialization (first real message)
    if "phase" not in metadata:
        metadata["phase"] = "TRAINING_PHASE"
        metadata["taught_files"] = []
        metadata["history"] = []
        # Create/update onboarding_leads record for tracking
        try:
            existing = supabase.table("onboarding_leads").select("id").eq("user_id", web_user_id).execute()
            if existing.data:
                supabase.table("onboarding_leads").update({"training_status": "partial"}).eq("user_id", web_user_id).execute()
            else:
                supabase.table("onboarding_leads").insert({
                    "user_id": web_user_id,
                    "admin_id": admin_id,
                    "full_name": "Web User",
                    "training_status": "partial",
                }).execute()
        except Exception as e:
            logger.error(f"Failed to update training status to partial: {e}")

    metadata = SlidingWindowMemory.initialize_history(metadata)
    metadata = SlidingWindowMemory.add_message(metadata, "Trainee", text)

    # Load knowledge files
    files = get_tenant_files(admin_id)
    our_product_files = {name: data for name, data in files.items() if data.get("category") == "Our Products"}
    competitor_files = {name: data for name, data in files.items() if data.get("category") == "Competitor Products"}
    price_files = {name: data for name, data in files.items() if data.get("category") == "Price Lists"}

    # Build knowledge base string (labeled)
    knowledge_base = ""
    if our_product_files:
        knowledge_base += "\n=== OUR PRODUCTS (TEACH AND PITCH THESE) ==="
        knowledge_base += "".join([f"\n--- OUR PRODUCT: {name} ---\n{data['text']}" for name, data in our_product_files.items()])
    if price_files:
        knowledge_base += "\n=== PRICE LISTS (USE FOR VALUE DEFENSE) ==="
        knowledge_base += "".join([f"\n--- PRICE LIST: {name} ---\n{data['text']}" for name, data in price_files.items()])
    if competitor_files:
        knowledge_base += "\n=== COMPETITOR DATA (REFERENCE ONLY — NEVER PITCH THESE) ==="
        knowledge_base += "".join([f"\n--- COMPETITOR: {name} ---\n{data['text']}" for name, data in competitor_files.items()])

    current_lesson = metadata.get("current_lesson", 0)

    # Check for acknowledgment
    acknowledgment_keywords = ["ok", "understood", "ready", "got it", "yes", "yeah", "sure", "alright", "next", "okay"]
    user_acknowledged = any(kw in text.lower().strip() for kw in acknowledgment_keywords)

    # Mid-lesson Q&A: if they ask a question (not an acknowledgment, >3 words)
    if current_lesson > 0 and not user_acknowledged and len(text.split()) > 3:
        qa_context = knowledge_base
        try:
            query_vector = get_embedding(text)
            if query_vector:
                matches = search_knowledge_base(query_vector, threshold=0.3, limit=5)
                if matches:
                    qa_context += "\n\n=== VECTOR SEARCH RESULTS ==="
                    for match in matches:
                        qa_context += f"\n[Source: {match.get('file_name', 'kb')}] {match['content']}"
        except Exception:
            pass

        try:
            resp = await get_groq_response(f"Answer briefly:\n{qa_context}\nQuestion: {text}", qa_context, temperature=0.3)
            metadata = SlidingWindowMemory.add_message(metadata, "Instructor", resp)
            update_web_user_state(web_user_id, mode="training", step=step + 1, metadata=metadata)
            return {"response": resp + "\n\n(Type 'ok' to continue with training)"}
        except Exception as e:
            logger.error(f"Training Q&A error: {e}")
            return {"response": "Error answering your question. Type 'ok' to continue."}

    # LESSON 1: Our Products briefing
    if current_lesson == 0:
        if not our_product_files:
            # No product files — skip to lesson 1 (competitors)
            metadata["current_lesson"] = 1
            current_lesson = 1  # Update local var so we fall through to next check
        else:
            our_text = "\n".join([d["text"] for d in our_product_files.values() if d.get("text")])
            teach_prompt = (
                "You are a Sales Trainer. Give ONE comprehensive briefing about ALL our products.\n\n"
                f"DATA:\n{our_text}\n\n"
                "RULES:\n"
                "1. 2-3 sentence overview of who we are.\n"
                "2. List ALL key models/products (one line each with standout feature).\n"
                "3. End with 3-4 KEY SELLING POINTS the salesperson should memorize.\n"
                "4. Keep it punchy. No corporate jargon. Plain text only, NO markdown.\n"
                "5. End with: \"Got it? Type 'ok' and I'll brief you on the competition.\""
            )
            try:
                resp = await get_groq_response(teach_prompt, our_text, temperature=0.3)
                metadata["current_lesson"] = 1
                metadata = SlidingWindowMemory.add_message(metadata, "Instructor", resp)
                update_web_user_state(web_user_id, mode="training", step=step + 1, metadata=metadata)
                log_chat_interaction(0, "web_user", text, resp, admin_id, mode="training")
                return {"response": resp}
            except Exception as e:
                logger.error(f"Training lesson 0 error: {e}")
                return {"response": "Error generating product briefing. Type 'ok' to retry."}

    # LESSON 2: Competitor intelligence
    if current_lesson == 1:
        if not competitor_files:
            # No competitor files — skip to done
            metadata["current_lesson"] = 2
            current_lesson = 2  # Update local var so we fall through to completion
        else:
            comp_text = "\n".join([d["text"] for d in competitor_files.values() if d.get("text")])
            our_text = "\n".join([d["text"] for d in our_product_files.values() if d.get("text")])
            teach_prompt = (
                "You are a Sales Trainer teaching how to CRUSH competitors.\n\n"
                f"OUR PRODUCTS:\n{our_text[:8000]}\n\n"
                f"COMPETITORS:\n{comp_text}\n\n"
                "RULES:\n"
                "1. List each competitor (1 line — what they sell).\n"
                "2. For each: 1-2 WEAKNESSES where WE are better.\n"
                "3. Give 3-4 COUNTER SCRIPTS: \"If customer says [X], you say: [Y]\"\n"
                "4. Be aggressive for OUR products. This is a sales war room.\n"
                "5. Plain text only, NO markdown. End with: \"You're armed. Type 'ok' to finish.\""
            )
            try:
                resp = await get_groq_response(teach_prompt, comp_text, temperature=0.3)
                metadata["current_lesson"] = 2
                metadata = SlidingWindowMemory.add_message(metadata, "Instructor", resp)
                update_web_user_state(web_user_id, mode="training", step=step + 1, metadata=metadata)
                log_chat_interaction(0, "web_user", text, resp, admin_id, mode="training")
                return {"response": resp}
            except Exception as e:
                logger.error(f"Training lesson 1 error: {e}")
                return {"response": "Error generating competitor briefing. Type 'ok' to retry."}

    # DONE — training complete
    if current_lesson >= 2:
        update_web_user_state(web_user_id, mode="use", step=0, metadata={})
        try:
            supabase.table("onboarding_leads").update({"training_status": "completed"}).eq("user_id", web_user_id).execute()
        except Exception as e:
            logger.error(f"Failed to update training_status to completed: {e}")
        log_chat_interaction(0, "web_user", text, "TRAINING COMPLETE", admin_id, mode="training")
        return {
            "response": (
                "TRAINING COMPLETE!\n\n"
                "You know our products AND how to counter every competitor.\n"
                "Go close deals. Switch to 'Use Assistant' to start selling."
            )
        }

    return {"response": "Training error. Please try again."}


# ═══════════════════════════════════════════════════════
# TESTING — exact same generate→answer→evaluate flow as handlers.py
# ═══════════════════════════════════════════════════════

async def handle_testing(req: ChatRequest, state: dict | None) -> dict:
    """Stateful testing: generate questions, collect answers, evaluate."""
    web_user_id = req.web_user_id
    admin_id = req.admin_id
    text = (req.message or "").strip()

    # First entry — generate the test
    if state is None or state.get(TblUserStates.CURRENT_MODE) != "testing":
        # Get user's passion from onboarding (if completed)
        lead_data = get_web_onboarding_lead(web_user_id)
        passion = lead_data.get(TblOnboarding.PASSION, "achieving career success") if lead_data else "achieving career success"

        files = get_tenant_files(admin_id)
        our_products_list = []
        competitor_list = []
        price_list = []
        test_context = ""

        for name, data in files.items():
            cat = data.get("category", "Our Products")
            if cat == "Our Products":
                our_products_list.append(name)
            elif cat == "Competitor Products":
                competitor_list.append(name)
            elif cat == "Price Lists":
                price_list.append(name)
            test_context += f"\n\n--- SOURCE: {name} ({cat}) ---\n{data['text']}"

        if not test_context.strip():
            return {"response": "No documents found in the knowledge base. Please ask an Admin to upload files first."}

        our_products_str = ", ".join(our_products_list) if our_products_list else "our core products"
        competitor_str = ", ".join(competitor_list) if competitor_list else "competitor products"
        price_str = ", ".join(price_list) if price_list else "pricing documentation"

        prompt = f"""Based ONLY on these documents, generate a dynamic sales test with EXACTLY 9 questions. Do NOT use line breaks inside a question.

--- CRITICAL CORPORATE ALIGNMENT ---
The trainee taking this test is an employee of OUR company. Our company's products are detailed in the files marked as 'Our Products' (e.g., {our_products_str}).
Files marked as 'Competitor Products' (e.g., {competitor_str}) represent market competitors. The trainee must NEVER pitch competitor products; they must strictly defend OUR products against them.
Files marked as 'Price Lists' (e.g., {price_str}) contain our pricing, tiers, or promotions. Use this to test the trainee's ability to defend our pricing, pitch ROI, or use anchoring strategies.

REQUIREMENTS:
- 4 Subjective/Theoretical questions about OUR products, pricing strategies, and how our specifications crush the market. Format exactly on a single line:
TEXT_Q::: [Question Text]

- 3 Multiple Choice Questions (MCQs) integrating the user's core passion: "{passion}", framed as situational sales strategies. Format exactly on a single line:
MCQ::: [Question Text] ||| [Option A] ||| [Option B] ||| [Option C] ||| [Option D]

- 2 Real-World Situational Roleplays. They must be highly emotional, specific scenarios testing our value proposition. Format exactly on a single line using SITUATION:::

1. Q8 (CUSTOMER POV Scenario): Craft a specific scenario where a customer walks in carrying a heavy emotion (skeptical, angry about price based on our Price List, anxious about tech) accompanied by someone else (spouse, boss, friend). The question must ask the trainee exactly how they will tackle that specific emotional dynamic and pricing objection using OUR data.

2. Q9 (EMPLOYEE POV Scenario): Craft an active outreach scenario where the salesman must go to the customer (e.g., approaching a lead at a convention, visiting a corporate client, or handling a hostile phone call). The client must actively throw out a competitor's advantage (like a feature or price point from {competitor_str}), and the question must ask the trainee exactly how they will handle the objection and pivot back to our supremacy."""

        try:
            response = await get_groq_response(prompt, test_context, temperature=0.3)

            questions = []
            for line in response.split("\n"):
                line = line.strip()
                if line.startswith("TEXT_Q:::"):
                    questions.append({"type": "text", "text": line.replace("TEXT_Q:::", "").strip()})
                elif line.startswith("SITUATION:::"):
                    questions.append({"type": "text", "text": line.replace("SITUATION:::", "").strip()})
                elif line.startswith("MCQ:::"):
                    parts = line.replace("MCQ:::", "").split("|||")
                    if len(parts) >= 5:
                        questions.append({
                            "type": "mcq",
                            "text": parts[0].strip(),
                            "options": [p.strip() for p in parts[1:5]],
                        })

            if len(questions) < 3:
                return {"response": "Failed to generate the test format correctly. Please try again."}

            update_web_user_state(web_user_id, mode="testing", step=0, metadata={
                "category": "ALL",
                "questions": questions,
                "answers": [],
                "total_questions": len(questions),
            })

            first_q = questions[0]
            msg = f"Comprehensive Test Started\n\nQuestion 1 of {len(questions)}:\n{first_q['text']}\n\nType your answer below:"
            return {"response": msg}

        except Exception as e:
            logger.error(f"Test generation error: {e}")
            return {"response": "Error generating test. Please try again."}

    # User is mid-test — prevent exit
    if text.lower() in ["/cancel", "cancel", "/menu", "menu", "exit", "quit", "/start"]:
        return {"response": "You cannot leave an active exam. Please answer the current question to proceed."}

    step = state.get(TblUserStates.CURRENT_STEP, 0)
    metadata = state.get(TblUserStates.METADATA, {}) or {}
    questions = metadata.get("questions", [])
    answers = metadata.get("answers", [])
    total_questions = metadata.get("total_questions", 3)

    # Record this answer
    answers.append(text)
    metadata["answers"] = answers

    # More questions remaining?
    if step + 1 < total_questions:
        next_step = step + 1
        update_web_user_state(web_user_id, "testing", step=next_step, metadata=metadata)

        q_data = questions[next_step]
        msg_text = f"Question {next_step + 1} of {total_questions}:\n{q_data['text']}\n\n"

        if q_data["type"] == "mcq":
            msg_text += "Options:\n"
            letters = ["A", "B", "C", "D"]
            for i, opt in enumerate(q_data["options"]):
                msg_text += f"{letters[i]}) {opt}\n"
            msg_text += "\nType the letter of your answer (A, B, C, or D):"
        else:
            msg_text += "Type your answer below:"

        log_chat_interaction(0, "web_user", text, msg_text, admin_id, mode="testing")
        return {"response": msg_text}

    # All questions answered — evaluate
    files = get_tenant_files(admin_id)
    test_context = "".join([f"\n--- SOURCE: {name} ---\n{data['text']}" for name, data in files.items()])

    qa_log = ""
    for i in range(total_questions):
        q_obj = questions[i]
        if q_obj["type"] == "mcq":
            options_str = " | ".join([f"{chr(65+idx)}) {opt}" for idx, opt in enumerate(q_obj["options"])])
            full_q_text = f"{q_obj['text']} \n[Options: {options_str}]"
            qa_log += f"Q{i+1} (MCQ): {full_q_text}\nUser Answer: {answers[i]}\n\n"
        else:
            qa_log += f"Q{i+1}: {q_obj['text']}\nUser Answer: {answers[i]}\n\n"

    eval_prompt = (
        f"You are an expert Sales Manager evaluating a trainee. Assess these {total_questions} answers based ONLY on the provided documents.\n\n"
        f"--- Q&A LOG ---\n{qa_log}\n--- END LOG ---\n\n"
        "Instructions for Evaluation:\n"
        f"1. Evaluate each answer. Award exactly 1 mark for each completely correct or highly effective answer (maximum {total_questions} marks).\n"
        "2. CRITICAL RULE: If a user's answer is blank, contains only punctuation, or is generic nonsense, you MUST mark it as INCORRECT (0 marks).\n"
        "3. For free-text and situational questions, provide the ideal benchmark strategy in 'correct_answer'.\n"
        "4. For MCQs, explicitly state the correct option in 'correct_answer'.\n"
        "5. In 'explanation', detail why the user's answer was correct or where it fell short.\n\n"
        "OUTPUT REQUIREMENTS (CRITICAL):\n"
        '1. Return a single valid JSON object only. No text before or after.\n'
        '2. Structure: {"score": int, "total": int, "results": [{"question": str, "user_answer": str, "correct_answer": str, "is_correct": bool, "explanation": str}]}\n'
    )

    try:
        response = await get_groq_response(eval_prompt, test_context, temperature=0.1)
        json_str = response.replace("```json", "").replace("```", "").strip()
        eval_data = json.loads(json_str)

        # Force Python to count the score (same as handlers.py)
        calculated_score = sum(1 for item in eval_data.get("results", []) if item.get("is_correct"))
        eval_data["score"] = calculated_score

        # Save test result
        save_test_result({
            "user_id": web_user_id,
            "admin_id": admin_id,
            "category": metadata.get("category", "ALL"),
            "qa_data": eval_data,
            "score": eval_data.get("score", 0),
            "total_questions": eval_data.get("total", total_questions),
            "remarks": str(eval_data.get("results", [])),
        })

        update_web_user_state(web_user_id, mode="use", step=0, metadata={})

        # Format detailed report
        report = f"OFFICIAL TEST REPORT | Score: {eval_data.get('score')}/{eval_data.get('total')}\n\n"
        for idx, res in enumerate(eval_data.get("results", [])):
            icon = "CORRECT" if res.get("is_correct") else "INCORRECT"
            report += (
                f"Q{idx+1}: {res.get('question', 'N/A')}\n"
                f"Your Answer: {res.get('user_answer', 'N/A')}\n"
                f"Correct Answer: {res.get('correct_answer', 'N/A')}\n"
                f"Result: {icon}\n"
                f"Explanation: {res.get('explanation', 'N/A')}\n"
                "---\n"
            )

        return {"response": report}

    except Exception as e:
        logger.error(f"Test evaluation error: {e}")
        update_web_user_state(web_user_id, mode="use", step=0, metadata={})
        return {"response": "Evaluation finished but there was a formatting error. Your answers have been recorded."}


# ═══════════════════════════════════════════════════════
# ASSISTANT MODE — same as before (knowledge base + LLM)
# ═══════════════════════════════════════════════════════

# Mode-specific directives (for assistant mode only now — other modes are fully stateful)
MODE_DIRECTIVES = {
    "assistant": "",
}


async def handle_assistant(req: ChatRequest) -> dict:
    """Standard RAG assistant — same engine as Telegram 'Use Assistant' mode."""
    admin_id = req.admin_id
    user_text = (req.message or "").strip()

    # Maintenance check
    try:
        settings = get_bot_settings(admin_id) or {}
    except Exception:
        settings = {}
    if settings.get("maintenance_mode"):
        return {"response": "The system is currently in maintenance mode. Please check back later.", "maintenance": True}
    temperature = settings.get("temperature", 0.2)

    # Constraints
    merged_constraints = {}
    try:
        merged_constraints = ConstraintExtractor.extract_constraints_from_text(user_text, req.telegram_id or 0)
    except Exception as e:
        logger.debug(f"Constraint extraction skipped: {e}")
    try:
        constraint_block = ConstraintExtractor.format_for_llm_context(merged_constraints)
    except Exception:
        constraint_block = ""

    full_context = (constraint_block + "\n\n" if constraint_block else "") + AI_RULES
    has_data = False

    # Knowledge cards (categorized)
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
            category = f.get("category") or "Our Products"
            if category not in VALID_CATEGORIES:
                logger.info(f"Skipping file '{f.get('filename')}' — unrecognized category: '{category}'")
                continue
            cards_res = (
                supabase.table("condensed_knowledge_cards")
                .select("card_json")
                .eq("file_id", f["id"])
                .execute()
            )
            if not cards_res.data:
                continue
            text_parts = "\n".join(
                json.dumps(c.get("card_json")) if isinstance(c.get("card_json"), (dict, list))
                else str(c.get("card_json"))
                for c in cards_res.data
                if c.get("card_json")
            )
            if not text_parts.strip():
                continue
            name = f.get("filename", "file")
            if category == "Our Products":
                our_products += f"\n\n--- OUR PRODUCT FILE: {name} ---\n{text_parts}"
            elif category == "Competitor Products":
                competitors += f"\n\n--- COMPETITOR FILE: {name} ---\n{text_parts}"
            elif category == "Price Lists":
                prices += f"\n\n--- PRICE LIST FILE: {name} ---\n{text_parts}"
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

    # Vector search fallback
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

    if not has_data:
        return {"response": "The knowledge base is currently empty. Please ask an Admin to upload documents first."}

    # LLM call
    try:
        response = await get_groq_response(user_text, full_context, temperature=temperature)
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return {"response": "I apologize, but I encountered an error processing that request."}

    # Validate constraints
    try:
        is_valid, violations = ConstraintValidator.validate_response(response, merged_constraints, req.telegram_id or 0)
        if not is_valid and violations:
            response += f"\n\n[System Note: Missing constraint - {violations[0]}]"
    except Exception:
        pass

    # Analytics
    analytics_mode = "normal"
    try:
        log_chat_interaction(req.telegram_id or 0, "web_user", user_text, response, admin_id, mode=analytics_mode)
    except Exception as e:
        logger.debug(f"Analytics log skipped: {e}")

    return {"response": response}


# ═══════════════════════════════════════════════════════
# MAIN ENDPOINT — routes to the correct stateful handler
# ═══════════════════════════════════════════════════════

@app.post("/chat")
async def chat(req: ChatRequest):
    admin_id = req.admin_id
    user_text = (req.message or "").strip()

    if not admin_id or not user_text:
        return {"response": "Missing admin_id or message."}

    # For stateful modes, we MUST have a web_user_id
    requested_mode = (req.mode or "assistant").lower()

    # If we have a web_user_id, check if the user is already IN a stateful flow
    # (even if the frontend sends mode="assistant", honor the active flow)
    active_mode = None
    state = None
    if req.web_user_id:
        state = get_web_user_state(req.web_user_id)
        if state:
            active_mode = state.get(TblUserStates.CURRENT_MODE)

    # Determine which handler to use:
    # 1. If user is mid-test, they're LOCKED IN (same as Telegram)
    # 2. If user explicitly requests a different mode, reset and start fresh
    # 3. If user is mid-flow and sends same mode, continue
    # 4. Otherwise, use assistant
    effective_mode = requested_mode

    if active_mode == "testing" and requested_mode != "testing":
        # LOCKED IN — cannot exit mid-exam (same as Telegram)
        effective_mode = "testing"
    elif active_mode in ("onboarding", "training") and requested_mode != active_mode:
        # User switched modes — reset their state so they can start fresh
        update_web_user_state(req.web_user_id, mode="use", step=0, metadata={})
        state = None  # Clear so the new handler treats this as first entry
    elif active_mode in ("onboarding", "training", "testing") and requested_mode == active_mode:
        # Continue the active flow
        effective_mode = active_mode
    elif requested_mode in ("onboarding", "training", "testing") and req.web_user_id:
        effective_mode = requested_mode

    # Route to the correct handler
    if effective_mode == "onboarding" and req.web_user_id:
        return handle_onboarding(req, state)
    elif effective_mode == "training" and req.web_user_id:
        return await handle_training(req, state)
    elif effective_mode == "testing" and req.web_user_id:
        return await handle_testing(req, state)
    else:
        return await handle_assistant(req)
