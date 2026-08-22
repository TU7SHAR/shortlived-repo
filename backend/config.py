import os
from dotenv import load_dotenv

load_dotenv()

ENV = os.getenv("ENVIRONMENT", "development")

# ═══════════════════════════════════════════════════════
# LLM CONFIGURATION — GEMINI ONLY
# Groq has been fully removed. All models were decommissioned
# and the free tier (12k TPM) is unusable for production.
# Gemini free tier: ~1B tokens/day on flash-lite models.
# ═══════════════════════════════════════════════════════
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
GEMINI_FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"]

# Legacy alias kept so handlers.py `from config import model` still works
model = GEMINI_MODEL

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
