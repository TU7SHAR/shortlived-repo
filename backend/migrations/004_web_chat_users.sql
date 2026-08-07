-- ═══════════════════════════════════════════════════════════════════
-- WEB CHAT USERS + WEB CHAT TABLES (consolidated, supersedes 003)
-- Enables normal users to log into the web app and use /chat, scoped
-- to their admin (tenant). Web users are identified by their Supabase
-- auth user id (uuid), independent of Telegram.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Maps a Supabase auth user → the tenant admin they belong to
CREATE TABLE IF NOT EXISTS web_chat_users (
    id uuid PRIMARY KEY,                -- Supabase auth.users id
    email text NOT NULL,
    admin_id uuid NOT NULL,             -- tenant this user belongs to
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    telegram_id bigint,                 -- optional link to a Telegram account
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_chat_users_admin ON web_chat_users(admin_id);
CREATE INDEX IF NOT EXISTS idx_web_chat_users_email ON web_chat_users(email);

-- 2. Conversations (threads). Keyed on user_id (auth uuid).
CREATE TABLE IF NOT EXISTS web_chat_conversations (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,                       -- Supabase auth user id
    telegram_id bigint,                 -- optional (legacy / telegram users)
    admin_id uuid NOT NULL,
    title text DEFAULT 'New Chat',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- If the table already existed from migration 003, bring it up to spec
ALTER TABLE web_chat_conversations ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE web_chat_conversations ALTER COLUMN telegram_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_web_conversations_user ON web_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_web_conversations_admin ON web_chat_conversations(admin_id);

-- 3. Messages within a conversation
CREATE TABLE IF NOT EXISTS web_chat_messages (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id bigint NOT NULL REFERENCES web_chat_conversations(id) ON DELETE CASCADE,
    user_id uuid,
    telegram_id bigint,
    admin_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE web_chat_messages ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE web_chat_messages ALTER COLUMN telegram_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_web_messages_conversation ON web_chat_messages(conversation_id);

-- 4. Allow chat_analytics to log web-only users (no telegram_id)
ALTER TABLE chat_analytics ALTER COLUMN telegram_id DROP NOT NULL;

-- 5. RLS (service role bypasses; lock out anon/authenticated direct access)
ALTER TABLE web_chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_chat_messages ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE web_chat_users IS 'Maps Supabase auth users to their tenant admin for web chat access';
