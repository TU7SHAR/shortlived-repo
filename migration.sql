-- ═══════════════════════════════════════════════════════════════════════════
-- SALESJI DATABASE NORMALIZATION - FULL MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════
-- BATCH 1: Rename created_by → admin_id (consistency)
-- ═══════════════════════════════════════════════════════

ALTER TABLE invite_tokens RENAME COLUMN created_by TO admin_id;
ALTER TABLE ingested_files RENAME COLUMN created_by TO admin_id;
ALTER TABLE bot_settings RENAME COLUMN created_by TO admin_id;


-- ═══════════════════════════════════════════════════════
-- BATCH 2: Fix admin_id type to uuid everywhere
-- ═══════════════════════════════════════════════════════

ALTER TABLE file_chunks ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE embeddings ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE condensed_knowledge_cards ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE onboarding_leads ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE chat_analytics ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE test_results ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE user_feedback ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE condensation_logs ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE condensation_metrics ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE embedding_metrics ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;
ALTER TABLE asymmetric_anchors ALTER COLUMN admin_id TYPE uuid USING admin_id::uuid;


-- ═══════════════════════════════════════════════════════
-- BATCH 3: Replace token_used (text URL) with token_id (FK uuid)
-- ═══════════════════════════════════════════════════════

-- Add token_id to authorized_users
ALTER TABLE authorized_users ADD COLUMN token_id uuid;

-- Backfill token_id from matching token_string
UPDATE authorized_users au
SET token_id = it.id
FROM invite_tokens it
WHERE au.token_used = it.token_string;

-- Add admin_id to authorized_users (derived from token's admin)
ALTER TABLE authorized_users ADD COLUMN admin_id uuid;

UPDATE authorized_users au
SET admin_id = it.admin_id
FROM invite_tokens it
WHERE au.token_id = it.id;

-- Add token_id to onboarding_leads
ALTER TABLE onboarding_leads ADD COLUMN token_id uuid;

-- Backfill
UPDATE onboarding_leads ol
SET token_id = it.id
FROM invite_tokens it
WHERE ol.token_used = it.token_string;

-- Drop the old text columns
ALTER TABLE authorized_users DROP COLUMN IF EXISTS token_used;
ALTER TABLE onboarding_leads DROP COLUMN IF EXISTS token_used;


-- ═══════════════════════════════════════════════════════
-- BATCH 4: Add Foreign Key constraints with CASCADE
-- ═══════════════════════════════════════════════════════

-- invite_tokens → auth.users
ALTER TABLE invite_tokens
ADD CONSTRAINT fk_tokens_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- authorized_users → invite_tokens
ALTER TABLE authorized_users
ADD CONSTRAINT fk_users_token FOREIGN KEY (token_id) REFERENCES invite_tokens(id) ON DELETE SET NULL;

-- authorized_users → auth.users
ALTER TABLE authorized_users
ADD CONSTRAINT fk_users_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- bot_settings → auth.users
ALTER TABLE bot_settings
ADD CONSTRAINT fk_settings_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ingested_files → auth.users
ALTER TABLE ingested_files
ADD CONSTRAINT fk_files_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- file_chunks → ingested_files
ALTER TABLE file_chunks
ADD CONSTRAINT fk_chunks_file FOREIGN KEY (file_id) REFERENCES ingested_files(id) ON DELETE CASCADE;

-- file_chunks → auth.users
ALTER TABLE file_chunks
ADD CONSTRAINT fk_chunks_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- condensed_knowledge_cards → ingested_files
ALTER TABLE condensed_knowledge_cards
ADD CONSTRAINT fk_cards_file FOREIGN KEY (file_id) REFERENCES ingested_files(id) ON DELETE CASCADE;

-- condensed_knowledge_cards → auth.users
ALTER TABLE condensed_knowledge_cards
ADD CONSTRAINT fk_cards_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- embeddings → file_chunks
ALTER TABLE embeddings
ADD CONSTRAINT fk_embeddings_chunk FOREIGN KEY (chunk_id) REFERENCES file_chunks(id) ON DELETE CASCADE;

-- embeddings → auth.users
ALTER TABLE embeddings
ADD CONSTRAINT fk_embeddings_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- onboarding_leads → auth.users
ALTER TABLE onboarding_leads
ADD CONSTRAINT fk_leads_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- chat_analytics → auth.users
ALTER TABLE chat_analytics
ADD CONSTRAINT fk_chat_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- test_results → auth.users
ALTER TABLE test_results
ADD CONSTRAINT fk_tests_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_feedback → auth.users
ALTER TABLE user_feedback
ADD CONSTRAINT fk_feedback_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- asymmetric_anchors → condensed_knowledge_cards
ALTER TABLE asymmetric_anchors
ADD CONSTRAINT fk_anchors_card FOREIGN KEY (card_id) REFERENCES condensed_knowledge_cards(id) ON DELETE CASCADE;

-- asymmetric_anchors → auth.users
ALTER TABLE asymmetric_anchors
ADD CONSTRAINT fk_anchors_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- knowledge_card_chunks → condensed_knowledge_cards
ALTER TABLE knowledge_card_chunks
ADD CONSTRAINT fk_kcc_card FOREIGN KEY (card_id) REFERENCES condensed_knowledge_cards(id) ON DELETE CASCADE;

-- knowledge_card_chunks → file_chunks
ALTER TABLE knowledge_card_chunks
ADD CONSTRAINT fk_kcc_chunk FOREIGN KEY (chunk_id) REFERENCES file_chunks(id) ON DELETE CASCADE;


-- ═══════════════════════════════════════════════════════
-- BATCH 5: CHECK constraints + UNIQUE constraints
-- ═══════════════════════════════════════════════════════

-- Token type: only 'user' or 'admin' (no 'guest')
ALTER TABLE invite_tokens
ADD CONSTRAINT chk_token_type CHECK (token_type IN ('user', 'admin'));

-- File category must be one of the valid categories
ALTER TABLE ingested_files
ADD CONSTRAINT chk_file_category CHECK (category IN ('Our Products', 'Competitor Products', 'Price Lists'));

-- Training status must be valid
ALTER TABLE onboarding_leads
ADD CONSTRAINT chk_training_status CHECK (training_status IN ('pending', 'partial', 'completed'));

-- Embedding type must be valid
ALTER TABLE embeddings
ADD CONSTRAINT chk_embedding_type CHECK (embedding_type IN ('standard', 'asymmetric', 'query_anchor'));

-- Chat mode must be valid
ALTER TABLE chat_analytics
ADD CONSTRAINT chk_chat_mode CHECK (mode IN ('normal', 'training', 'testing'));

-- No duplicate filenames per admin
ALTER TABLE ingested_files
ADD CONSTRAINT uq_admin_filename UNIQUE (admin_id, filename);

-- No duplicate chunk index per file
ALTER TABLE file_chunks
ADD CONSTRAINT uq_file_chunk_index UNIQUE (file_id, chunk_index);


-- ═══════════════════════════════════════════════════════
-- BATCH 6: Cleanup + Performance Indexes
-- ═══════════════════════════════════════════════════════

-- Remove duplicate condensed_data column (data lives in condensed_knowledge_cards table)
ALTER TABLE ingested_files DROP COLUMN IF EXISTS condensed_data;

-- Drop redundant quiz_scores table (test_results already stores everything)
DROP TABLE IF EXISTS quiz_scores;

-- Performance indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_file_chunks_admin ON file_chunks(admin_id);
CREATE INDEX IF NOT EXISTS idx_file_chunks_file ON file_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_admin ON embeddings(admin_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk ON embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_admin ON condensed_knowledge_cards(admin_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_file ON condensed_knowledge_cards(file_id);
CREATE INDEX IF NOT EXISTS idx_chat_admin ON chat_analytics(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_telegram ON chat_analytics(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ingested_admin ON ingested_files(admin_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_admin ON authorized_users(admin_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_admin ON onboarding_leads(admin_id);
CREATE INDEX IF NOT EXISTS idx_test_results_admin ON test_results(admin_id);
CREATE INDEX IF NOT EXISTS idx_tokens_admin ON invite_tokens(admin_id);


-- ═══════════════════════════════════════════════════════
-- BATCH 7: Add NOT NULL where it makes sense
-- ═══════════════════════════════════════════════════════

ALTER TABLE invite_tokens ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE invite_tokens ALTER COLUMN is_used SET DEFAULT false;
ALTER TABLE invite_tokens ALTER COLUMN is_used SET NOT NULL;
ALTER TABLE invite_tokens ALTER COLUMN is_revoked SET DEFAULT false;
ALTER TABLE invite_tokens ALTER COLUMN is_revoked SET NOT NULL;
ALTER TABLE invite_tokens ALTER COLUMN token_type SET DEFAULT 'user';
ALTER TABLE invite_tokens ALTER COLUMN token_type SET NOT NULL;
ALTER TABLE invite_tokens ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE invite_tokens ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE authorized_users ALTER COLUMN is_banned SET DEFAULT false;
ALTER TABLE authorized_users ALTER COLUMN is_banned SET NOT NULL;

ALTER TABLE ingested_files ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE ingested_files ALTER COLUMN filename SET NOT NULL;
ALTER TABLE ingested_files ALTER COLUMN category SET NOT NULL;
ALTER TABLE ingested_files ALTER COLUMN is_condensed SET DEFAULT false;
ALTER TABLE ingested_files ALTER COLUMN is_condensed SET NOT NULL;
ALTER TABLE ingested_files ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE ingested_files ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE file_chunks ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE file_chunks ALTER COLUMN file_name SET NOT NULL;
ALTER TABLE file_chunks ALTER COLUMN content SET NOT NULL;
ALTER TABLE file_chunks ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE embeddings ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE embeddings ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE condensed_knowledge_cards ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE condensed_knowledge_cards ALTER COLUMN file_name SET NOT NULL;
ALTER TABLE condensed_knowledge_cards ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE bot_settings ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE bot_settings ALTER COLUMN strict_knowledge_mode SET DEFAULT true;
ALTER TABLE bot_settings ALTER COLUMN temperature SET DEFAULT 0.2;
ALTER TABLE bot_settings ALTER COLUMN maintenance_mode SET DEFAULT false;

ALTER TABLE chat_analytics ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE chat_analytics ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE chat_analytics ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE user_feedback ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE user_feedback ALTER COLUMN feedback SET NOT NULL;


-- ═══════════════════════════════════════════════════════
-- DONE! Your database is now normalized.
-- ═══════════════════════════════════════════════════════
