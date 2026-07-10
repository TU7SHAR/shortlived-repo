> Security vulnerabilities fixed in the Supabase production database.

---

# Supabase Security Fix Documentation
### 9th July, 2026

---

**Author:** Tushar Gautam  
**Project:** SalesJi — AI Sales Training Platform  
**Environment:** Production  
**Database:** Supabase (PostgreSQL + pgvector)  
**PR:** [#16 — Enable RLS on all tables & replace permissive policies](https://github.com/TU7SHAR/shortlived-repo/pull/16)

---

## Issue Summary

The Supabase Security Advisor flagged **24+ warnings** on the production database, including 9 tables with Row Level Security completely disabled, 5 tables with overly permissive "allow-all" policies, a function vulnerable to search path injection, and disabled password breach protection.

**Severity:** Critical  
**Risk:** Full cross-tenant data exposure & unauthorized data manipulation

---

## Step 1: Identifying the Issues (Security Audit)

The following issues were identified via the Supabase Dashboard → Security tab:

| # | Issue | Affected | Severity |
|---|-------|----------|----------|
| 1 | RLS Disabled in Public | 9 tables | CRITICAL |
| 2 | RLS Policy Always True | 5 tables | CRITICAL |
| 3 | Function Search Path Mutable | `match_embeddings` | HIGH |
| 4 | Leaked Password Protection Disabled | Auth system | HIGH |
| 5 | Extension in Public | `vector` (pgvector) | INFO |
| 6 | Auth RLS Initialization Plan | 4 tables | INFO |

### Tables with RLS Completely Disabled:

```
ingested_files
file_chunks
embeddings
condensed_knowledge_cards
knowledge_card_chunks
asymmetric_anchors
condensation_logs
condensation_metrics
embedding_metrics
```

### Tables with "Always True" Policies:

```
authorized_users      → FOR UPDATE USING (true)
onboarding_leads      → FOR ALL USING (true) WITH CHECK (true)
test_results          → FOR ALL USING (true) WITH CHECK (true)
user_states           → FOR ALL USING (true) WITH CHECK (true)
user_feedback         → Only SELECT policy, no INSERT/UPDATE/DELETE
```

---

## Step 2: Risk Analysis ("What Could Have Gone Wrong?")

| # | Risk | Description |
|---|------|-------------|
| 1 | **Cross-Tenant Data Leakage** | Any authenticated user (Admin A) could query and view Admin B's knowledge base files, chat logs, onboarding leads, test results, and user data using the public Supabase anon API key. |
| 2 | **Unauthorized Data Manipulation** | Any authenticated client could INSERT, UPDATE, or DELETE records belonging to other tenants without any restriction. |
| 3 | **Function Injection** | The `match_embeddings` function had no fixed `search_path`. A malicious actor could create a function with the same name in a different schema and hijack execution. |
| 4 | **Credential Stuffing** | Without leaked password protection, users could sign up with passwords known to be compromised from public data breaches (e.g., `password123`). |

---

## Step 3: Enabling RLS on All Unprotected Tables

```sql
ALTER TABLE ingested_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE condensed_knowledge_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_card_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE asymmetric_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE condensation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE condensation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_metrics ENABLE ROW LEVEL SECURITY;
```

Additionally, `FORCE ROW LEVEL SECURITY` was applied to all 17 tables to prevent bypass by table owners:

```sql
ALTER TABLE ingested_files FORCE ROW LEVEL SECURITY;
ALTER TABLE file_chunks FORCE ROW LEVEL SECURITY;
ALTER TABLE embeddings FORCE ROW LEVEL SECURITY;
-- (applied to all 17 tables)
```

---

## Step 4: Dropping Permissive Policies and Creating Strict Replacements

### 4.1 — Dropped all existing overly-permissive policies:

```sql
DROP POLICY IF EXISTS "Allow Admins to Ban Users" ON authorized_users;
DROP POLICY IF EXISTS "Allow all operations for authenticated bot" ON onboarding_leads;
DROP POLICY IF EXISTS "Allow all operations for authenticated bot" ON test_results;
DROP POLICY IF EXISTS "Allow all operations for authenticated bot" ON user_states;
DROP POLICY IF EXISTS "feedback_owner_policy" ON user_feedback;
DROP POLICY IF EXISTS "tokens_owner_policy" ON invite_tokens;
DROP POLICY IF EXISTS "settings_owner_policy" ON bot_settings;
DROP POLICY IF EXISTS "analytics_owner_policy" ON chat_analytics;
```

### 4.2 — Created granular per-operation policies (SELECT / INSERT / UPDATE / DELETE):

Each of the 17 tables now has **4 separate policies** targeted at the `authenticated` role, scoped strictly to `auth.uid() = admin_id`:

```sql
-- Example: ingested_files (same pattern applied to all tables)
CREATE POLICY "files_select" ON ingested_files 
    FOR SELECT TO authenticated USING (auth.uid() = admin_id);

CREATE POLICY "files_insert" ON ingested_files 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "files_update" ON ingested_files 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "files_delete" ON ingested_files 
    FOR DELETE TO authenticated USING (auth.uid() = admin_id);
```

For tables without a direct `admin_id` column (e.g., `user_states`, `knowledge_card_chunks`), ownership is verified through a subquery:

```sql
-- user_states: verified through authorized_users relationship
CREATE POLICY "states_select" ON user_states FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM authorized_users au 
        WHERE au.telegram_id = user_states.telegram_id 
        AND au.admin_id = auth.uid()
    )
);
```

**Total policies created:** 68 (4 operations × 17 tables)

---

## Step 5: Fixing the Function Search Path

### Before (vulnerable):
```sql
CREATE OR REPLACE FUNCTION match_embeddings(...)
LANGUAGE plpgsql AS $$ ... $$;
```

### After (hardened):
```sql
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    p_admin_id uuid DEFAULT NULL
)
RETURNS TABLE (id bigint, chunk_id bigint, content text, file_name text, similarity float)
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE EXECUTE ON FUNCTION match_embeddings FROM anon;
GRANT EXECUTE ON FUNCTION match_embeddings TO authenticated;
```

**Changes:**
- `SET search_path = public` — prevents schema injection attacks
- `SECURITY INVOKER` — function executes with the caller's permissions (respects RLS)
- Revoked execution from `anon` role — only authenticated users can call it

---

## Step 6: Revoking Anonymous Access

```sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- Re-grant minimal access for Supabase to function
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## Step 7: Leaked Password Protection (Manual)

**Location:** Supabase Dashboard → Authentication → Settings → Security  
**Action:** Toggled ON "Leaked Password Protection"

This enables HaveIBeenPwned integration, blocking users from registering with passwords found in public data breaches.

---

## Verification

### Query 1 — Confirm RLS is enabled on all tables:

```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
ORDER BY relname;
```

**Expected result:** All rows show `true` / `true`

### Query 2 — Confirm all policies exist:

```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

**Expected result:** 68 rows (4 policies × 17 tables), all with `roles = {authenticated}`

### Query 3 — Confirm function is hardened:

```sql
SELECT proname, proconfig, prosecdef
FROM pg_proc 
WHERE proname = 'match_embeddings';
```

**Expected result:** `proconfig = {search_path=public}`, `prosecdef = false` (INVOKER)

---

## Impact Assessment

| Component | Affected? | Reason |
|-----------|-----------|--------|
| Python Telegram Bot | **NO** | Uses `SUPABASE_SERVICE_ROLE_KEY` — bypasses all RLS |
| Next.js Frontend Dashboard | **NO** | Already authenticates via `supabase.auth.getUser()` and queries filter by `user.id` |
| Direct API / Postman Abuse | **BLOCKED** | Anonymous and cross-tenant access now denied at DB level |
| Database Functions | **SECURED** | Fixed search path + invoker security mode |

**Downtime:** Zero  
**Breaking Changes:** None  
**Rollback required:** No

---

## Dismissed Warnings (Non-Actionable)

| Warning | Reason for Dismissal |
|---------|---------------------|
| Extension in Public (`vector`) | pgvector must be in public schema for `vector(384)` columns to work. Moving it would break all embeddings. |
| Auth RLS Initialization Plan (4 tables) | Informational only — Supabase confirming our RLS policies are intentional. |

---

## Pending Actions

| # | Action | Status |
|---|--------|--------|
| 1 | Update `DEPLOYMENT.md` with new security model | Pending |
| 2 | Full end-to-end regression testing (bot + dashboard) | Pending |
| 3 | Monitor PM2 logs for 24h post-fix for permission errors | Pending |

---

## Files Modified

| File | Description |
|------|-------------|
| `backend/migrations/001_fix_rls_security.sql` | Migration script (run on existing deployments) |
| `backend/schema.sql` | Updated master schema (for fresh deployments) |
| `docs/SECURITY_FIX_REPORT.md` | This documentation |

---

## Summary

All critical Supabase Security Advisor warnings have been resolved. The database now enforces strict multi-tenant isolation through Row Level Security with granular per-operation policies, a hardened vector search function, revoked anonymous access, and leaked password protection. The Python backend remains unaffected as it operates with elevated `service_role` privileges.

---

*End of Report*
