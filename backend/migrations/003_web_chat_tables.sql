-- ═══════════════════════════════════════════════════════════════════
-- WEB CHAT TABLES
-- Stores conversation history for the web chat interface
-- ═══════════════════════════════════════════════════════════════════

-- Conversations (like threads in ChatGPT)
CREATE TABLE IF NOT EXISTS web_chat_conversations (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id bigint NOT NULL,
    admin_id uuid NOT NULL,
    title text DEFAULT 'New Chat',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_web_conversations_user ON web_chat_conversations(telegram_id);
CREATE INDEX idx_web_conversations_admin ON web_chat_conversations(admin_id);

-- Individual messages within a conversation
CREATE TABLE IF NOT EXISTS web_chat_messages (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id bigint NOT NULL REFERENCES web_chat_conversations(id) ON DELETE CASCADE,
    telegram_id bigint NOT NULL,
    admin_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_web_messages_conversation ON web_chat_messages(conversation_id);
CREATE INDEX idx_web_messages_created ON web_chat_messages(created_at);

-- RLS
ALTER TABLE web_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_chat_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so no policies needed for server-side access
COMMENT ON TABLE web_chat_conversations IS 'Web chat conversation threads (like ChatGPT threads)';
COMMENT ON TABLE web_chat_messages IS 'Individual messages within web chat conversations';
