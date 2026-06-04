-- 1. INVITE TOKENS
CREATE TABLE invite_tokens (
    token_string VARCHAR(255) PRIMARY KEY,
    id VARCHAR(36), -- Simplified for import
    created_by VARCHAR(36),
    created_at TIMESTAMP,
    is_used BOOLEAN,
    used_by_telegram_id BIGINT,
    token_type VARCHAR(50),
    used_by_username VARCHAR(100),
    caption TEXT,
    is_revoked BOOLEAN,
    sent_to VARCHAR(255)
);

-- 2. AUTHORIZED USERS
CREATE TABLE authorized_users (
    telegram_id BIGINT PRIMARY KEY,
    token_used VARCHAR(255),
    activated_at TIMESTAMP,
    created_at TIMESTAMP,
    is_banned BOOLEAN
);

-- 3. BOT SETTINGS
CREATE TABLE bot_settings (
    id SERIAL PRIMARY KEY,
    created_by VARCHAR(36),
    strict_knowledge_mode BOOLEAN,
    temperature FLOAT,
    maintenance_mode BOOLEAN,
    updated_at TIMESTAMP
);

-- 4. CHAT ANALYTICS
CREATE TABLE chat_analytics (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    username VARCHAR(100),
    user_query TEXT,
    bot_response TEXT,
    admin_id VARCHAR(36),
    created_at TIMESTAMP
);

-- 5. INGESTED FILES
CREATE TABLE ingested_files (
    id VARCHAR(36) PRIMARY KEY,
    filename VARCHAR(255),
    uploaded_by_username VARCHAR(100),
    uploaded_by_id BIGINT,
    created_at TIMESTAMP,
    created_by VARCHAR(36),
    category VARCHAR(50)
);

-- 6. USER STATES (Hidden Table)
CREATE TABLE user_states (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    current_mode VARCHAR(20),
    current_step INTEGER,
    metadata TEXT, -- Changed from JSONB for compatibility
    updated_at TIMESTAMP
);

-- 7. ONBOARDING LEADS
CREATE TABLE onboarding_leads (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    experience_level VARCHAR(50),
    goal TEXT,
    role VARCHAR(100),
    passion TEXT,
    created_at TIMESTAMP
);

-- 8. QUIZ SCORES
CREATE TABLE quiz_scores (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    category VARCHAR(50),
    score INTEGER,
    total_questions INTEGER,
    created_at TIMESTAMP
);

-- 9. TEST RESULTS
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    category VARCHAR(50),
    qa_data TEXT, -- Changed from JSONB
    score INTEGER,
    total_questions INTEGER,
    remarks TEXT,
    created_at TIMESTAMP
);

-- RELATIONSHIPS (Explicitly defined for the visualizer)
ALTER TABLE authorized_users ADD CONSTRAINT fk_user_token FOREIGN KEY (token_used) REFERENCES invite_tokens(token_string);
ALTER TABLE chat_analytics ADD CONSTRAINT fk_chat_user FOREIGN KEY (telegram_id) REFERENCES authorized_users(telegram_id);
ALTER TABLE user_states ADD CONSTRAINT fk_state_user FOREIGN KEY (telegram_id) REFERENCES authorized_users(telegram_id);
ALTER TABLE onboarding_leads ADD CONSTRAINT fk_lead_user FOREIGN KEY (telegram_id) REFERENCES authorized_users(telegram_id);
ALTER TABLE quiz_scores ADD CONSTRAINT fk_quiz_user FOREIGN KEY (telegram_id) REFERENCES authorized_users(telegram_id);
ALTER TABLE test_results ADD CONSTRAINT fk_test_user FOREIGN KEY (telegram_id) REFERENCES authorized_users(telegram_id);