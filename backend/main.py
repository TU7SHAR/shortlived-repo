import logging
import sys
import asyncio
from concurrent.futures import ThreadPoolExecutor
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters
from config import TELEGRAM_TOKEN, WEBHOOK_URL, PORT, WEBHOOK_SECRET_TOKEN
import handlers
from database import supabase

# ═══════════════════════════════════════════════════════
# PERFORMANCE: Increase thread pool from default 5 → 15
# This allows 15 concurrent LLM calls instead of 5
# (each LLM call blocks a thread for 2-8s)
# ═══════════════════════════════════════════════════════
asyncio.get_event_loop().set_default_executor(
    ThreadPoolExecutor(max_workers=15)
)

async def keep_supabase_alive(context):
    """Silently pings the database every 5 minutes to prevent connection drops."""
    try:
        supabase.table("bot_settings").select("id").limit(1).execute()
    except Exception as e:
        print(f"Heartbeat ping: {e}")

logging.basicConfig(
    format='[%(asctime)s] %(name)s | %(levelname)s | %(message)s',
    level=logging.INFO, 
    handlers=[
        logging.StreamHandler(sys.stdout) 
    ]
)
logger = logging.getLogger(__name__)

# Silence noisy pdfminer font warnings (benign, floods logs on every PDF upload)
logging.getLogger("pdfminer").setLevel(logging.ERROR)

def main() -> None:
    logger.info("Initializing Document Assistant Bot...")
    
    # PERFORMANCE: Removed PicklePersistence — eliminates disk I/O bottleneck,
    # prevents pickle corruption on unclean restarts (was causing 4000+ restart loops).
    # All critical state (user mode, constraints, onboarding) is already in Supabase.
    # bot_data/user_data are now ephemeral (rebuilt on demand from DB).
    application = Application.builder().token(TELEGRAM_TOKEN).build()
    
    application.add_error_handler(handlers.error_handler)
    application.job_queue.run_repeating(keep_supabase_alive, interval=300, first=10)
    application.add_handler(CommandHandler("start", handlers.start))
    application.add_handler(CommandHandler("menu", handlers.show_menu))
    application.add_handler(CommandHandler("onboard", handlers.start_onboarding_command))
    application.add_handler(CommandHandler("manage", handlers.manage_files))
    application.add_handler(CommandHandler("crawl", handlers.handle_crawl))
    # application.add_handler(CommandHandler("clearhistory", handlers.clear_history_command))
    application.add_handler(CommandHandler("restart", handlers.restart_command))
    application.add_handler(CommandHandler("manual", handlers.manual_command))
    # application.add_handler(CommandHandler("clearkey", handlers.clear_key_command))
    application.add_handler(CommandHandler("feedback", handlers.feedback_command))
    application.add_handler(CallbackQueryHandler(handlers.button_handler))
    application.add_handler(MessageHandler(filters.COMMAND, handlers.unknown_command))
    application.add_handler(MessageHandler(filters.Document.ALL, handlers.handle_document))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.handle_message))        
    
    logger.info(f"Starting Webhook on port {PORT}. Listening for Telegram...")
    
    application.run_webhook(
        listen="0.0.0.0",
        port=PORT,
        webhook_url=WEBHOOK_URL,
        url_path="webhook",
        secret_token=WEBHOOK_SECRET_TOKEN, 
     )

if __name__ == "__main__":
    main()