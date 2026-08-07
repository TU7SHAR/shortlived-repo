-- ═══════════════════════════════════════════════════════════════════
-- WEB FLOW STATE — lets web users run the SAME stateful onboarding /
-- training / testing flows as the Telegram bot.
-- ═══════════════════════════════════════════════════════════════════

-- Per-web-user flow state (mirrors user_states, keyed by auth uuid)
CREATE TABLE IF NOT EXISTS web_user_states (
    user_id uuid PRIMARY KEY,             -- Supabase auth user id
    admin_id uuid,
    current_mode text DEFAULT 'assistant',-- assistant | onboarding | training | testing
    current_step int DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE web_user_states ENABLE ROW LEVEL SECURITY;

-- Allow web users (no telegram_id) to have onboarding leads + test results.
-- telegram_id becomes nullable; a web_user_id column links to the web user.
ALTER TABLE onboarding_leads ALTER COLUMN telegram_id DROP NOT NULL;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS web_user_id uuid;

ALTER TABLE test_results ALTER COLUMN telegram_id DROP NOT NULL;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS web_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_onboarding_web_user ON onboarding_leads(web_user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_web_user ON test_results(web_user_id);

COMMENT ON TABLE web_user_states IS 'Flow state for web chat users (onboarding/training/testing), keyed by Supabase auth id.';
