-- ═══════════════════════════════════════════════════════════════════
-- SUPER ADMIN AUDIT LOGS TABLE
-- Tracks all super admin actions for accountability and security
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
    id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    metadata jsonb DEFAULT '{}',
    performed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by action type and time range
CREATE INDEX idx_audit_logs_action ON super_admin_audit_logs(action);
CREATE INDEX idx_audit_logs_performed_at ON super_admin_audit_logs(performed_at DESC);
CREATE INDEX idx_audit_logs_entity ON super_admin_audit_logs(entity_type, entity_id);

-- RLS: Only service_role can access (super admin uses supabaseAdmin which bypasses RLS anyway)
ALTER TABLE super_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- No policies needed — service_role key bypasses RLS.
-- This ensures the table is completely locked from anon/authenticated roles.

COMMENT ON TABLE super_admin_audit_logs IS 'Audit trail for all super admin actions. Accessed only via service_role key.';
COMMENT ON COLUMN super_admin_audit_logs.action IS 'Action type: LOGIN, LOGOUT, BAN_USER, UNBAN_USER, DELETE_USER, REVOKE_TOKEN, DELETE_FILE, ENABLE_MAINTENANCE, etc.';
COMMENT ON COLUMN super_admin_audit_logs.entity_type IS 'Table or resource affected: authorized_users, invite_tokens, ingested_files, bot_settings, session, chat_analytics';
COMMENT ON COLUMN super_admin_audit_logs.entity_id IS 'Primary key of the affected record (nullable for bulk/session actions)';
COMMENT ON COLUMN super_admin_audit_logs.metadata IS 'Additional context as JSON (e.g., count for bulk ops, old/new values)';
