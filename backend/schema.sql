-- ═══════════════════════════════════════════════════════════════════
-- SALESJI DATABASE - FULL SCHEMA (Create from scratch)
-- Run on a fresh Supabase project
-- ═══════════════════════════════════════════════════════════════════

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════
-- 1. INVITE TOKENS
-- ═══════════════════════════════════════════════════════
CREATE TABLE invite_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_string text NOT NULL UNIQUE,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    is_used boolean NOT NULL DEFAULT false,
    used_by_telegram_id int8,
    token_type text NOT NULL DEFAULT 'user' CHECK (token_type IN ('user', 'admin')),
    used_by_username text,
    caption text,
    is_revoked boolean NOT NULL DEFAULT false,
    sent_to text
);

-- ═══════════════════════════════════════════════════════
-- 2. AUTHORIZED USERS
-- ═══════════════════════════════════════════════════════
CREATE TABLE authorized_users (
    telegram_id int8 PRIMARY KEY,
    token_id uuid REFERENCES invite_tokens(id) ON DELETE SET NULL,
    admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    activated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    is_banned boolean NOT NULL DEFAULT false
);

-- ═══════════════════════════════════════════════════════
-- 3. BOT SETTINGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE bot_settings (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    strict_knowledge_mode boolean DEFAULT true,
    temperature float8 DEFAULT 0.2,
    maintenance_mode boolean DEFAULT false,
    updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 4. USER STATES
-- ═══════════════════════════════════════════════════════
CREATE TABLE user_states (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id int8 NOT NULL UNIQUE REFERENCES authorized_users(telegram_id) ON DELETE CASCADE,
    current_mode text DEFAULT 'use',
    current_step int4 DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    updated_at timestamptz DEFAULT now(),
    extracted_constraints jsonb DEFAULT '{}',
    constraint_extraction_version int4 DEFAULT 0,
    constraints_updated_at timestamp DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 5. ONBOARDING LEADS
-- ═══════════════════════════════════════════════════════
CREATE TABLE onboarding_leads (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id int8 NOT NULL REFERENCES authorized_users(telegram_id) ON DELETE CASCADE,
    admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token_id uuid REFERENCES invite_tokens(id) ON DELETE SET NULL,
    full_name text,
    phone_number text,
    experience_level text,
    goal text,
    role text,
    passion text,
    training_status varchar DEFAULT 'not_started' CHECK (training_status IN ('not_started', 'pending', 'partial', 'completed')),
    created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 6. INGESTED FILES
-- ═══════════════════════════════════════════════════════
CREATE TABLE ingested_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    filename text NOT NULL,
    uploaded_by_telegram_id int8,
    created_at timestamptz NOT NULL DEFAULT now(),
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL CHECK (category IN ('Our Products', 'Competitor Products', 'Price Lists')),
    vector_text_count int4 DEFAULT 0,
    condensation_status varchar DEFAULT 'pending',
    vector_chunk_count int4,
    condensation_completed_at timestamptz
);

-- ═══════════════════════════════════════════════════════
-- 7. FILE CHUNKS
-- ═══════════════════════════════════════════════════════
CREATE TABLE file_chunks (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_id uuid REFERENCES ingested_files(id) ON DELETE CASCADE,
    chunk_index int4,
    content text NOT NULL,
    content_hash text,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type text,
    relevance_category text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    chunk_size_bytes int4,
    embedding vector(384)
);

-- ═══════════════════════════════════════════════════════
-- 8. EMBEDDINGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE embeddings (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chunk_id int8 REFERENCES file_chunks(id) ON DELETE CASCADE,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    embedding_model text DEFAULT 'all-MiniLM-L6-v2',
    source_text text,
    created_at timestamptz DEFAULT now(),
    embedding_type text DEFAULT 'standard' CHECK (embedding_type IN ('standard', 'asymmetric', 'query_anchor')),
    anchor_text text,
    created_from_chunk_id int8,
    is_primary boolean DEFAULT true,
    vector vector(384)
);

-- ═══════════════════════════════════════════════════════
-- 9. CONDENSED KNOWLEDGE CARDS
-- ═══════════════════════════════════════════════════════
CREATE TABLE condensed_knowledge_cards (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_id uuid REFERENCES ingested_files(id) ON DELETE CASCADE,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_json jsonb NOT NULL,
    card_size_bytes int4,
    original_size_bytes int4,
    original_chunk_count int4,
    condensed_chunk_count int4,
    processing_time_seconds numeric,
    extraction_calls int4,
    reduction_calls int4,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 10. KNOWLEDGE CARD CHUNKS (Junction Table)
-- ═══════════════════════════════════════════════════════
CREATE TABLE knowledge_card_chunks (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    card_id int8 NOT NULL REFERENCES condensed_knowledge_cards(id) ON DELETE CASCADE,
    chunk_id int8 NOT NULL REFERENCES file_chunks(id) ON DELETE CASCADE,
    original_chunk_index int4,
    chunk_content text,
    chunk_category text,
    created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 11. ASYMMETRIC ANCHORS
-- ═══════════════════════════════════════════════════════
CREATE TABLE asymmetric_anchors (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    card_id int8 NOT NULL REFERENCES condensed_knowledge_cards(id) ON DELETE CASCADE,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_anchor text NOT NULL,
    document_anchor text NOT NULL,
    query_embedding_id int8 REFERENCES embeddings(id) ON DELETE SET NULL,
    document_embedding_id int8 REFERENCES embeddings(id) ON DELETE SET NULL,
    relevance_score float8,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 12. CHAT ANALYTICS
-- ═══════════════════════════════════════════════════════
CREATE TABLE chat_analytics (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id int8 NOT NULL,
    user_query text,
    bot_response text,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode text DEFAULT 'normal' CHECK (mode IN ('normal', 'training', 'testing')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 13. TEST RESULTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE test_results (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id int8 NOT NULL REFERENCES authorized_users(telegram_id) ON DELETE CASCADE,
    admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token_id uuid REFERENCES invite_tokens(id) ON DELETE SET NULL,
    category text,
    qa_data jsonb,
    score int4,
    total_questions int4,
    remarks text,
    created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 14. USER FEEDBACK
-- ═══════════════════════════════════════════════════════
CREATE TABLE user_feedback (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id int8 NOT NULL REFERENCES authorized_users(telegram_id) ON DELETE CASCADE,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 15. CONDENSATION LOGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE condensation_logs (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_id uuid REFERENCES ingested_files(id) ON DELETE SET NULL,
    stage text NOT NULL CHECK (stage IN ('MAP', 'REDUCE', 'EMBED', 'VALIDATION')),
    status text NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
    tokens_used int4,
    cost_estimate numeric,
    duration_seconds numeric,
    error_message text,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- ═══════════════════════════════════════════════════════
-- 16. CONDENSATION METRICS
-- ═══════════════════════════════════════════════════════
CREATE TABLE condensation_metrics (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type text NOT NULL,
    metric_value numeric NOT NULL,
    file_id uuid REFERENCES ingested_files(id) ON DELETE SET NULL,
    measured_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 17. EMBEDDING METRICS
-- ═══════════════════════════════════════════════════════
CREATE TABLE embedding_metrics (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type text,
    metric_value numeric,
    file_id uuid REFERENCES ingested_files(id) ON DELETE SET NULL,
    measured_at timestamptz DEFAULT now(),
    query_type text
);

-- ═══════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════
CREATE INDEX idx_file_chunks_admin ON file_chunks(admin_id);
CREATE INDEX idx_file_chunks_file ON file_chunks(file_id);
CREATE INDEX idx_embeddings_admin ON embeddings(admin_id);
CREATE INDEX idx_embeddings_chunk ON embeddings(chunk_id);
CREATE INDEX idx_knowledge_cards_admin ON condensed_knowledge_cards(admin_id);
CREATE INDEX idx_knowledge_cards_file ON condensed_knowledge_cards(file_id);
CREATE INDEX idx_chat_admin ON chat_analytics(admin_id);
CREATE INDEX idx_chat_telegram ON chat_analytics(telegram_id);
CREATE INDEX idx_ingested_admin ON ingested_files(admin_id);
CREATE INDEX idx_auth_users_admin ON authorized_users(admin_id);
CREATE INDEX idx_onboarding_admin ON onboarding_leads(admin_id);
CREATE INDEX idx_test_results_admin ON test_results(admin_id);
CREATE INDEX idx_tokens_admin ON invite_tokens(admin_id);

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- All tables have RLS enabled. The Python backend uses
-- service_role key (bypasses RLS). These policies protect
-- the frontend (anon key) and direct API access only.
-- ═══════════════════════════════════════════════════════

-- Enable RLS on ALL tables
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingested_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE condensed_knowledge_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_card_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE asymmetric_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE condensation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE condensation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_metrics ENABLE ROW LEVEL SECURITY;

-- ─── Core tables: admin_id scoped ───
CREATE POLICY "tokens_owner_policy" ON invite_tokens FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "settings_owner_policy" ON bot_settings FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "analytics_owner_policy" ON chat_analytics FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "feedback_owner_policy" ON user_feedback FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "onboarding_owner_policy" ON onboarding_leads FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "test_results_owner_policy" ON test_results FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);

-- ─── authorized_users: per-operation policies ───
CREATE POLICY "users_select_own" ON authorized_users FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "users_insert_own" ON authorized_users FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "users_update_own" ON authorized_users FOR UPDATE USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "users_delete_own" ON authorized_users FOR DELETE USING (auth.uid() = admin_id);

-- ─── user_states: scoped through authorized_users relationship ───
CREATE POLICY "user_states_owner_policy" ON user_states FOR ALL USING (
    EXISTS (SELECT 1 FROM authorized_users au WHERE au.telegram_id = user_states.telegram_id AND au.admin_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM authorized_users au WHERE au.telegram_id = user_states.telegram_id AND au.admin_id = auth.uid())
);

-- ─── Knowledge pipeline tables: admin_id scoped ───
CREATE POLICY "files_owner_policy" ON ingested_files FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "chunks_owner_policy" ON file_chunks FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "embeddings_owner_policy" ON embeddings FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "cards_owner_policy" ON condensed_knowledge_cards FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "anchors_owner_policy" ON asymmetric_anchors FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "condensation_logs_owner_policy" ON condensation_logs FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "condensation_metrics_owner_policy" ON condensation_metrics FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "embedding_metrics_owner_policy" ON embedding_metrics FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);

-- ─── knowledge_card_chunks: scoped through card ownership ───
CREATE POLICY "card_chunks_owner_policy" ON knowledge_card_chunks FOR ALL USING (
    EXISTS (SELECT 1 FROM condensed_knowledge_cards ckc WHERE ckc.id = knowledge_card_chunks.card_id AND ckc.admin_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM condensed_knowledge_cards ckc WHERE ckc.id = knowledge_card_chunks.card_id AND ckc.admin_id = auth.uid())
);

-- ═══════════════════════════════════════════════════════
-- MATCH EMBEDDINGS FUNCTION (Vector Search)
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    p_admin_id uuid DEFAULT NULL
)
RETURNS TABLE (id bigint, chunk_id bigint, content text, file_name text, similarity float)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT fc.id, fc.id as chunk_id, fc.content, inf.filename as file_name,
        1 - (fc.embedding <=> query_embedding) as similarity
    FROM file_chunks fc
    JOIN ingested_files inf ON fc.file_id = inf.id
    WHERE 1 - (fc.embedding <=> query_embedding) > match_threshold
        AND (p_admin_id IS NULL OR fc.admin_id = p_admin_id)
    ORDER BY fc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════
-- DONE. Fresh normalized database ready.
-- ═══════════════════════════════════════════════════════
