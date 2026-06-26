import os
from dotenv import load_dotenv

load_dotenv()

ENV = os.getenv("ENVIRONMENT", "development")

# ═══════════════════════════════════════════════════════
# LLM PROVIDER CONFIGURATION
# LLM_PROVIDER options:
#   auto   : (default) use whichever key is present & working,
#            with automatic runtime fallback to the other provider
#   groq   : prefer Groq (still falls back to Gemini if Groq fails)
#   gemini : prefer Gemini (still falls back to Groq if Gemini fails)
# ═══════════════════════════════════════════════════════
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto").lower()

# Groq config
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

# Gemini config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Legacy `model` variable kept for backward compatibility.
# Points to the active provider's model name.
if LLM_PROVIDER == "gemini":
    model = GEMINI_MODEL
else:
    model = GROQ_MODEL

# ═══════════════════════════════════════════════════════
# TELEGRAM
# ═══════════════════════════════════════════════════════
if ENV == "production":
    TELEGRAM_TOKEN = os.getenv("PROD_TELEGRAM_TOKEN")
    WEBHOOK_URL = os.getenv("PROD_WEBHOOK_URL")
    PORT = int(os.getenv("PORT", "8443"))
else:
    TELEGRAM_TOKEN = os.getenv("DEV_TELEGRAM_TOKEN")
    WEBHOOK_URL = os.getenv("DEV_WEBHOOK_URL")
    PORT = int(os.getenv("PORT", "8443"))

WEBHOOK_SECRET_TOKEN = os.getenv("WEBHOOK_SECRET_TOKEN")

# ═══════════════════════════════════════════════════════
# OTHER SERVICES
# ═══════════════════════════════════════════════════════
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
