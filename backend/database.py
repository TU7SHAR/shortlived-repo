import logging
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY
from embedder import get_embedding
from cache import settings_cache, files_cache, state_cache
import httpx
import logging


orig_sync_init = httpx.Client.__init__
def patched_sync_init(self, *args, **kwargs):
    kwargs['http2'] = False
    orig_sync_init(self, *args, **kwargs)
httpx.Client.__init__ = patched_sync_init

orig_async_init = httpx.AsyncClient.__init__
def patched_async_init(self, *args, **kwargs):
    kwargs['http2'] = False
    orig_async_init(self, *args, **kwargs)
httpx.AsyncClient.__init__ = patched_async_init

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

from schema_map import (
    TblTokens, TblUsers, TblBotSettings, TblChat, 
    TblFiles, TblUserStates, TblOnboarding, TblTests
)


logger = logging.getLogger(__name__)
supabase: Client = create_client(
    SUPABASE_URL, 
    SUPABASE_KEY, 
)

def check_auth_status(telegram_id: int) -> str:
    """Returns 'authorized', 'banned', or 'unauthorized'"""
    try:
        res = supabase.table(TblUsers.TABLE).select("*").eq(TblUsers.ID, telegram_id).execute()
        if not res.data:
            return 'unauthorized'
        if res.data[0].get(TblUsers.IS_BANNED):
            return 'banned'
        return 'authorized'
    except Exception as e:
        logger.error(f"Auth check error: {e}")
        return 'unauthorized'

def get_user_state(telegram_id: int):
    """Get user state from database"""
    try:
        res = supabase.table(TblUserStates.TABLE).select("*").eq(TblUserStates.TELEGRAM_ID, telegram_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Error fetching state: {e}")
        return None

def update_user_state(
    telegram_id: int, 
    mode: str, 
    step: int = 0, 
    metadata: dict = {},
    constraints: dict = None
):
    """Update user state - constraints parameter is OPTIONAL and backward compatible"""
    try:
        update_dict = {
            TblUserStates.TELEGRAM_ID: telegram_id,
            TblUserStates.CURRENT_MODE: mode,
            TblUserStates.CURRENT_STEP: step,
            TblUserStates.METADATA: metadata
        }
        
        # Only add constraints if provided (backward compatible)
        if constraints is not None:
            try:
                update_dict[TblUserStates.EXTRACTED_CONSTRAINTS] = constraints
                update_dict[TblUserStates.CONSTRAINT_VERSION] = 1
            except Exception as e:
                logger.debug(f"Constraints not saved: {e} (column may not exist yet)")
        
        supabase.table(TblUserStates.TABLE).upsert(
            update_dict,
            on_conflict=TblUserStates.TELEGRAM_ID
        ).execute()
        
    except Exception as e:
        logger.error(f"State update error: {e}")

def get_user_constraints(telegram_id: int) -> dict:
    """Fetch extracted constraints - returns empty dict if not found"""
    try:
        res = supabase.table(TblUserStates.TABLE).select(
            TblUserStates.EXTRACTED_CONSTRAINTS
        ).eq(TblUserStates.TELEGRAM_ID, telegram_id).execute()
        
        if res.data and res.data[0]:
            constraints = res.data[0].get(TblUserStates.EXTRACTED_CONSTRAINTS, {})
            return constraints if isinstance(constraints, dict) else {}
        
        return {}
    
    except Exception as e:
        logger.debug(f"Constraints fetch failed (column may not exist): {e}")
        return {}

def find_relevant_context(user_query: str, admin_id: str, limit: int = 5):
    """
    Phase 2 RAG Search: Searches Asymmetric Anchors and standard embeddings.
    """
    try:
        # 1. Turn the user's question into math (vector)
        query_vector = get_embedding(user_query)
        
        # 2. Search the embeddings table (which now includes Phase 2 asymmetric query_anchors)
        response = supabase.rpc(
            'match_embeddings',
            {
                'query_embedding': query_vector,
                'match_threshold': 0.70, # Slightly lower threshold to allow semantic mapping
                'match_count': limit,
                'p_admin_id': admin_id
            }
        ).execute()
        
        if not response.data:
            return []
            
        context_chunks = []
        for match in response.data:
            # In Phase 2, the matched embedding could point to a file_chunk OR a knowledge_card
            # We check the created_from_chunk_id to fetch the raw text from the database
            chunk_id = match.get('chunk_id') or match.get('created_from_chunk_id')
            
            if chunk_id:
                chunk_res = supabase.table('file_chunks').select('content').eq('id', chunk_id).execute()
                if chunk_res.data:
                    context_chunks.append(chunk_res.data[0]['content'])
                
        return context_chunks

    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return []

def is_authorized(telegram_id: int) -> bool:
    """Legacy check for other functions"""
    return check_auth_status(telegram_id) == "authorized"

def verify_and_authorize(token_suffix: str, telegram_id: int, telegram_username: str):
    """Verify and authorize user with token"""
    try:
        if check_auth_status(telegram_id) == "banned":
            logger.warning(f"Banned user {telegram_id} attempted to use a new token.")
            return False
            
        search_str = f"%{token_suffix}%"
        
        res = supabase.table(TblTokens.TABLE).select("*").ilike(TblTokens.TOKEN_STRING, search_str).execute()

        if not res.data:
            logger.warning("Token not found in database.")
            return False

        token_record = res.data[0]

        if token_record.get(TblTokens.IS_USED) is True:
            logger.warning("Token is already marked as used.")
            return False

        # Mark token as used
        supabase.table(TblTokens.TABLE).update({
            TblTokens.IS_USED: True, 
            TblTokens.USED_BY_ID: telegram_id,
            TblTokens.USED_BY_USER: telegram_username
        }).eq(TblTokens.ID, token_record[TblTokens.ID]).execute()

        # UPSERT Authorized User (with username snapshot)
        supabase.table(TblUsers.TABLE).upsert({
            TblUsers.ID: telegram_id,
            TblUsers.TOKEN_ID: token_record[TblTokens.ID],
            TblUsers.ADMIN_ID: token_record[TblTokens.ADMIN_ID],
            TblUsers.USERNAME: telegram_username,
            TblUsers.IS_BANNED: False
        }).execute()
            
        return True
        
    except Exception as e:
        logger.error(f"Authorization Error: {e}")
        return False

def get_user_role(telegram_id: int) -> str:
    """Get user role from token"""
    try:
        user_res = supabase.table(TblUsers.TABLE).select(TblUsers.TOKEN_ID).eq(TblUsers.ID, telegram_id).execute()
        
        if not user_res.data or not user_res.data[0].get(TblUsers.TOKEN_ID):
            return "normal"
            
        token_id = user_res.data[0].get(TblUsers.TOKEN_ID)
        
        token_res = supabase.table(TblTokens.TABLE).select(TblTokens.TOKEN_TYPE).eq(TblTokens.ID, token_id).execute()
        
        if token_res.data and token_res.data[0].get(TblTokens.TOKEN_TYPE):
            return token_res.data[0][TblTokens.TOKEN_TYPE].lower()
            
        return "normal"
    except Exception as e:
        logger.error(f"Role fetch error: {e}")
        return "normal"

def get_google_id(telegram_id: int) -> str:
    """Get admin ID from user's token"""
    try:
        user_res = supabase.table(TblUsers.TABLE).select(TblUsers.ADMIN_ID).eq(TblUsers.ID, telegram_id).execute()
        
        if not user_res.data or not user_res.data[0].get(TblUsers.ADMIN_ID):
            return None
            
        return user_res.data[0][TblUsers.ADMIN_ID]
    except Exception as e:
        logger.error(f"Error fetching admin ID: {e}")
        return None

def log_ingested_file(filename: str, telegram_id: int, username: str, google_id: str, category: str = "Our Products"):
    """Log file ingestion"""
    try:
        supabase.table(TblFiles.TABLE).insert({
            TblFiles.FILENAME: filename,
            TblFiles.UPLOADED_BY_ID: telegram_id,
            TblFiles.ADMIN_ID: google_id,
            TblFiles.CATEGORY: category
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log file to db: {e}")

def clear_user_auth(telegram_id: int) -> bool:
    """Clear user authorization"""
    try:
        supabase.table(TblTokens.TABLE).update({
            TblTokens.IS_REVOKED: True 
        }).eq(TblTokens.USED_BY_ID, telegram_id).execute()

        supabase.table(TblUsers.TABLE).update({
            TblUsers.IS_BANNED: True
        }).eq(TblUsers.ID, telegram_id).execute()
        
        return True
    except Exception as e:
        logger.error(f"Error clearing auth: {e}")
        return False
    
def remove_ingested_file(filename: str, google_id: str):
    """Delete file and vector chunks from database"""
    try:
        # 1. Get the file_id first
        file_res = supabase.table(TblFiles.TABLE).select(TblFiles.ID).eq(TblFiles.FILENAME, filename).eq(TblFiles.ADMIN_ID, google_id).execute()
        if not file_res.data:
            logger.warning(f"File {filename} not found for deletion")
            return False
        file_id = file_res.data[0][TblFiles.ID]

        # 2. Delete text chunks by file_id (file_name column removed from file_chunks)
        supabase.table("file_chunks").delete().eq("file_id", file_id).execute()
        logger.info(f"Deleted chunks for file_id {file_id}")
        
        # 3. Delete from metadata table (CASCADE handles cards, embeddings, etc.)
        supabase.table(TblFiles.TABLE).delete().eq(TblFiles.ID, file_id).execute()
        logger.info(f"Successfully deleted {filename} from file metadata")
        
        # PERFORMANCE: Invalidate file caches for this admin
        files_cache.invalidate(f"filenames:{google_id}")
        files_cache.invalidate(f"tenant_files:{google_id}")
        
        return True
    except Exception as e:
        logger.error(f"Failed to delete file from db: {e}")
        return False

def get_bot_settings(google_id: str):
    """Get bot settings for admin — CACHED (120s TTL)"""
    cache_key = f"settings:{google_id}"
    cached = settings_cache.get(cache_key)
    if cached is not None:
        return cached
    
    try:
        res = supabase.table(TblBotSettings.TABLE).select("*").eq(TblBotSettings.CREATED_BY, google_id).execute()
        if res.data:
            settings_cache.set(cache_key, res.data[0])
            return res.data[0]
        defaults = {
            TblBotSettings.STRICT_MODE: True, 
            TblBotSettings.TEMPERATURE: 0.2, 
            TblBotSettings.MAINTENANCE_MODE: False
        }
        settings_cache.set(cache_key, defaults)
        return defaults
    except Exception:
        return {
            TblBotSettings.STRICT_MODE: True, 
            TblBotSettings.TEMPERATURE: 0.2, 
            TblBotSettings.MAINTENANCE_MODE: False
        }

def log_chat_interaction(telegram_id, username, query, response, admin_id, mode="normal"):
    """Log chat interaction"""
    try:
        supabase.table(TblChat.TABLE).insert({
            TblChat.TELEGRAM_ID: telegram_id,
            TblChat.USER_QUERY: query,
            TblChat.BOT_RESPONSE: response,
            TblChat.ADMIN_ID: admin_id,
            TblChat.MODE: mode
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log chat: {e}")

def save_onboarding_lead(data: dict):
    """Save onboarding lead"""
    try:
        supabase.table(TblOnboarding.TABLE).insert(data).execute()
    except Exception as e:
        logger.error(f"Lead save error: {e}")

def get_active_filenames(google_id: str):
    """Get all active filenames for admin — CACHED (60s TTL)"""
    cache_key = f"filenames:{google_id}"
    cached = files_cache.get(cache_key)
    if cached is not None:
        return cached
    
    try:
        res = supabase.table(TblFiles.TABLE).select(TblFiles.FILENAME).eq(TblFiles.CREATED_BY, google_id).execute()
        result = [row[TblFiles.FILENAME] for row in res.data] if res.data else []
        files_cache.set(cache_key, result)
        return result
    except Exception as e:
        logger.error(f"Error fetching active files: {e}")
        return []
    
def save_test_result(data: dict):
    """Save test result"""
    try:
        supabase.table(TblTests.TABLE).insert(data).execute()
    except Exception as e:
        logger.error(f"Test result save error: {e}")

def validate_user_access(telegram_id):
    """Validate user access - checks ban status and token revocation"""
    try:
        # 1. Fetch user from authorized_users
        user_res = supabase.table(TblUsers.TABLE).select("*").eq(TblUsers.ID, telegram_id).execute()
        user = user_res.data[0] if user_res.data else None

        if not user:
            return False, "Unauthorized: Please use a valid invite link to start."

        # 2. Check for account-level ban
        if user.get(TblUsers.IS_BANNED):
            return False, "Access Denied: Your account has been banned."

        # 3. Get the token currently linked to this user
        token_id = user.get(TblUsers.TOKEN_ID)
        if not token_id:
            return False, "No valid invite link found. Please use /start with your token."

        # 4. Check the status of that specific token
        token_res = supabase.table(TblTokens.TABLE).select("*").eq(TblTokens.ID, token_id).execute()
        token_data = token_res.data[0] if token_res.data else None

        # 5. Revoke Check
        if token_data and token_data.get(TblTokens.IS_REVOKED):
            supabase.table(TblUsers.TABLE).update({TblUsers.TOKEN_ID: None}).eq(TblUsers.ID, telegram_id).execute()
            return False, "Access Denied: Your invite link has been revoked."

        # 6. Safety check
        if not token_data:
            supabase.table(TblUsers.TABLE).update({TblUsers.TOKEN_ID: None}).eq(TblUsers.ID, telegram_id).execute()
            return False, "Invalid Key: Your current session key is no longer valid."

        return True, "Authorized"

    except Exception as e:
        logger.error(f"Database Error: {e}")
        return False, "An error occurred while verifying your access."

def save_feedback(telegram_id: int, username: str, feedback_text: str, admin_id: str) -> bool:
    """Save user feedback"""
    try:
        data = {
            "telegram_id": telegram_id,
            "feedback": feedback_text,
            "admin_id": admin_id
        }
        supabase.table("user_feedback").insert(data).execute()
        return True
    except Exception as e:
        logger.error(f"Error saving feedback: {e}")
        return False

def remove_all_ingested_files(google_id: str):
    """Delete all files for an admin"""
    try:
        supabase.table(TblFiles.TABLE).delete().eq(TblFiles.CREATED_BY, google_id).execute()
        logger.info(f"Successfully wiped all files for Google ID: {google_id}")
    except Exception as e:
        logger.error(f"Failed to wipe files: {e}")

def get_all_files_for_all_users():
    """Get all files from database"""
    try:
        res = supabase.table(TblFiles.TABLE).select("*").execute()
        return res.data if res.data else []
    except Exception as e:
        logger.error(f"Failed to fetch files: {e}")
        return []

def search_knowledge_base(query_vector: list, threshold: float = 0.3, limit: int = 5) -> list:
    """
    Searches the Supabase vector database for the closest mathematical matches.
    """
    if not supabase:
        logger.error("Supabase not initialized.")
        return []
        
    try:
        # Calls the SQL function we just created in Step 1
        response = supabase.rpc(
            "match_embeddings", 
            {
                "query_embedding": query_vector,
                "match_threshold": threshold,
                "match_count": limit
            }
        ).execute()
        
        return response.data if response.data else []
        
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return []

def get_onboarding_lead(telegram_id: int):
    """Get onboarding lead info"""
    try:
        res = supabase.table(TblOnboarding.TABLE).select("*").eq(TblOnboarding.TELEGRAM_ID, telegram_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Error fetching lead: {e}")
        return None