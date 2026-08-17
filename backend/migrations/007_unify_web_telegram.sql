-- ═══════════════════════════════════════════════════════════════════
-- UNIFY WEB + TELEGRAM — single source of truth for ALL user data.
-- After this, both the Telegram bot and web chat write to the SAME
-- tables. No more web_chat_* duplication.
-- ═══════════════════════════════════════════════════════════════════

-- 1. AUTHORIZED_USERS becomes the single user registry.
--    Add columns so web-only users can have a row here too.
ALTER TABLE authorized_users ALTER COLUMN telegram_id DROP NOT NULL;
ALTER TABLE authorized_users DROP CONSTRAINT IF EXISTS authorized_users_pkey CASCADE;
ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS web_user_id uuid UNIQUE;
ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS email text;

-- Re-create PK: use the new uuid `id` as PK (telegram_id stays as a
-- unique lookup column, but is now nullable for web-only users).
-- Only add PK if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'authorized_users_pkey') THEN
    ALTER TABLE authorized_users ADD CONSTRAINT authorized_users_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Keep telegram_id unique (but nullable)
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_telegram ON authorized_users(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_web ON authorized_users(web_user_id) WHERE web_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON authorized_users(email);

-- 2. USER_STATES — support keying by the new authorized_users.id (uuid)
--    instead of only telegram_id.
ALTER TABLE user_states ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE user_states ALTER COLUMN telegram_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_states_user_id ON user_states(user_id) WHERE user_id IS NOT NULL;

-- 3. CHAT_CONVERSATIONS — unified threads (replaces web_chat_conversations)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL,        -- authorized_users.id
    admin_id uuid NOT NULL,
    title text DEFAULT 'New Chat',
    mode text DEFAULT 'assistant', -- assistant|onboarding|training|testing
    platform text DEFAULT 'web' CHECK (platform IN ('web', 'telegram')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_admin ON chat_conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_platform ON chat_conversations(platform);
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- 4. CHAT_MESSAGES — unified messages (replaces web_chat_messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id bigint NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    admin_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    platform text DEFAULT 'web' CHECK (platform IN ('web', 'telegram')),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. ONBOARDING_LEADS + TEST_RESULTS — add user_id (uuid) as unified key
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE onboarding_leads ALTER COLUMN telegram_id DROP NOT NULL;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE test_results ALTER COLUMN telegram_id DROP NOT NULL;

-- 6. CHAT_ANALYTICS — add user_id, platform, make telegram_id nullable
ALTER TABLE chat_analytics ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE chat_analytics ADD COLUMN IF NOT EXISTS platform text DEFAULT 'telegram';
ALTER TABLE chat_analytics ALTER COLUMN telegram_id DROP NOT NULL;

COMMENT ON TABLE chat_conversations IS 'Unified conversation threads for both web and Telegram users';
COMMENT ON TABLE chat_messages IS 'Unified messages within conversations for both web and Telegram users';
