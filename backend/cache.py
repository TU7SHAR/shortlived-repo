"""
IN-MEMORY CACHE WITH TTL

Eliminates redundant Supabase queries for hot data.
Each cache entry expires after a configurable TTL.

Savings per message:
- get_bot_settings(): ~200ms saved (called every message)
- get_tenant_files(): ~500ms-2s saved (called every message, heaviest query)

Thread-safe: Uses simple dict + time check (GIL protects dict operations).
"""

import time
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class TTLCache:
    """Simple in-memory cache with per-key TTL expiration."""
    
    def __init__(self, default_ttl: int = 60):
        """
        Args:
            default_ttl: Default time-to-live in seconds (60s = 1 minute)
        """
        self._store = {}  # {key: (value, expires_at)}
        self._default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        """Get value if exists and not expired. Returns None if miss."""
        entry = self._store.get(key)
        if entry is None:
            return None
        
        value, expires_at = entry
        if time.time() > expires_at:
            # Expired — remove and return miss
            del self._store[key]
            return None
        
        return value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Store value with TTL. Uses default_ttl if not specified."""
        ttl = ttl if ttl is not None else self._default_ttl
        expires_at = time.time() + ttl
        self._store[key] = (value, expires_at)
    
    def invalidate(self, key: str) -> None:
        """Remove a specific key (call after mutations like file upload/delete)."""
        self._store.pop(key, None)
    
    def invalidate_prefix(self, prefix: str) -> None:
        """Remove all keys starting with prefix (e.g., invalidate all for an admin)."""
        keys_to_remove = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_remove:
            del self._store[k]
    
    def clear(self) -> None:
        """Flush entire cache."""
        self._store.clear()
    
    @property
    def size(self) -> int:
        return len(self._store)


# ═══════════════════════════════════════════════════════
# GLOBAL CACHE INSTANCES
# ═══════════════════════════════════════════════════════

# Bot settings rarely change — cache for 120 seconds
settings_cache = TTLCache(default_ttl=120)

# Tenant files change on upload/delete — cache for 60 seconds  
files_cache = TTLCache(default_ttl=60)

# User state changes frequently but is read multiple times per message — cache for 10 seconds
state_cache = TTLCache(default_ttl=10)
