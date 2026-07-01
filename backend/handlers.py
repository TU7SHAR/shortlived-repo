import hashlib
import re
import json
import logging
import tempfile
import asyncio
import os
import sys
import random 
import scraper
from functools import wraps
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.error import NetworkError, BadRequest
from scraper import scrape_single_url, crawl_website_links, extract_content
from groq_engine import get_groq_response
from constraint_extractor import ConstraintExtractor, ConstraintValidator
from context_ranker import ContextRanker
from sliding_window import SlidingWindowMemory
from data_condensation import ingest_file_condensed
from embedder import get_embedding
from database import search_knowledge_base
from groq_engine import get_groq_response

from database import supabase, get_bot_settings, log_chat_interaction, verify_and_authorize, is_authorized, check_auth_status, get_user_role, log_ingested_file, remove_ingested_file, get_google_id, clear_user_auth, get_user_state, update_user_state, save_onboarding_lead, get_active_filenames, save_test_result, get_onboarding_lead, validate_user_access, save_feedback, remove_all_ingested_files, find_relevant_context, get_user_constraints

from schema_map import TblUserStates, TblBotSettings, TblOnboarding, TblUsers, TblTokens

logger = logging.getLogger(__name__)
ALLOWED_CATEGORIES = ["Our Products", "Competitor Products", "Price Lists"]

MANUAL_TEXT = (
    "<b>SALESJI - THE ULTIMATE AI SALES ASSISTANT (MANUAL)</b>\n\n"
    "Salesji is designed to train, test, and assist your sales team using your company's proprietary data.\n\n"
    "<b>1. MAIN MODES</b>\n"
    "• <b>Build Repo Mode:</b> (Admin Only) Upload documents, manage files, or scrape websites to build the AI's knowledge base.\n"
    "• <b>Custom Mode:</b> Chat with the AI directly or add custom text snippets to the database.\n"
    "• <b>Use Assistant:</b> The primary mode for interacting with the AI and accessing the learning modules.\n\n"
    "<b>2. USE ASSISTANT: SUB-MODES</b>\n"
    "• <b>Onboarding:</b> Captures your profile, role, and core drive to personalize your training.\n"
    "• <b>Training Module:</b> Receive comprehensive, interactive AI training across all products and lists.\n"
    "• <b>Test Mode:</b> Evaluates your knowledge with text and multiple-choice questions tailored to your profile.\n\n"
    "<b>3. BASIC COMMANDS</b>\n"
    "• /start - Initialize your session\n"
    "• /menu - Display the interactive action menu\n"
    "• /manual - Show this detailed guide\n"
    "• /feedback [msg] - Send feedback to the developers\n"
    "• /crawl [url] - (Admin) Scrape a website into the knowledge base\n\n"
    "<i>Pro Tip: You can ask me directly how to use specific features! </i>"
)

TRAINING_ROLEPLAY_PROMPT = """
You are an expert AI Sales Trainer. We are conducting a live sales roleplay.
Product/Knowledge Base Context: {context}

Your job is twofold:
1. THE CUSTOMER: Act as a slightly skeptical, busy, but interested customer. Give the user realistic objections based on the context. Keep your response under 2 short sentences.
2. THE COACH: Evaluate the user's previous response. Did they handle your objection well? Did they use facts from the context?

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
[Customer]: (Your in-character response here)

[Coach Note]: (1 sentence of constructive feedback on their previous message)

User's Sales Pitch: {user_input}
"""


def require_auth(func):
    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        telegram_id = update.effective_user.id
        
        status = check_auth_status(telegram_id)
        
        if status == "banned":
            if update.callback_query:
                await update.callback_query.answer("Access Revoked: You are banned.", show_alert=True)
            elif update.message:
                await update.message.reply_text("Your access has been revoked by the administrator.")
            return
            
        if status == "unauthorized":
            if update.callback_query:
                await update.callback_query.answer("Access Denied.", show_alert=True)
            elif update.message:
                await update.message.reply_text("Access Denied. You must authenticate using a valid invite link first.")
            return
            
        if 'role' not in context.user_data:
            context.user_data['role'] = get_user_role(telegram_id)
        if 'mode' not in context.user_data:
            context.user_data['mode'] = 'feed' if context.user_data['role'] == 'admin' else 'use'
        if 'google_id' not in context.user_data:
            context.user_data['google_id'] = get_google_id(telegram_id)
            
        return await func(update, context, *args, **kwargs)
    return wrapper

async def get_category_keyboard():
    keyboard = [[InlineKeyboardButton(cat, callback_data=f"cat_{cat}")] for cat in ALLOWED_CATEGORIES]
    return InlineKeyboardMarkup(keyboard)

def get_knowledge_base_context(google_id):
    # This fetches the context from your database (using the logic your bot already uses)
    try:
        response = supabase.table("knowledge_base").select("content").eq("admin_id", google_id).execute()
        if response.data:
            return "\n".join([item['content'] for item in response.data])
        return "General Sales Knowledge"
    except Exception as e:
        return "General Sales Knowledge"

@require_auth
async def manual_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = await update.message.reply_html(MANUAL_TEXT) 
    try:
        await context.bot.pin_chat_message(chat_id=update.effective_chat.id, message_id=msg.message_id)
        context.user_data['pinned_manual_id'] = msg.message_id
    except Exception as e:
        logger.error(f"Could not pin manual message: {e}")
    if 'msg_ids' not in context.user_data:
        context.user_data['msg_ids'] = []
    context.user_data['msg_ids'].append(msg.message_id)
    try:
        await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
    except Exception:
        pass

async def loading_animation(message, text_prefix, progress_state=None):
    """Background task to update a Telegram message with a live timer AND terminal logs."""
    start_time = asyncio.get_event_loop().time()
    frames = ["⏳", "⌛"]
    frame_idx = 0
    while True:
        await asyncio.sleep(2.5) # Update every 2.5s for snappy feedback
        elapsed = int(asyncio.get_event_loop().time() - start_time)
        icon = frames[frame_idx % len(frames)]
        frame_idx += 1
        
        # Grab the live terminal log injected by the AI engine
        live_log = f"\n\n <b>Live Terminal Log:</b>\n<code>> {progress_state['msg']}</code>" if progress_state and 'msg' in progress_state else ""
        
        try:
            await message.edit_text(
                f"{icon} {text_prefix}{live_log}\n\n⏱<i>Time elapsed: {elapsed}s...</i>", 
                parse_mode="HTML"
            )
        except Exception:
            pass # Ignore Telegram's "Message is not modified" errors

async def feedback_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    telegram_id = user.id
    username = user.username or user.first_name or "Anonymous"
    
    admin_id = get_google_id(telegram_id)
    
    if not context.args:
        await update.message.reply_text(
            "How to use feedback:\n\n"
            "Please type your feedback directly after the command.\n"
            "Example: `/feedback The bot is really fast and helpful!`",
            parse_mode="Markdown"
        )
        return
        
    feedback_text = " ".join(context.args)
    
    success = save_feedback(telegram_id, username, feedback_text, admin_id)
    
    if success:
        await update.message.reply_text("Thank you! Your feedback has been successfully recorded to our team.")
    else:
        await update.message.reply_text("Sorry, there was an issue saving your feedback. Please try again later.")

def get_tenant_files(context: ContextTypes.DEFAULT_TYPE):
    """Fetches highly-condensed Knowledge Cards — CACHED (60s TTL)."""
    google_id = context.user_data.get('google_id')
    if not google_id:
        return {}
    
    # PERFORMANCE: Check cache first (saves ~500ms-2s per message)
    from cache import files_cache
    cache_key = f"tenant_files:{google_id}"
    cached = files_cache.get(cache_key)
    if cached is not None:
        return cached
        
    # Cache miss — fetch from DB
    from database import supabase
    try:
        files_res = supabase.table("ingested_files").select("id, filename, category").eq("admin_id", google_id).execute()
        
        ram_files = {}
        
        if files_res.data:
            for f in files_res.data:
                file_id = f["id"]
                fname = f["filename"]
                category = f["category"]
                
                cards_res = supabase.table("condensed_knowledge_cards").select("*").eq("file_id", file_id).execute()
                full_text = ""
                if cards_res.data:
                    import json
                    card_texts = []
                    for card in cards_res.data:
                        content = card.get("card_json") or card.get("card_data") or card.get("content")
                        if content:
                            card_text = json.dumps(content) if isinstance(content, dict) else str(content)
                            card_texts.append(card_text)
                    full_text = "\n".join(card_texts)
                
                ram_files[fname] = {
                    "filename": fname,
                    "file_id": file_id,
                    "text": full_text,
                    "category": category
                }
        
        # Store in cache
        files_cache.set(cache_key, ram_files)
        
        # Also update context RAM for backward compatibility
        context.bot_data.setdefault(google_id, {})["file_map"] = ram_files
        return ram_files
        
    except Exception as e:
        logger.error(f"Failed to load files from DB: {e}")
        return {}

async def deactivate_old_menu(context: ContextTypes.DEFAULT_TYPE, chat_id: int):
    last_id = context.user_data.get("last_menu_id")
    pinned_id = context.user_data.get("pinned_manual_id")
    
    if last_id and last_id != pinned_id:
        try:
            await context.bot.delete_message(chat_id=chat_id, message_id=last_id)
        except BadRequest:
            try:
                await context.bot.edit_message_reply_markup(chat_id=chat_id, message_id=last_id, reply_markup=None)
            except:
                pass
        context.user_data["last_menu_id"] = None

def get_main_menu_keyboard(role: str, mode: str):
    keyboard = []
    
    if role == "admin":
        modes_row = []
        if mode != "feed":
            modes_row.append(InlineKeyboardButton("Build Repo Mode", callback_data="mode_feed"))
        if mode != "test":
            modes_row.append(InlineKeyboardButton("Custom Mode", callback_data="mode_test"))
        if mode != "use":
            modes_row.append(InlineKeyboardButton("Use Assistant", callback_data="mode_use"))
        if modes_row:
            keyboard.append(modes_row)

        if mode == "feed":
            keyboard.append([InlineKeyboardButton("Upload File", callback_data="menu_upload")])
            keyboard.append([InlineKeyboardButton("Manage Stored Files", callback_data="menu_manage")])
            keyboard.append([InlineKeyboardButton("Crawl New Website", callback_data="menu_crawl")])

    if mode == "use":
        keyboard.append([InlineKeyboardButton("Start Onboarding", callback_data="start_onboarding")])
        keyboard.append([InlineKeyboardButton("Training Module", callback_data="start_training")])
        keyboard.append([InlineKeyboardButton("Start Test", callback_data="start_test")])

    if role == "admin":
        keyboard.append([InlineKeyboardButton("Support / Help", callback_data="support_help")])

    return InlineKeyboardMarkup(keyboard)

def get_menu_text(role: str, mode: str) -> str:
    display_mode = {
        "feed": "BUILD REPO MODE",
        "test": "CUSTOM MODE",
        "use": "USE ASSISTANT"
    }.get(mode, mode.upper())

    text = "SALESJI AI ASSISTANT\n\n"
    text += f"Role: {role.upper()}\n"
    text += f"Active Mode: {display_mode}\n\n"
    text += "Select an action below to continue:"
    
    return text

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    telegram_id = update.effective_user.id

    status = check_auth_status(telegram_id)
    if status == "banned":
        await update.message.reply_text("Your access has been revoked by the administrator. You are permanently blocked.")
        return

    if not context.args:
        await update.message.reply_text("Access Denied. Please use a valid invite link from the dashboard.")
        return

    token_id = context.args[0]
    telegram_username = update.effective_user.username or update.effective_user.first_name
    
    is_valid = verify_and_authorize(token_id, telegram_id, telegram_username)
    
    if not is_valid:
        await update.message.reply_text("This invite link is invalid or has already been used.")
        return

    role = get_user_role(telegram_id)
    google_id = get_google_id(telegram_id)
    
    context.user_data['role'] = role
    context.user_data['mode'] = 'feed' if role == 'admin' else 'use'
    context.user_data['google_id'] = google_id

    await deactivate_old_menu(context, chat_id)
    context.user_data["msg_ids"] = []
    
    intro_msg = await update.message.reply_html(MANUAL_TEXT)
    sent_msg = await update.message.reply_html(
        get_menu_text(role, context.user_data['mode']),
        reply_markup=get_main_menu_keyboard(role, context.user_data['mode'])
    )
    context.user_data["last_menu_id"] = sent_msg.message_id
    context.user_data["msg_ids"].extend([intro_msg.message_id, sent_msg.message_id])

@require_auth
async def show_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await deactivate_old_menu(context, update.effective_chat.id)
    role = context.user_data.get('role', 'normal')
    mode = context.user_data.get('mode', 'use')
    
    sent_msg = await update.message.reply_html(
        get_menu_text(role, mode), 
        reply_markup=get_main_menu_keyboard(role, mode)
    )
    
    context.user_data["last_menu_id"] = sent_msg.message_id
    if 'msg_ids' not in context.user_data:
        context.user_data['msg_ids'] = []
    context.user_data["msg_ids"].extend([sent_msg.message_id, update.message.message_id])

@require_auth
async def clear_history_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    role = context.user_data.get('role', 'normal')
    google_id = context.user_data.get('google_id')
    if role != 'admin' or not google_id:
        return
        
    chat_id = update.effective_chat.id
    
    if 'msg_ids' in context.user_data:
        for msg_id in context.user_data['msg_ids']:
            try:
                await context.bot.delete_message(chat_id=chat_id, message_id=msg_id)
            except Exception:
                pass
                
    context.user_data['msg_ids'] = []
    
    if google_id in context.bot_data:
        context.bot_data[google_id]["file_map"] = {}
        
    remove_all_ingested_files(google_id)
        
    bot_reply = await context.bot.send_message(
        chat_id=chat_id, 
        text="Total wipe successful. Screen, temporary memory, and Supabase storage erased."
    )
    context.user_data['msg_ids'].append(bot_reply.message_id)
    
    try:
        await context.bot.delete_message(chat_id=chat_id, message_id=update.message.message_id)
    except Exception:
        pass

@require_auth
async def restart_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    role = context.user_data.get('role', 'normal')
    if role != 'admin':
        return
    await update.message.reply_text("Restarting bot... Please wait.")
    os.execl(sys.executable, sys.executable, *sys.argv)

@require_auth
async def handle_crawl(update: Update, context: ContextTypes.DEFAULT_TYPE):
    google_id = context.user_data.get('google_id')
    
    if not context.args:
        await update.message.reply_text("Please provide a URL. Usage: /crawl https://example.com [spider]")
        return
        
    url = context.args[0]
    is_spider = len(context.args) > 1 and context.args[1].lower() == 'spider'
    
    status_msg = await update.message.reply_text(f"🕸️ Crawling `{url}`...")
    context.user_data.setdefault('msg_ids', []).append(status_msg.message_id)
    
    try:
        if is_spider:
            result = crawl_website_links(start_url=url, max_pages=10, admin_id=google_id)
        else:
            result = scrape_single_url(url, admin_id=google_id)
        
        if result.get('success'):
            # THE FIX: We must explicitly pull the chunks and embeddings from the result dictionary
            # and inject them into the pending_task state so they survive the button click.
            context.user_data['pending_task'] = {
                "type": "crawl",
                "data": {
                    "website_name": result.get("website_name", url.replace("https://", "").replace("http://", "")),
                    "chunks": result.get('chunks', []),
                    "embeddings": result.get('embeddings', [])
                }
            }
            
            await status_msg.edit_text(
                f"✅ Crawl complete! Pages: {result.get('urls_crawled', 1)}\nChunks saved: {result.get('chunks_saved', 0)}\n\nSelect category:",
                reply_markup=await get_category_keyboard()
            )
        else:
            await status_msg.edit_text("❌ Crawl failed or returned no data.")
            
    except Exception as e:
        logger.error(f"Error handling crawl: {e}")
        await status_msg.edit_text(f"❌ System error: {str(e)[:50]}")

@require_auth
async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processes uploaded files and asks for category."""
    document = update.message.document

    if document.file_size > 20 * 1024 * 1024:
        await update.message.reply_text("File is too large. Please upload a file smaller than 20MB.")
        return

    status_msg = await update.message.reply_text(f"📥 Received <b>{document.file_name}</b>...", parse_mode="HTML")
    
    # Start the live background timer
    timer_task = asyncio.create_task(loading_animation(status_msg, f"Downloading & extracting text from <b>{document.file_name}</b>..."))

    try:
        file = await context.bot.get_file(document.file_id)
        file_bytes = await file.download_as_bytearray()
        
        try:
            file_content, is_truncated, processed, unprocessed = await extract_content(bytes(file_bytes), document.file_name)
        except Exception as e:
            timer_task.cancel() # Kill timer on error
            logger.error(f"Text extraction failed for {document.file_name}: {e}")
            await status_msg.edit_text(f"❌ Could not extract text from `{document.file_name}`. Make sure it's a valid document.")
            return

        if not file_content or not file_content.strip():
            timer_task.cancel() # Kill timer on error
            await status_msg.edit_text("❌ Could not extract any readable text from the file.")
            return

        # THE FIX: Store a single, clean pending task
        context.user_data['pending_task'] = {
            "type": "doc",
            "filename": document.file_name,
            "text": file_content
        }
        
        timer_task.cancel() # Kill timer on success
        
        # Ask for category
        await status_msg.edit_text(
            f"✅ File processed: `{document.file_name}`\n\nSelect category:",
            reply_markup=await get_category_keyboard()
        )

    except Exception as e:
        timer_task.cancel() # Kill timer on error
        logger.error(f"Error handling document: {e}")
        await status_msg.edit_text(f"❌ Error: {str(e)[:80]}")

@require_auth
async def manage_files(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    role = context.user_data.get('role', 'normal')
    if role != 'admin':
        return
        
    effective_message = update.callback_query.message if update.callback_query else update.message
    await deactivate_old_menu(context, update.effective_chat.id)
    
    # This will now trigger the new, non-filtered fetch
    files = get_tenant_files(context)
    
    if not files:
        msg = await effective_message.reply_text("Your Private Knowledge Base is empty.")
        context.user_data.setdefault('msg_ids', []).append(msg.message_id)
        return
        
    context.user_data["id_map"] = {}
    keyboard = []
    
    for name in files.keys():
        # Create a stable ID for the button
        short_id = hashlib.md5(name.encode()).hexdigest()[:10]
        context.user_data["id_map"][short_id] = name
        
        keyboard.append([
            InlineKeyboardButton(f"DL {name[:15]}", callback_data=f"dl_{short_id}"),
            InlineKeyboardButton(f"Del", callback_data=f"del_{short_id}")
        ])
    
    keyboard.append([InlineKeyboardButton("Back", callback_data="back_to_main")])
    sent_msg = await effective_message.reply_html(f"<b>Manage Tenant Files</b> ({len(files)} files)", reply_markup=InlineKeyboardMarkup(keyboard))
    context.user_data["last_menu_id"] = sent_msg.message_id
    context.user_data.setdefault('msg_ids', []).append(sent_msg.message_id)

@require_auth
async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    
    try:
        await query.answer()
    except Exception as e:
        logger.warning(f"Ignored query.answer() timeout (queue was backed up): {e}")
    
    chat_id = query.message.chat_id
    role = context.user_data.get("role", "normal")
    mode = context.user_data.get("mode", "use")
    google_id = context.user_data.get("google_id")
    files = get_tenant_files(context)
    id_map = context.user_data.get("id_map", {})
    
    if google_id:
        active_filenames = get_active_filenames(google_id)
        if active_filenames is not None:
            files_to_remove = [name for name in list(files.keys()) if name not in active_filenames]
            for name in files_to_remove:
                del files[name]

    async def send_new_msg(text, reply_markup=None, parse_mode="HTML"):
        msg = await context.bot.send_message(
            chat_id=chat_id, 
            text=text, 
            reply_markup=reply_markup, 
            parse_mode=parse_mode
        )
        if 'msg_ids' not in context.user_data:
            context.user_data['msg_ids'] = []
        context.user_data['msg_ids'].append(msg.message_id)
        return msg

    async def disable_old_buttons():
        try:
            await query.edit_message_reply_markup(reply_markup=None)
        except Exception:
            pass

    if query.data.startswith("mode_"):
        await disable_old_buttons()
        new_mode = query.data.split("_")[1]
        context.user_data["mode"] = new_mode
        
        update_user_state(update.effective_user.id, mode="use", step=0, metadata={})

        await send_new_msg(
            text=get_menu_text(role, new_mode),
            reply_markup=get_main_menu_keyboard(role, new_mode)
        )
        
    elif query.data == "menu_upload":
        await query.answer()
        await disable_old_buttons()
        keyboard = [[InlineKeyboardButton("Back to Menu", callback_data="back_to_main")]]
        upload_text = (
            "📁 <b>How to Upload Files</b>\n\n"
            "Click the 📎 <b>Attachment/Clipboard icon</b> in your chat input area and select the file you want to upload (e.g., product manuals, PDFs, or text files).\n\n"
            "The AI will automatically process and condense it!"
        )
        await send_new_msg(text=upload_text, reply_markup=InlineKeyboardMarkup(keyboard))
        
    elif query.data == "menu_crawl":
        await query.answer()
        await disable_old_buttons()
        keyboard = [[InlineKeyboardButton("Back to Menu", callback_data="back_to_main")]]
        crawl_text = (
            "🕸️ <b>How to Crawl a Website</b>\n\n"
            "Type the command directly in the chat. Here are your options:\n\n"
            "• <code>/crawl example.com</code> (Scrapes a single page)\n"
            "• <code>/crawl example.com spider</code> (Deep search, scans up to 10 pages)\n"
            "• <code>/crawl example.com/sitemap.xml</code> (Scrapes using the site's XML sitemap)"
        )
        await send_new_msg(text=crawl_text, reply_markup=InlineKeyboardMarkup(keyboard))

    elif query.data == "support_help":
        await disable_old_buttons()
        keyboard = [[InlineKeyboardButton("Back to Menu", callback_data="back_to_main")]]
        support_text = (
            "<b>Support & Help Center</b>\n\n"
            "<i>This feature will be ready in the future. Help is coming soon!</i>\n\n"
            "In the meantime, you can type <code>/feedback [your message]</code> in the chat."
        )
        await send_new_msg(text=support_text, reply_markup=InlineKeyboardMarkup(keyboard))
        
    elif query.data.startswith("dl_"):
        try:
            await query.answer()
        except:
            pass
            
        await disable_old_buttons()
        filename = query.data[3:]
        
        # Resolve the short hash back to the real filename
        real_filename = id_map.get(filename, filename)
        
        await query.message.edit_text(f"⏳ Extracting {real_filename} from the database...")
        
        try:
            import io
            import json
            
            file_buffer = None
            
            # Get file_id from ingested_files by filename
            file_lookup = supabase.table("ingested_files").select("id").eq("filename", real_filename).eq("admin_id", google_id).execute()
            lookup_file_id = file_lookup.data[0]["id"] if file_lookup.data else None
            
            # 1. Try to fetch the Condensed Knowledge Card by file_id
            card_res = None
            if lookup_file_id:
                card_res = supabase.table("condensed_knowledge_cards").select("*").eq("file_id", lookup_file_id).execute()
            
            if card_res and card_res.data:
                card_record = card_res.data[0]
                content = None
                
                # Dynamically find the JSON column
                for key, value in card_record.items():
                    if isinstance(value, dict):
                        content = value
                        break
                    elif key not in ['id', 'admin_id', 'created_at', 'card_id', 'file_id'] and isinstance(value, str) and "{" in value:
                        try:
                            content = json.loads(value)
                            break
                        except:
                            pass
                            
                if content:
                    content_str = json.dumps(content, indent=2) if isinstance(content, dict) else str(content)
                    file_buffer = io.BytesIO(content_str.encode('utf-8'))
            
            # 2. If no card exists, fetch the raw File Chunks by file_id
            if not file_buffer and lookup_file_id:
                chunks_res = supabase.table("file_chunks").select("content").eq("file_id", lookup_file_id).order("chunk_index").execute()
                    
                if chunks_res.data:
                    content_str = "\n\n---\n\n".join([c.get("content", "") for c in chunks_res.data])
                    file_buffer = io.BytesIO(content_str.encode('utf-8'))
                    
            # 3. Send the reconstructed database content as a downloadable file
            if file_buffer:
                safe_name = real_filename if real_filename.endswith(('.md', '.txt', '.json', '.csv')) else f"{real_filename}.md"
                
                # IMPORTANT: Set the stream position back to 0 before sending
                file_buffer.seek(0)
                
                await query.message.reply_document(
                    document=file_buffer,
                    filename=safe_name,
                    caption=f"✅ Extracted database content for: {real_filename}"
                )
                await query.message.edit_text("✅ Download ready.")
            else:
                # 4. Final fallback
                files_res = supabase.table("ingested_files").select("*").eq("filename", real_filename).execute()
                data = files_res.data[0] if files_res.data else {}
                file_id = data.get("telegram_file_id") or data.get("file_id")
                
                if file_id and isinstance(file_id, str):
                    await query.message.reply_document(document=file_id, caption=f"📄 {real_filename}")
                    await query.message.edit_text("✅ Download ready.")
                else:
                    await query.message.edit_text(f"❌ No content found in database for {real_filename}.")
                    
        except Exception as e:
            logger.error(f"Download failed for {real_filename}: {e}")
            await query.message.edit_text(f"❌ Error preparing file: {e}")
   
    elif query.data == "menu_manage":
        await disable_old_buttons()
        await manage_files(update, context)
        
    elif query.data == "back_to_main":
        await disable_old_buttons()
        await send_new_msg(
            text=get_menu_text(role, mode),
            reply_markup=get_main_menu_keyboard(role, mode)
        )
 
    elif query.data == "clear_all":
        if 'msg_ids' in context.user_data:
            for msg_id in context.user_data['msg_ids']:
                try: await context.bot.delete_message(chat_id=chat_id, message_id=msg_id)
                except: pass
        context.user_data['msg_ids'] = []
        if google_id in context.bot_data: context.bot_data[google_id]["file_map"] = {}
        await send_new_msg(" Wipe successful. All temporary memory erased.")
        
    elif query.data.startswith("del_"):
        await disable_old_buttons()
        filename = id_map.get(query.data.replace("del_", ""))
        
        if not filename:
            await send_new_msg(" Error: Menu expired due to a server restart. Please type /manage to generate a fresh list.")
            return
            
        success = remove_ingested_file(filename, google_id)
        
        if success:
            await send_new_msg(f" Removed File: <b>{filename}</b>")
        else:
            await send_new_msg(f" Database error: Could not remove <b>{filename}</b>")
            
        await manage_files(update, context)

    elif query.data.startswith("cat_"):
        # Prevent the "Query is too old" Telegram timeout crash
        try:
            await query.answer()
        except:
            pass
            
        await disable_old_buttons()
        category = query.data.split("_")[1]
        
        data = context.user_data.pop('pending_task', None)
        
        if not data:
            await query.message.edit_text("❌ Error: Session expired. Please upload or crawl again.")
            return
            
        admin_id = context.user_data.get('google_id')
        
        if data.get("type") == "doc":
            # START THE LIVE TIMER FOR AI CONDENSATION
            timer_text = f"<b>Condensing & Structuring Data...</b>\n\nBuilding AI Knowledge Graph for <b>{category}</b>.\n<i>This may take 1-3 minutes depending on file size.</i>"
            timer_task = asyncio.create_task(loading_animation(query.message, timer_text))
            
            try:
                from data_condensation import ingest_file_condensed
                success, metrics = await ingest_file_condensed(
                    filename=data['filename'],
                    file_content=data['text'],
                    admin_id=admin_id,
                    uploaded_by_id=update.effective_user.id,
                    uploaded_by_username=update.effective_user.username or "unknown",
                    category=category
                )
                
                timer_task.cancel() # Stop the timer
                
                if success:
                    # Force RAM refresh + invalidate cache
                    if admin_id in context.bot_data:
                        context.bot_data[admin_id]["file_map"] = {}
                    from cache import files_cache
                    files_cache.invalidate(f"tenant_files:{admin_id}")
                    files_cache.invalidate(f"filenames:{admin_id}")
                    
                    await query.message.edit_text(
                        f"✅ <b>Success!</b>\nSaved <code>{data['filename']}</code> to <b>{category}</b>.\n⏱️ <i>Time taken: ~{int(metrics.processing_time_seconds)}s</i>", 
                        parse_mode="HTML"
                    )
                else:
                    await query.message.edit_text("❌ Failed to ingest file.")
            except Exception as e:
                timer_task.cancel() # Stop the timer
                await query.message.edit_text(f"❌ Error during AI processing: {e}")
        
        elif data.get("type") == "crawl":
            crawl_data = data.get("data", {})
            all_chunks = crawl_data.get("chunks", [])
            all_embeddings = crawl_data.get("embeddings", [])
            website_name = crawl_data.get("website_name", "Website_Crawl")
            
            if not all_chunks:
                await query.message.edit_text("❌ Error: No data found to condense from this crawl. (Make sure scraper is returning 'chunks').")
                return

            # Initialize Live Logging State
            progress_state = {"msg": "Initializing clustering engine..."}
            timer_text = f"<b>Condensing Website: {website_name}</b>\n\nAI is organizing your web crawl data."
            timer_task = asyncio.create_task(loading_animation(query.message, timer_text, progress_state))
            
            try:
                from data_condensation import DataCondensationEngine, CondensationDatabaseManager
                
                # 1. Run the Semantic Cluster and Condensation Engine
                master_card, embedding_anchors, metrics = DataCondensationEngine.process_website_clusters(
                    website_name=website_name,
                    all_chunks=all_chunks,
                    all_embeddings=all_embeddings,
                    admin_id=admin_id,
                    uploaded_by_username=update.effective_user.username or "unknown"
                )
                
                # 2. Save everything using the Database Manager
                success = CondensationDatabaseManager.save_condensed_file(
                    filename=f"Website_Crawl_{website_name}.md",
                    knowledge_card=master_card,
                    embedding_anchors=embedding_anchors,
                    metrics=metrics,
                    admin_id=admin_id,
                    uploaded_by_id=update.effective_user.id,
                    uploaded_by_username=update.effective_user.username or "unknown",
                    category=category,
                    raw_chunks=all_chunks,
                    progress_state=progress_state
                )
                
                timer_task.cancel()
                
                if success:
                    if admin_id in context.bot_data:
                        context.bot_data[admin_id]["file_map"] = {}
                    from cache import files_cache
                    files_cache.invalidate(f"tenant_files:{admin_id}")
                    files_cache.invalidate(f"filenames:{admin_id}")
                    await query.message.edit_text(
                        f"✅ <b>Success!</b>\nSaved crawled data to <b>{category}</b>.\n⏱️ <i>Time: ~{int(metrics.processing_time_seconds)}s</i>", 
                        parse_mode="HTML"
                    )
                else:
                    await query.message.edit_text("❌ Failed to condense website data.")
            except Exception as e:
                timer_task.cancel()
                logger.error(f"Website condensation failed: {e}")
                await query.message.edit_text(f"❌ Website condensation error: {e}")
        else:
            await query.message.edit_text("❌ Error: Unknown task type.")
    
    elif query.data == "start_onboarding":
        await disable_old_buttons()
        telegram_id = update.effective_user.id
        existing_lead = get_onboarding_lead(telegram_id)
        if existing_lead:
            await send_new_msg("<b>You have already completed onboarding!</b> You are all set to use the bot.")
            return

        update_user_state(telegram_id, mode="onboarding", step=1)
        await send_new_msg(" <b>Welcome to Onboarding!</b> Let's get you set up.\n\nFirst, what is your full name?")

    elif query.data == "start_training":
        await disable_old_buttons()
        telegram_id = update.effective_user.id
        
        # Reset any previous training counters
        context.user_data['training_turns'] = 0
        
        intro_message = (
            "🎓 <b>Welcome to the Sales Training Module</b>\n\n"
            "Let's get you up to speed quickly.\n\n"
            "First, I will give you a very short, simple summary of our products and key features. "
            "Then, I will ask you a few normal questions to make sure you understand the basics.\n\n"
            "<i>Are you ready to begin? Reply with 'Ready' to start!</i>"
        )
        
        # Set backend state to trigger handle_training_step on the next message
        update_user_state(telegram_id, mode="training", step=1, metadata={"category": "ALL"})
        
        await send_new_msg(intro_message)
  
    elif query.data == "start_test":
        await disable_old_buttons()
        telegram_id = update.effective_user.id
        
        status_msg = await send_new_msg(" Generating your customized comprehensive test... Please wait.")
        
        lead_data = get_onboarding_lead(telegram_id)
        passion = lead_data.get(TblOnboarding.PASSION, 'achieving career success') if lead_data else 'achieving career success'
        
        lead_data = get_onboarding_lead(telegram_id)
        passion = lead_data.get(TblOnboarding.PASSION, 'achieving career success') if lead_data else 'achieving career success'
        
        category = "ALL" # Explicitly define this for the loop
        
        # Dynamically separate our products, competitors, and pricing based on Admin categories
        our_products_list = []
        competitor_list = []
        price_list = []
        test_context = ""
        
        for name, data in files.items():
            cat = data.get('category', 'Our Products')
            if cat == 'Our Products':
                our_products_list.append(name)
            elif cat == 'Competitive List':
                competitor_list.append(name)
            elif cat == 'Price List':
                price_list.append(name)
            
            # If in a specific category test, only add relevant files, otherwise add all
            if category == "ALL" or data.get('category') == category:
                test_context += f"\n\n--- SOURCE: {name} ({cat}) ---\n{data['text']}"
                
        if not test_context:
            await status_msg.edit_text(" No documents found in your repository.", parse_mode="HTML")
            return
            
        our_products_str = ", ".join(our_products_list) if our_products_list else "our core products"
        competitor_str = ", ".join(competitor_list) if competitor_list else "competitor products"
        price_str = ", ".join(price_list) if price_list else "pricing documentation"

        prompt = f"""Based ONLY on these documents, generate a dynamic sales test with EXACTLY 9 questions. Do NOT use line breaks inside a question.

        --- CRITICAL CORPORATE ALIGNMENT ---
        The trainee taking this test is an employee of OUR company. Our company's products are detailed in the files marked as 'Our Products' (e.g., {our_products_str}). 
        Files marked as 'Competitive List' (e.g., {competitor_str}) represent market competitors. The trainee must NEVER pitch competitor products; they must strictly defend OUR products against them.
        Files marked as 'Price List' (e.g., {price_str}) contain our pricing, tiers, or promotions. Use this to test the trainee's ability to defend our pricing, pitch ROI, or use anchoring strategies.

        REQUIREMENTS:
        - 4 Subjective/Theoretical questions about OUR products, pricing strategies, and how our specifications crush the market. Format exactly on a single line:
        TEXT_Q::: [Question Text]

        - 3 Multiple Choice Questions (MCQs) integrating the user's core passion: "{passion}", framed as situational sales strategies. Format exactly on a single line:
        MCQ::: [Question Text] ||| [Option A] ||| [Option B] ||| [Option C] ||| [Option D]

        - 2 Real-World Situational Roleplays. They must be highly emotional, specific scenarios testing our value proposition. Format exactly on a single line using SITUATION:::
          
          1. Q8 (CUSTOMER POV Scenario): Craft a specific scenario where a customer walks in carrying a heavy emotion (skeptical, angry about price based on our Price List, anxious about tech) accompanied by someone else (spouse, boss, friend). The question must ask the trainee exactly how they will tackle that specific emotional dynamic and pricing objection using OUR data.
          
          2. Q9 (EMPLOYEE POV Scenario): Craft an active outreach scenario where the salesman must go to the customer (e.g., approaching a lead at a convention, visiting a corporate client, or handling a hostile phone call). The client must actively throw out a competitor's advantage (like a feature or price point from {competitor_str}), and the question must ask the trainee exactly how they will handle the objection and pivot back to our supremacy.
        """
        try:
            response = await get_groq_response(prompt, test_context, temperature=0.3)
            
            questions = []
            for line in response.split('\n'):
                line = line.strip()
                if line.startswith("TEXT_Q:::"):
                    questions.append({
                        "type": "text", 
                        "text": line.replace("TEXT_Q:::", "").strip()
                    })
                elif line.startswith("SITUATION:::"):
                    questions.append({
                        "type": "text", 
                        "text": line.replace("SITUATION:::", "").strip()
                    })
                elif line.startswith("MCQ:::"):
                    parts = line.replace("MCQ:::", "").split("|||")
                    if len(parts) >= 5:
                        questions.append({
                            "type": "mcq", 
                            "text": parts[0].strip(), 
                            "options": [p.strip() for p in parts[1:5]]
                        })
            
            if len(questions) < 3:
                await status_msg.edit_text(" Failed to generate the test format correctly. Please try again.")
                return
                
            update_user_state(telegram_id, mode="testing", step=0, metadata={
                "category": "ALL", 
                "questions": questions,
                "answers": [],
                "total_questions": len(questions)
            })
            
            first_q = questions[0]
            await status_msg.edit_text(
                f" <b>Comprehensive Test Started</b>\n\n<b>Question 1 of {len(questions)}:</b>\n{first_q['text']}\n\n<i>Type your answer below:</i>",
                parse_mode="HTML"
            )
        except Exception as e:
            logger.error(f"Test generation error: {e}")
            await status_msg.edit_text(" Error generating test.")

    elif query.data.startswith("testcat_"):
        await disable_old_buttons()
        category = query.data.split("_")[1]
        telegram_id = update.effective_user.id
        
        status_msg = await send_new_msg(f" Generating your customized test from <b>{category}</b>... Please wait.")
        
        lead_data = get_onboarding_lead(telegram_id)
        passion = lead_data.get(TblOnboarding.PASSION, 'achieving career success') if lead_data else 'achieving career success'
        
        # Dynamically separate our products, competitors, and pricing based on Admin categories
        our_products_list = []
        competitor_list = []
        price_list = []
        test_context = ""
        
        for name, data in files.items():
            cat = data.get('category', 'Our Products')
            if cat == 'Our Products':
                our_products_list.append(name)
            elif cat == 'Competitive List':
                competitor_list.append(name)
            elif cat == 'Price List':
                price_list.append(name)
            
            if data.get('category') == category:
                test_context += f"\n\n--- SOURCE: {name} ({cat}) ---\n{data['text']}"
                
        if not test_context:
            await status_msg.edit_text(f" No documents found in <b>{category}</b>.", parse_mode="HTML")
            return
            
        our_products_str = ", ".join(our_products_list) if our_products_list else "our core products"
        competitor_str = ", ".join(competitor_list) if competitor_list else "competitor products"
        price_str = ", ".join(price_list) if price_list else "pricing documentation"
        
        num_mcqs = random.randint(0, 4)
        total_questions = 3 + num_mcqs
        
        prompt = f"""Based ONLY on these documents, generate a test with EXACTLY {total_questions} questions. Do NOT use line breaks inside a question.

        --- CRITICAL CORPORATE ALIGNMENT ---
        The trainee taking this test is an employee of OUR company. Our company's products are detailed in the files marked as 'Our Products' (e.g., {our_products_str}). 
        Files marked as 'Competitive List' (e.g., {competitor_str}) represent market competitors. The trainee must NEVER pitch competitor products; they must strictly defend OUR products against them.
        Files marked as 'Price List' (e.g., {price_str}) contain our pricing, tiers, or promotions. Use this to test the trainee's ability to defend our pricing, pitch ROI, or use anchoring strategies.

        REQUIREMENTS:
        - Questions 1 to 3 MUST be theoretical free-text questions about the documents. Format each exactly like this on a single line:
        TEXT_Q::: [Question Text]
        """
        
        if num_mcqs > 0:
            prompt += f"""
        - The remaining {num_mcqs} questions MUST be Multiple Choice Questions (MCQs).
        - The MCQs MUST integrate the user's core passion/drive, which is: "{passion}". Frame the MCQs as situational sales scenarios combining the documents with their passion. Do NOT ask about their basic personal details.
        - Format each MCQ exactly like this on a single line:
        MCQ::: [Question Text] ||| [Option A] ||| [Option B] ||| [Option C] ||| [Option D]
        """

        try:
            response = await get_groq_response(prompt, test_context, temperature=0.3)
            
            questions = []
            for line in response.split('\n'):
                line = line.strip()
                if line.startswith("TEXT_Q:::"):
                    questions.append({
                        "type": "text", 
                        "text": line.replace("TEXT_Q:::", "").strip()
                    })
                elif line.startswith("MCQ:::"):
                    parts = line.replace("MCQ:::", "").split("|||")
                    if len(parts) >= 5:
                        questions.append({
                            "type": "mcq", 
                            "text": parts[0].strip(), 
                            "options": [p.strip() for p in parts[1:5]]
                        })
            
            if len(questions) < 3:
                await status_msg.edit_text(" Failed to generate the test format correctly. Please try again.")
                return
                
            update_user_state(telegram_id, "testing", step=0, metadata={
                "category": category,
                "questions": questions,
                "answers": [],
                "total_questions": len(questions)
            })
            
            first_q = questions[0]
            await status_msg.edit_text(
                f" <b>Test Started: {category}</b>\n\n<b>Question 1 of {len(questions)}:</b>\n{first_q['text']}\n\n<i>Type your answer below:</i>",
                parse_mode="HTML"
            )
        except Exception as e:
            logger.error(f"Test generation error: {e}")
            await status_msg.edit_text(" Error generating test.")

@require_auth
async def start_onboarding_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    existing_lead = get_onboarding_lead(telegram_id)
    if existing_lead:
        await update.message.reply_text("You have already completed onboarding! You are all set.")
        return
    update_user_state(telegram_id, mode="onboarding", step=1)
    await update.message.reply_text("Welcome to Onboarding! Let's get you set up.\n\nFirst, what is your full name?")

async def handle_onboarding_step(update: Update, context: ContextTypes.DEFAULT_TYPE, state: dict):
    step = state[TblUserStates.CURRENT_STEP]
    text = update.message.text.strip()  # Strip whitespace
    metadata = state.get(TblUserStates.METADATA, {})
    t_id = update.effective_user.id

    if step == 1:
        # VALIDATION: Name must be alphabetic and longer than 2 chars
        clean_name = text.replace(" ", "")
        if len(clean_name) < 2 or not clean_name.isalpha():
            await update.message.reply_text(" Please enter a valid name (letters and spaces only).")
            return
            
        metadata['full_name'] = text
        update_user_state(t_id, "onboarding", step=2, metadata=metadata)
        await update.message.reply_text(f"Nice to meet you, {text}! What's the best phone number to reach you at?")
    
    elif step == 2:
        # VALIDATION: Phone must be mostly digits and reasonable length
        clean_phone = text.replace("+", "").replace("-", "").replace(" ", "")
        if not clean_phone.isdigit() or len(clean_phone) < 7 or len(clean_phone) > 15:
            await update.message.reply_text(" Please enter a valid phone number (e.g., +1234567890).")
            return
            
        metadata['phone_number'] = text
        update_user_state(t_id, "onboarding", step=3, metadata=metadata)
        await update.message.reply_text("Got it. What is your current role or job title in the company?")
        
    elif step == 3:
        # VALIDATION: Ensure they typed something meaningful
        if len(text) < 2:
            await update.message.reply_text(" Please enter a valid role or job title.")
            return
            
        metadata['role'] = text
        update_user_state(t_id, "onboarding", step=4, metadata=metadata)
        await update.message.reply_text("Great! How many years of experience do you have in sales?")
        
    elif step == 4:
        # VALIDATION: Ensure it's not a massive block of text
        if len(text) < 1 or len(text) > 30:
            await update.message.reply_text(" Please provide a brief answer for your experience (e.g., '5 years').")
            return
            
        metadata['experience_level'] = text
        update_user_state(t_id, "onboarding", step=5, metadata=metadata)
        await update.message.reply_text("Understood. What is your primary goal for using this AI assistant?")

    elif step == 5:
        if len(text) < 3:
            await update.message.reply_text(" Please provide a bit more detail about your goal.")
            return
            
        metadata['goal'] = text
        update_user_state(t_id, "onboarding", step=6, metadata=metadata)
        await update.message.reply_text(
            "Awesome. Finally, tell me a bit about yourself—what is your passion, or what drives you to succeed in your career?"
        )

    elif step == 6:
        if len(text) < 3:
            await update.message.reply_text(" Please provide a bit more detail about what drives you.")
            return
            
        google_id = context.user_data.get('google_id') 
        
        user_record = supabase.table(TblUsers.TABLE).select(TblUsers.TOKEN_ID).eq(TblUsers.ID, t_id).execute()
        active_token_id = user_record.data[0].get(TblUsers.TOKEN_ID) if user_record.data else None
        
        try:
            save_onboarding_lead({
                TblOnboarding.TELEGRAM_ID: t_id,
                TblOnboarding.FULL_NAME: metadata.get('full_name', 'Unknown'),
                TblOnboarding.PHONE_NUMBER: metadata.get('phone_number', 'Unknown'),
                TblOnboarding.ROLE: metadata.get('role', 'Unknown'),
                TblOnboarding.EXPERIENCE_LEVEL: metadata.get('experience_level', 'Unknown'),
                TblOnboarding.GOAL: metadata.get('goal', 'Unknown'),
                TblOnboarding.PASSION: text,
                TblOnboarding.ADMIN_ID: google_id,
                TblOnboarding.TOKEN_ID: active_token_id 
            })
            
            update_user_state(t_id, mode="use", step=0, metadata={})
            
            tutorial_text = (
                "<b>Profile Locked In!</b>\n\n"
                "Welcome aboard. I am your Sales Assistant. Here is how you can use me to crush your goals:\n\n"
                "<b>Ask Anything:</b> Just type a question (e.g., <i>'What are our pricing tiers?'</i>) and I will pull the exact answer from our company knowledge base.\n"
                "<b>Sales Training:</b> Need to brush up on a topic? We have bite-sized training modules based on real company documents.\n"
                "<b>Navigation:</b> If you ever get lost, just type <code>/menu</code> to pull up your options.\n\n"
                "Let's get to work! What do you need help with today?"
            )
            await update.message.reply_html(tutorial_text) 
        except Exception as e:
            logger.error(f"Failed to save onboarding: {e}")
            await update.message.reply_text(" An error occurred while saving your profile. You may have already onboarded, or there is a database issue.")
            update_user_state(t_id, mode="use", step=0, metadata={})

async def handle_test_step(update: Update, context: ContextTypes.DEFAULT_TYPE, state: dict):
    text = update.message.text
    t_id = update.effective_user.id
    
    # LOCK USER IN: Prevent exiting mid-exam
    if text.lower() in ["/cancel", "cancel", "/menu", "menu", "exit", "quit", "/start"]:
        await update.message.reply_text("⚠️ You cannot leave an active exam. Please answer the current question to proceed.")
        return

    step = state[TblUserStates.CURRENT_STEP]
    metadata = state.get(TblUserStates.METADATA, {})
    questions = metadata.get("questions", [])
    answers = metadata.get("answers", [])
    total_questions = metadata.get("total_questions", 3)
    
    answers.append(text)
    metadata["answers"] = answers
    
    if step + 1 < total_questions:
        next_step = step + 1
        update_user_state(t_id, "testing", step=next_step, metadata=metadata)
        
        q_data = questions[next_step]
        msg_text = f"<b>Question {next_step + 1} of {total_questions}:</b>\n{q_data['text']}\n\n"
        
        if q_data['type'] == 'mcq':
            msg_text += "<b>Options:</b>\n"
            letters = ['A', 'B', 'C', 'D']
            for i, opt in enumerate(q_data['options']):
                msg_text += f"<b>{letters[i]})</b> {opt}\n"
            msg_text += "\n<i>Type the letter of your answer (A, B, C, or D):</i>"
        else:
            msg_text += "<i>Type your answer below:</i>"
            
        await update.message.reply_html(msg_text)
        google_id = context.user_data.get('google_id')
        username = update.effective_user.username or update.effective_user.first_name
        if google_id:
            import re
            clean_resp = re.sub('<[^<]+>', '', msg_text) # removes HTML tags for clean db logs
            log_chat_interaction(t_id, username, text, clean_resp, google_id, mode="testing")
    else:
        msg = await update.message.reply_html("<b>Evaluating your answers...</b> Please wait.")
        
        category = metadata.get("category", "ALL")
        files = get_tenant_files(context)
        
        # Load ALL context for evaluation (removed category filter check)
        test_context = "".join([f"\n--- SOURCE: {name} ---\n{data['text']}" for name, data in files.items()])
        
        qa_log = ""
        simplified_qs = []
        
        for i in range(total_questions):
            q_obj = questions[i]
            
            if q_obj['type'] == 'mcq':
                options_str = " | ".join([f"{chr(65+idx)}) {opt}" for idx, opt in enumerate(q_obj['options'])])
                full_q_text = f"{q_obj['text']} \n[Options: {options_str}]"
                
                qa_log += f"Q{i+1} (MCQ): {full_q_text}\nUser Answer: {answers[i]}\n\n"
                simplified_qs.append(full_q_text)
            else:
                qa_log += f"Q{i+1}: {q_obj['text']}\nUser Answer: {answers[i]}\n\n"
                simplified_qs.append(q_obj['text'])

        eval_prompt = (
            f"You are an expert Sales Manager evaluating a trainee. Assess these {total_questions} answers based ONLY on the provided documents.\n\n"
            f"--- Q&A LOG ---\n"
            f"{qa_log}\n"
            f"--- END LOG ---\n\n"
            f"Instructions for Evaluation:\n"
            f"1. Evaluate each answer. Award exactly 1 mark for each completely correct or highly effective answer (maximum {total_questions} marks).\n"
            f"2. CRITICAL RULE: If a user's answer is blank, contains only punctuation, or is generic nonsense, you MUST mark it as INCORRECT (0 marks).\n"
            f"3. For free-text and situational questions, provide the ideal benchmark strategy in 'correct_answer'.\n"
            f"4. For MCQs, explicitly state the correct option in 'correct_answer'.\n"
            f"5. In 'explanation', detail why the user's answer was correct or where it fell short compared to the ideal response.\n\n"
            f"OUTPUT REQUIREMENTS (CRITICAL):\n"
            f"1. You MUST return a single valid JSON object only. Do not add any text before or after the JSON.\n"
            f"2. Structure: {{\"score\": int, \"total\": int, \"results\": [ {{\"question\": str, \"user_answer\": str, \"correct_answer\": str, \"is_correct\": bool, \"explanation\": str}} ]}}\n"
        )
        
        try:
            response = await get_groq_response(eval_prompt, test_context, temperature=0.1)
            
            json_str = response.replace("```json", "").replace("```", "").strip()
            eval_data = json.loads(json_str)
            
            # --- CRITICAL FIX: FORCE PYTHON TO COUNT THE SCORE ---
            calculated_score = sum(1 for item in eval_data.get("results", []) if item.get("is_correct"))
            eval_data["score"] = calculated_score
            # -----------------------------------------------------

            user_record = supabase.table(TblUsers.TABLE).select(TblUsers.TOKEN_ID).eq(TblUsers.ID, t_id).execute()
            active_token_id = user_record.data[0].get(TblUsers.TOKEN_ID) if user_record.data else None 
            google_id = get_google_id(t_id)

            save_test_result({
                "telegram_id": t_id,
                "admin_id": google_id,
                "token_id": active_token_id,
                "category": category,
                "qa_data": eval_data, 
                "score": eval_data.get("score", 0),
                "total_questions": eval_data.get("total", total_questions),
                "remarks": str(eval_data.get("results", []))
            })
            
            update_user_state(t_id, mode="use", step=0, metadata={})
            
            # 1. Format the detailed breakdown dynamically
            messages = []
            current_msg = f"🎓 <b>OFFICIAL TEST REPORT | Score: {eval_data.get('score')}/{eval_data.get('total')}</b>\n\n"
            
            for idx, res in enumerate(eval_data.get("results", [])):
                icon = "✅" if res.get("is_correct") else ""
                
                # HTML escaping for safety against Telegram parsing errors
                q_text = str(res.get('question', 'N/A')).replace('<', '&lt;').replace('>', '&gt;')
                u_ans = str(res.get('user_answer', 'N/A')).replace('<', '&lt;').replace('>', '&gt;')
                c_ans = str(res.get('correct_answer', 'N/A')).replace('<', '&lt;').replace('>', '&gt;')
                expl = str(res.get('explanation', 'N/A')).replace('<', '&lt;').replace('>', '&gt;')
                
                block = (
                    f"{icon} <b>Q{idx+1}:</b> {q_text}\n"
                    f"👤 <b>Your Answer:</b> {u_ans}\n"
                    f"🎯 <b>Correct Answer:</b> {c_ans}\n"
                    f" <b>Explanation:</b> {expl}\n"
                    "──────────────\n"
                )
                
                if len(current_msg) + len(block) > 3800:
                    messages.append(current_msg)
                    current_msg = block
                else:
                    current_msg += block
                    
            if current_msg:
                messages.append(current_msg)
                
            await msg.edit_text(messages[0], parse_mode="HTML")
            for m in messages[1:]:
                await context.bot.send_message(chat_id=update.effective_chat.id, text=m, parse_mode="HTML")
            
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}. Raw response: {response}")
            await msg.edit_text("Evaluation finished. Results have been saved.")

async def handle_training_step(update: Update, context: ContextTypes.DEFAULT_TYPE, t_id, text, google_id):
    username = update.effective_user.username or update.effective_user.first_name
    state = get_user_state(t_id)

    # Cancel handler
    if text.lower() in ["/cancel", "cancel", "/menu", "menu", "exit", "quit", "/start"]:
        update_user_state(t_id, mode="use", step=0, metadata={})
        await update.message.reply_text("Training session paused. Returning to main menu.")
        return

    step = state.get(TblUserStates.CURRENT_STEP, 0)
    metadata = state.get(TblUserStates.METADATA, {})

    #1. ROBUST METADATA INITIALIZATION
    if "phase" not in metadata:
        metadata["phase"] = "TRAINING_PHASE"
        metadata["taught_files"] = []
        metadata["history"] = []
        
        try:
            # Check if user has an onboarding row; if not (admin skipped onboarding), create one
            existing = supabase.table("onboarding_leads").select("id").eq("telegram_id", t_id).execute()
            if existing.data:
                supabase.table("onboarding_leads") \
                    .update({"training_status": "partial"}) \
                    .eq("telegram_id", t_id) \
                    .execute()
            else:
                # Admin or user who skipped onboarding — create a minimal lead record so dashboard tracks them
                supabase.table("onboarding_leads").insert({
                    "telegram_id": t_id,
                    "admin_id": google_id,
                    "full_name": username or "Unknown",
                    "training_status": "partial"
                }).execute()
                logger.info(f"Created onboarding_leads record for {t_id} (skipped onboarding)")
        except Exception as e:
            logger.error(f"Failed to update training status to partial: {e}")

    metadata = SlidingWindowMemory.initialize_history(metadata)
    metadata = SlidingWindowMemory.add_message(metadata, "Trainee", text)

    files = get_tenant_files(context)
    
    # Category-aware: Only train on OUR products. Competitors/Price Lists are reference only.
    our_product_files = {name: data for name, data in files.items() if data.get('category') == 'Our Products'}
    competitor_files = {name: data for name, data in files.items() if data.get('category') == 'Competitor Products'}
    price_files = {name: data for name, data in files.items() if data.get('category') == 'Price Lists'}
    
    # Knowledge base for Q&A includes everything (labeled), but training only covers OUR products
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

    # ========== TRAINING MODULE (2 COMBINED LESSONS) ==========
    if metadata["phase"] == "TRAINING_PHASE":
        
        # Training has 2 steps: step 1 = Our Products, step 2 = Competitors
        current_lesson = metadata.get("current_lesson", 0)

        # Check for acknowledgment
        acknowledgment_keywords = ["ok", "understood", "ready", "got it", "yes", "yeah", "sure", "alright", "next", "okay"]
        user_acknowledged = any(kw in text.lower().strip() for kw in acknowledgment_keywords)

        # If they ask a question mid-training
        if current_lesson > 0 and not user_acknowledged and len(text.split()) > 3:
            loading_msg = await update.message.reply_text("Answering your question...")
            qa_context = knowledge_base
            if google_id:
                query_vector = get_embedding(text)
                if query_vector:
                    matches = search_knowledge_base(query_vector, threshold=0.3, limit=5)
                    if matches:
                        qa_context += "\n\n=== VECTOR SEARCH RESULTS ==="
                        for match in matches:
                            qa_context += f"\n[Source: {match.get('file_name', 'kb')}] {match['content']}"
            try:
                resp = await get_groq_response(f"Answer briefly:\n{qa_context}\nQuestion: {text}", qa_context, temperature=0.3)
                metadata = SlidingWindowMemory.add_message(metadata, "Instructor", resp)
                update_user_state(t_id, mode="training", step=step+1, metadata=metadata)
                await loading_msg.edit_text(resp + "\n\n(Type 'ok' to continue)")
                return
            except Exception:
                await loading_msg.edit_text("Error. Type 'ok' to skip.")
                return

        # LESSON 1: ALL OUR PRODUCTS
        if current_lesson == 0:
            if not our_product_files:
                metadata["current_lesson"] = 1
            else:
                our_text = "\n".join([d['text'] for d in our_product_files.values() if d.get('text')])
                loading_msg = await update.message.reply_text("Preparing your product briefing...")
                teach_prompt = f"""You are a Sales Trainer. Give ONE comprehensive briefing about ALL our products.

DATA:
{our_text}

RULES:
1. 2-3 sentence overview of who we are.
2. List ALL key models/products (one line each with standout feature).
3. End with 3-4 KEY SELLING POINTS the salesperson should memorize.
4. Keep it punchy. No corporate jargon. Plain text only, NO markdown.
5. End with: "Got it? Type 'ok' and I'll brief you on the competition." """
                try:
                    resp = await get_groq_response(teach_prompt, our_text, temperature=0.3)
                    metadata["current_lesson"] = 1
                    metadata = SlidingWindowMemory.add_message(metadata, "Instructor", resp)
                    update_user_state(t_id, mode="training", step=step+1, metadata=metadata)
                    await loading_msg.edit_text(resp)
                    if google_id:
                        log_chat_interaction(t_id, username, text, resp, google_id, mode="training")
                except Exception:
                    await loading_msg.edit_text("Error. Type 'ok' to retry.")
                return

        # LESSON 2: ALL COMPETITORS
        if current_lesson == 1:
            if not competitor_files:
                metadata["current_lesson"] = 2
            else:
                comp_text = "\n".join([d['text'] for d in competitor_files.values() if d.get('text')])
                our_text = "\n".join([d['text'] for d in our_product_files.values() if d.get('text')])
                loading_msg = await update.message.reply_text("Preparing competitor intelligence...")
                teach_prompt = f"""You are a Sales Trainer teaching how to CRUSH competitors.

OUR PRODUCTS:
{our_text[:8000]}

COMPETITORS:
{comp_text}

RULES:
1. List each competitor (1 line — what they sell).
2. For each: 1-2 WEAKNESSES where WE are better.
3. Give 3-4 COUNTER SCRIPTS: "If customer says [X], you say: [Y]"
4. Be aggressive for OUR products. This is a sales war room.
5. Plain text only, NO markdown. End with: "You're armed. Type 'ok' to finish." """
                try:
                    resp = await get_groq_response(teach_prompt, comp_text, temperature=0.3)
                    metadata["current_lesson"] = 2
                    metadata = SlidingWindowMemory.add_message(metadata, "Instructor", resp)
                    update_user_state(t_id, mode="training", step=step+1, metadata=metadata)
                    await loading_msg.edit_text(resp)
                    if google_id:
                        log_chat_interaction(t_id, username, text, resp, google_id, mode="training")
                except Exception:
                    await loading_msg.edit_text("Error. Type 'ok' to retry.")
                return

        # DONE
        if current_lesson >= 2:
            update_user_state(t_id, mode="use", step=0, metadata={})
            try:
                result = supabase.table("onboarding_leads").update({"training_status": "completed"}).eq("telegram_id", t_id).execute()
                logger.info(f"Training COMPLETED for {t_id}. DB update result: {len(result.data) if result.data else 0} rows affected")
            except Exception as e:
                logger.error(f"Failed to update training_status to completed for {t_id}: {e}")
            await update.message.reply_text("TRAINING COMPLETE!\n\nYou know our products AND how to counter every competitor.\nGo close deals. Type /menu to continue.")
            if google_id:
                log_chat_interaction(t_id, username, text, "TRAINING COMPLETE", google_id, mode="training")
            return

    
@require_auth
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if 'msg_ids' not in context.user_data: 
        context.user_data['msg_ids'] = []

    user = update.effective_user
    t_id = update.effective_user.id
    user_text = update.message.text if update.message.text else ""

    google_id = context.user_data.get('google_id')
    if not google_id:
        google_id = get_google_id(t_id)
        context.user_data['google_id'] = google_id
    
    if not user_text:
        return

    is_authorized_flag, status_msg = validate_user_access(user.id)
    
    if not is_authorized_flag:
        msg = await update.message.reply_text(f"{status_msg}")
        context.user_data['msg_ids'].append(msg.message_id)
        return

    context.user_data['msg_ids'].append(update.message.message_id)
    
    state = get_user_state(user.id)
    if state:
        if state.get(TblUserStates.CURRENT_MODE) == 'onboarding':
            await handle_onboarding_step(update, context, state)
            return
        elif state.get(TblUserStates.CURRENT_MODE) == 'testing':
            await handle_test_step(update, context, state)
            return
        elif state.get(TblUserStates.CURRENT_MODE) == 'training':
            await handle_training_step(update, context, update.effective_user.id, user_text, google_id)
            return

    if user_text.lower() == "/menu" or user_text.lower() == "menu":
        await show_menu(update, context)
        return
        
    await deactivate_old_menu(context, update.effective_chat.id)
    
    role = context.user_data.get('role', 'normal')
    mode = context.user_data.get('mode', 'use')
    google_id = context.user_data.get('google_id')
    files = get_tenant_files(context)

    if google_id:
        active_filenames = get_active_filenames(google_id)
        if active_filenames is not None:
            files_to_remove = [name for name in list(files.keys()) if name not in active_filenames]
            for name in files_to_remove:
                del files[name]

    settings = get_bot_settings(google_id) if google_id else {}
    if settings.get(TblBotSettings.MAINTENANCE_MODE) and role != 'admin':
        msg = await update.message.reply_html(
            "<b>Maintenance Mode</b>\nThe bot is temporarily offline for updates. Please check back later."
        )
        context.user_data['msg_ids'].append(msg.message_id)
        return
   
    if role == 'admin' and mode == 'test':
        safe_name = "CustomText"
        filename = f"{safe_name}_{hashlib.md5(user_text.encode()).hexdigest()[:6]}.txt"
        
        if 'pending_files' not in context.user_data:
            context.user_data['pending_files'] = {}
            
        cat_msg = await update.message.reply_text("Processing custom text...")
        m_id = cat_msg.message_id
        
        keyboard = [
            [InlineKeyboardButton("Our Products", callback_data=f"cat_Our Products_{m_id}")],
            [InlineKeyboardButton("Competitive List", callback_data=f"cat_Competitive List_{m_id}")],
            [InlineKeyboardButton("Price List", callback_data=f"cat_Price List_{m_id}")]
        ]
        
        await cat_msg.edit_text(
            f"Custom text received! Please select a category to save it under:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        
        context.user_data['pending_files'][m_id] = {
            "filename": filename,
            "text": user_text,
            "file_id": None,
            "is_crawl": False,
            "is_custom": True
        }
        context.user_data['msg_ids'].append(m_id)
        return 
      
    ai_rules = (
        "--- CORE SYSTEM IDENTITY ---\n"
        "You are Salesji, an elite, hyper-intelligent AI Sales Coach and Strategist built strictly for our internal sales department. "
        "Your absolute objective is to arm our sales team with devastatingly effective knowledge, word-for-word scripts, and tactical advantages to ruthlessly close deals, overcome any objection, and completely dominate the competition. You do not just provide information; you provide STRATEGY.\n\n"
        
        "--- 1. IRONCLAD FORMATTING RULES (FAILURE IS STRICTLY PROHIBITED) ---\n"
        "A) YOU MUST OUTPUT PLAIN TEXT ONLY. You are ABSOLUTELY BANNED from using Markdown of any kind.\n"
        "B) NEVER EVER use # ## ### * ** ``` or any markdown symbols. NOT A SINGLE ONE.\n"
        "C) If you must emphasize a word or section header, USE ALL CAPITAL LETTERS instead.\n"
        "D) DO NOT use bullet points with dashes or asterisks. Use numbers like 1), 2), 3) or letters A), B), C).\n"
        "E) Keep sentences punchy, short, and formatted for a salesperson reading on a mobile phone mid-call.\n"
        "F) Your response must look like a normal human text message — NOT like a formatted document.\n\n"
        "C) DO NOT use bullet points or dashes for lists. Use natural paragraph spacing or numbers like 1), 2), 3) or A), B), C) to separate ideas.\n"
        "D) Keep sentences punchy, highly readable, and formatted for a salesperson reading quickly on a mobile device or mid-call.\n\n"
        
        "--- 2. THE STRICT RAG PROTOCOL (ZERO HALLUCINATION LIMIT) ---\n"
        "You are a closed-loop corporate system. You must base your advice, facts, and strategies EXCLUSIVELY on the SOURCE documents provided in the context below. "
        "If a sales rep asks a question and the exact answer cannot be found or logically deduced from the provided files, DO NOT guess, DO NOT hallucinate, and DO NOT use outside world knowledge. "
        "Instead, reply EXACTLY with: 'I could not find the exact answer to this in the current company knowledge base. Please ask an Admin to upload the relevant documentation.'\n\n"
        
        "--- 3. MASTER PLAYBOOKS BY CATEGORY ---\n"
        "When analyzing documents to answer a query, identify which category of information you are dealing with and apply the following psychological playbooks:\n\n"
        
        "CATEGORY A: OUR PRODUCTS (THE CATALOG MASTERCLASS)\n"
        "Teach the rep exactly how to pitch our portfolio. Categorize our offerings into bestsellers, budget-friendly options, and premium tiers based ONLY on the documents. "
        "CRITICAL: Do not just act like a dictionary listing features. You must translate EVERY feature into a high-impact ROI (Return on Investment) benefit. "
        "Give the sales rep the exact angles to push, the specific pain points our software solves, and word-for-word scripts to make the product sound irresistible.\n\n"
        
        "CATEGORY B: COMPETITIVE LIST (THE STRATEGIC TAKEDOWN)\n"
        "When discussing competitors, teach the rep how to gracefully but ruthlessly dismantle them. NEVER sound aggressive or resort to cheap bashing. "
        "Use the 'Yes, but...' framework. Professionally acknowledge the competitor's existence, but strictly expose their hidden flaws based on our documents (e.g., complexity, slow support, hidden fees). "
        "Plant deep seeds of doubt in the customer's mind about the competitor so they naturally gravitate back to us as the safe, premium choice.\n\n"
        
        "CATEGORY C: PRICE LIST (THE UNYIELDING VALUE DEFENDER & PROMO CLOSER)\n"
        "Never apologize for our pricing. You must give the rep an ironclad defense strategy regardless of where we stand in the market.\n"
        "1) DEFENDING PREMIUMS: If we are more expensive, teach the rep to pitch premium ROI, white-glove support, and reduced risk.\n"
        "2) PROMOTIONAL CONFLICT RESOLUTION: If you detect multiple prices for the same product (e.g., a 'Standard Price' and a 'Limited-Time Offer' or 'Promo'), YOU MUST PRIORITIZE THE PROMO PRICE. Do not get confused. \n"
        "3) THE ANCHORING STRATEGY: When a promo exists, instruct the rep to 'Anchor' the conversation with the standard higher price first to establish value, and then drop the limited-time price to create extreme urgency and force an immediate close.\n"
        "4) Always ensure pricing breakdowns are explicitly clear, paying strict attention to validity dates, volume discounts, or prerequisites.\n\n"
        
        "--- 4. DYNAMIC CONTEXT & COMPARISON LOGIC (CRITICAL) ---\n"
        "1) STRICT COMPARABILITY CHECKS: If the user asks to compare two items (e.g., products, tiers, competitors), first evaluate if they are logically comparable. If the comparison is invalid or mismatched (e.g., comparing a software feature directly to a pricing tier), explicitly notify the user: 'This comparison is invalid as the items are not functionally comparable.' and explain why.\n"
        "2) DYNAMIC SYNTHESIS: You must seamlessly pull from all relevant loaded context blocks. If a user asks a holistic question, synthesize the Price List, Product Specs, and Competitive List to formulate a bulletproof strategy.\n\n"
        
        "--- 5. OBJECTION HANDLING & DELIVERY ---\n"
        "1) PROACTIVE DEFENSE: Always predict what the customer might say or object to based on the context, and proactively give the sales rep the exact counter-argument to use.\n"
        "2) WORD-FOR-WORD SCRIPTS: Whenever possible, put your advice in quotes so the salesperson can literally read it to the client over the phone.\n"
        "3) TONE: Keep your tone authoritative, razor-sharp, consultative, and highly strategic. You are a senior mentor speaking to high-performing closers. Cut the fluff.\n"
        "4) CITATIONS: Always end your response by listing the exact file names you pulled data from so the rep can verify the information.\n"
    
        "--- 6. GOLDEN RULE: OUR PRODUCTS FIRST ---"
        "REGARDLESS of what the user asks about, you MUST ALWAYS start your response by pitching OUR products that fit the scenario. "
        "Even if the user specifically asks about a competitor, your FIRST paragraph must be: 'Here is what WE offer that fits this need...' "
        "THEN you can acknowledge the competitor and explain why OUR option is superior. "
        "NEVER give a response that only talks about competitors without pitching OUR products first."

    )

    # =====================================================================
    # PHASE 1: CONSTRAINT EXTRACTION (The Immutable Meta-Context)
    # =====================================================================
    # 1. Fetch existing constraints and extract new ones
    existing_constraints = state.get(TblUserStates.EXTRACTED_CONSTRAINTS, {}) if state else {}
    new_constraints = ConstraintExtractor.extract_constraints_from_text(user_text, t_id)
    merged_constraints = ConstraintExtractor.merge_constraints(existing_constraints, new_constraints)
    
    # 2. Format constraints so the LLM absolutely cannot ignore them
    constraint_block = ConstraintExtractor.format_for_llm_context(merged_constraints)

    # Initialize context with constraints FIRST, then rules
    full_context = constraint_block + "\n\n" + ai_rules
    has_data = False

    # =====================================================================
    # PHASE 2 & 3: KNOWLEDGE BASE & SMART RERANKING
    # =====================================================================
    # Category-aware context injection: Label each file so the LLM knows
    # what belongs to US vs COMPETITORS vs irrelevant noise.
    VALID_CATEGORIES = {"Our Products", "Competitor Products", "Price Lists"}
    
    our_products_context = ""
    competitor_context = ""
    price_context = ""
    
    if files:
        
        for name, data in files.items():
            category = data.get('category', 'Our Products')
            file_text = data.get('text', '')
            
            # Skip files with no valid category (irrelevant uploads)
            if category not in VALID_CATEGORIES:
                logger.info(f"Skipping file '{name}' — unrecognized category: '{category}'")
                continue
            
            if not file_text.strip():
                continue
                
            if category == "Our Products":
                our_products_context += f"\n\n--- OUR PRODUCT FILE: {name} ---\n{file_text}"
            elif category == "Competitor Products":
                competitor_context += f"\n\n--- COMPETITOR FILE: {name} ---\n{file_text}"
            elif category == "Price Lists":
                price_context += f"\n\n--- PRICE LIST FILE: {name} ---\n{file_text}"
        
        # Inject OUR products FIRST (highest priority for LLM attention)
        if our_products_context:
            full_context += "\n\n=== OUR COMPANY'S PRODUCTS (PITCH THESE AGGRESSIVELY) ===" + our_products_context
            has_data = True
        if price_context:
            full_context += "\n\n=== OUR PRICE LISTS (USE FOR ANCHORING & VALUE DEFENSE) ===" + price_context
            has_data = True
        # Competitor data LAST and clearly marked
        if competitor_context:
            full_context += "\n\n=== COMPETITOR DATA (USE ONLY TO COUNTER OBJECTIONS — NEVER PITCH THESE) ===" + competitor_context
            has_data = True
    
    if google_id:
        # PERFORMANCE: Skip vector search if knowledge cards already provide sufficient context.
        # Embedding generation (~300ms) + vector search (~300ms) = ~600ms saved per message
        # when the inline condensed cards already contain the answer.
        # Only run vector search when: few files loaded OR query seems very specific.
        total_inline_context_len = len(our_products_context) + len(competitor_context) + len(price_context) if files else 0
        should_vector_search = (
            total_inline_context_len < 2000 or  # Very little inline data — need vector search
            len(files) > 8 or                    # Too many files to inject all — need ranking
            not has_data                          # No inline data at all
        )
        
        if should_vector_search:
            query_vector = get_embedding(user_text)
            
            if query_vector:
                matches = search_knowledge_base(query_vector, threshold=0.3, limit=5)
                
                if matches:
                    has_data = True
                    
                    chunk_dicts = []
                    for match in matches:
                        chunk_dicts.append({
                            "content": f"[Source: {match['file_name']}] {match['content']}",
                            "score": match['similarity'],
                            "source_type": "vector_db"
                        })
                    
                    ranked_context = ContextRanker.create_context_block(
                        chunks=chunk_dicts,
                        user_constraints=merged_constraints,
                        user_query=user_text,
                        max_chunks=5,
                        include_hierarchy=True
                    )
                    full_context += "\n\n" + ranked_context
        else:
            logger.debug(f"Skipping vector search — inline context sufficient ({total_inline_context_len} chars from {len(files)} files)")

    if not has_data:
        if role == 'admin':
            msg = await update.message.reply_text("Your Knowledge Base is empty. Upload files.", reply_markup=get_main_menu_keyboard(role, mode))
        else:
            msg = await update.message.reply_text("The knowledge base is currently empty.", reply_markup=get_main_menu_keyboard(role, mode))
        context.user_data["last_menu_id"] = msg.message_id 
        context.user_data['msg_ids'].append(msg.message_id)
        return
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')
    
    try:
        current_temp = settings.get(TblBotSettings.TEMPERATURE, 0.2)
        response = await get_groq_response(user_text, full_context, temperature=current_temp)
        
        # =====================================================================
        # PHASE 4: VALIDATION & STATE SAVING
        # =====================================================================
        # 4. Check if the LLM hallucinated and ignored the user's constraints
        is_valid, violations = ConstraintValidator.validate_response(response, merged_constraints, t_id)
        if not is_valid:
            logger.warning(f"Constraint violations: {violations}")
            # Append a safety warning so the sales rep knows the AI messed up
            response += f"\n\n⚠️ [System Note: Missing constraint - {violations[0]}]"

        msg = await update.message.reply_text(response)
        context.user_data['msg_ids'].append(msg.message_id)

        # 5. Save the updated constraints back to Supabase!
        update_user_state(
            telegram_id=t_id, 
            mode=mode, 
            step=state.get(TblUserStates.CURRENT_STEP, 0) if state else 0, 
            metadata=state.get(TblUserStates.METADATA, {}) if state else {},
            constraints=merged_constraints  # <-- Passes new constraints to DB
        )

        if google_id:
            log_chat_interaction(
                telegram_id=user.id,
                username=user.username or user.first_name,
                query=user_text,
                response=response,
                admin_id=google_id,
                mode="normal"
            )

    except Exception as e:
        logger.error(f"Error in handle_message AI processing: {e}")
        msg = await update.message.reply_text("Error processing your request.")
        context.user_data['msg_ids'].append(msg.message_id)

async def clear_key_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = str(update.message.from_user.id)

    user_record = supabase.table(TblUsers.TABLE) \
        .select(TblUsers.TOKEN_ID) \
        .eq(TblUsers.ID, telegram_id) \
        .execute()

    if not user_record.data:
        await update.message.reply_text("You are not currently authenticated.")
        return

    token_id = user_record.data[0].get(TblUsers.TOKEN_ID)

    if token_id:
        supabase.table(TblTokens.TABLE) \
            .update({TblTokens.IS_REVOKED: True}) \
            .eq(TblTokens.ID, token_id) \
            .execute()

    supabase.table(TblUsers.TABLE) \
        .delete() \
        .eq(TblUsers.ID, telegram_id) \
        .execute()

    await update.message.reply_text("Session terminated. Your access key has been revoked. You will need a new invite link to use the bot again.")

@require_auth
async def unknown_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = await update.message.reply_text("Unrecognized command. Please type /menu or /manual for further options.")
    if 'msg_ids' not in context.user_data: 
        context.user_data['msg_ids'] = []
    context.user_data['msg_ids'].append(msg.message_id)

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error(f"Exception while handling an update: {context.error}", exc_info=context.error)