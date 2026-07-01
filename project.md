# SALESJI - Project Analysis Document

## 1. Project Overview

**Salesji** is a full-stack AI-powered Telegram Sales Assistant platform with a Next.js admin dashboard. It enables businesses to onboard, train, test, and assist their sales teams using proprietary company data via a Telegram bot, backed by a RAG (Retrieval-Augmented Generation) pipeline.

**Developed by:** Tushar Gautam | Drish Infotech

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.2.4, React 19, Tailwind CSS 4, GSAP, Three.js, Recharts, Lucide Icons |
| **Backend** | Python 3, python-telegram-bot 22.7, Webhook-based |
| **Database** | Supabase (PostgreSQL + pgvector), Row Level Security |
| **LLM Providers** | Groq (Llama 4 Scout) + Google Gemini 2.0 Flash (auto-failover) |
| **Embeddings** | FastEmbed (ONNX, all-MiniLM-L6-v2, 384-dim vectors) |
| **Web Scraping** | Firecrawl (JS-rendered), BeautifulSoup, MarkItDown |
| **Clustering** | scikit-learn KMeans, NumPy |
| **Auth** | Supabase Auth (email/password + Google OAuth) |
| **Hosting** | Webhook on port 8443 (likely Railway/Render) |

---

## 3. Architecture & Code Structure

```
/
├── frontend/                    # Next.js Admin Dashboard
│   ├── app/
│   │   ├── (auth)/             # Login, Register, Forgot Password, Verify
│   │   ├── (dashboard)/        # Protected admin pages
│   │   │   ├── dashboard/      # Token management, global metrics
│   │   │   ├── onboarding/     # Team onboarding status tracker
│   │   │   ├── training/       # Training analytics per user
│   │   │   ├── knowledge/      # Knowledge base file manager
│   │   │   ├── conversations/  # Chat analytics viewer
│   │   │   ├── analytics/      # Usage analytics
│   │   │   ├── settings/       # Bot settings (temperature, strict mode)
│   │   │   ├── billing/        # Subscription (DEMO only)
│   │   │   ├── manage-plan/    # Plan selection (DEMO only)
│   │   │   ├── feedback/       # User feedback viewer
│   │   │   ├── users/          # User management + ban controls
│   │   │   └── invites/        # Invite token management
│   │   ├── admin/              # Super-admin panel
│   │   ├── actions/            # Server actions (auth, bot settings)
│   │   ├── lib/                # Supabase client, schema map, DB helpers
│   │   └── context/            # SubscriptionContext provider
│   └── public/                 # Static assets
│
├── backend/                     # Python Telegram Bot Engine
│   ├── main.py                 # Bot entry point, webhook config, handler registration
│   ├── handlers.py             # Core logic: commands, onboarding, training, testing, RAG chat
│   ├── database.py             # Supabase CRUD operations, vector search
│   ├── config.py               # Environment config (LLM, Telegram, Supabase)
│   ├── llm_client.py           # Unified LLM client with auto-failover (Groq/Gemini)
│   ├── embedder.py             # FastEmbed local embeddings (384-dim)
│   ├── data_condensation.py    # AI data pipeline: chunking, extraction, clustering, cards
│   ├── context_ranker.py       # Sandwich reranking to fix "lost in middle" problem
│   ├── constraint_extractor.py # Regex + LLM extraction of user constraints (budget, timeline)
│   ├── sliding_window.py       # Conversation memory compression (summarization)
│   ├── scraper.py              # Firecrawl + sitemap + single-page scraping
│   ├── schema_map.py           # Column name constants for type safety
│   ├── groq_engine.py          # Legacy Groq wrapper (now routed through llm_client)
│   └── schema.sql              # Full 17-table database schema with RLS
│
└── README.md                    # Project overview
```

---

## 4. Sales Funnel Structure

The platform implements a **B2B SaaS funnel** targeting sales managers who want to train their teams using AI:

### Funnel Stages:

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: AWARENESS (Landing Page)                          │
│  - Marketing site with 3D animations (Three.js/GSAP)        │
│  - Feature showcases, pricing tiers (demo)                   │
│  - CTA: "Sign Up" / "Start Free Trial"                      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: REGISTRATION (Admin Onboarding)                   │
│  - Email/password or Google OAuth sign-up                     │
│  - Email verification flow                                    │
│  - Auto-generates first admin invite token                   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: ACTIVATION (Knowledge Base Setup)                  │
│  - Admin uploads product docs (PDF, DOCX, XLSX, etc.)        │
│  - Admin crawls competitor/own websites via /crawl            │
│  - AI condenses documents into structured Knowledge Cards    │
│  - Vectors stored in pgvector for semantic search            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: DISTRIBUTION (Invite Token System)                 │
│  - Admin creates invite tokens from dashboard                │
│  - Tokens sent to sales reps via email or direct link        │
│  - Deep-link: t.me/BotName?start=TOKEN_SUFFIX               │
│  - Single-use tokens with revocation capability              │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 5: USER ONBOARDING (Telegram Bot)                     │
│  - 6-step conversational onboarding (name, phone, role,      │
│    experience, goal, passion/drive)                           │
│  - Data stored in onboarding_leads table                     │
│  - Personalization seeds for training & testing              │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 6: ENGAGEMENT (Training + Testing + Chat)             │
│  - Training Module: AI teaches products → competitors        │
│  - Test Module: 9-question dynamic exam with MCQ + roleplay  │
│  - Chat Mode: RAG-powered Q&A with constraint tracking       │
│  - All interactions logged in chat_analytics                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 7: RETENTION & MONETIZATION                           │
│  - Admin dashboard shows team performance analytics          │
│  - Test scores, training completion rates                    │
│  - Billing/subscription page (currently DEMO/placeholder)    │
│  - Plan management with tiered features                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Funnel Metrics Tracked:
- Total invites generated vs. claimed
- Onboarding completion rate
- Training completion status (not_started → partial → completed)
- Test scores per user
- Chat interaction volume per admin tenant

---

## 5. Multi-Tenancy Model

The system is **multi-tenant by admin_id**:
- Each admin (business owner) has isolated data
- Row Level Security (RLS) enforces tenant boundaries at DB level
- Users (sales reps) belong to exactly one admin via `token_id → admin_id` chain
- All files, embeddings, chats, and tests are scoped to `admin_id`

---

## 6. Code Pain Points

### 6.1 Backend Pain Points

| Issue | Location | Severity | Description |
|-------|----------|----------|-------------|
| **Monolithic handlers.py** | `handlers.py` (800+ lines) | High | Single file contains ALL bot logic: onboarding, training, testing, file upload, crawl, RAG chat. No separation of concerns. |
| **No async database client** | `database.py` | Medium | Uses synchronous Supabase client in an async bot. All DB calls block the event loop via `asyncio.to_thread` or direct calls. |
| **Duplicate code in scraper.py** | `scraper.py` (bottom) | Medium | Contains a second, dead copy of `crawl_website_links` function below the `extract_sitemap_urls` function — unreachable code. |
| **PicklePersistence on disk** | `main.py` | Medium | `bot_memory.pickle` stores all user state on local disk. If server restarts/redeploys, state can be lost or corrupted. |
| **`os.execl` restart** | `handlers.py` → `restart_command` | High | Admin can trigger a full process restart via `/restart`. Dangerous on managed hosting; can cause infinite restart loops. |
| **No rate limiting** | `handlers.py` | Medium | No protection against message flooding. A user can spam the bot and exhaust LLM API credits rapidly. |
| **Hardcoded Groq rate-limit sleep** | `data_condensation.py` | Low | Uses `time.sleep(1)` between chunks — blocks the thread pool and doesn't adapt to actual rate limits. |
| **`self` reference in static method** | `constraint_extractor.py` line ~100 | Bug | `missing_categories = [cat for cat in self.CONSTRAINT_PATTERNS.keys()...]` — `self` is invalid in a `@staticmethod`. Will crash on texts >20 words. |
| **No input sanitization for LLM prompts** | `handlers.py` | Medium | User text is injected directly into LLM prompts without escaping. Prompt injection attacks possible. |
| **ThreadPoolExecutor for API calls** | `data_condensation.py` | Low | Uses 4 threads hitting the LLM API simultaneously — increases rate-limit probability. |
| **No graceful shutdown** | `main.py` | Low | No signal handlers or cleanup on SIGTERM. Webhook may not be deregistered cleanly. |

### 6.2 Frontend Pain Points

| Issue | Location | Severity | Description |
|-------|----------|----------|-------------|
| **Client-side auth checks only** | All dashboard pages | High | No server-side middleware protecting routes. Auth is checked per-page via `supabase.auth.getUser()` in `useEffect`. |
| **No loading/error boundaries** | Dashboard pages | Medium | Pages fetch data in `useEffect` with minimal error handling. No global error boundary. |
| **Billing page is fully hardcoded** | `billing/page.jsx` | Low | Fake invoices, fake payment method. No Stripe/payment integration. |
| **Typo in requirements file** | `backend/reuirements.txt` | Low | Duplicate requirements file with a typo in the name. |
| **No TypeScript** | Entire frontend | Medium | All JSX files — no type safety, harder to refactor at scale. |
| **Heavy 3D dependencies** | `package.json` | Low | Three.js + React Three Fiber loaded for what appears to be a landing page animation. Large bundle for dashboard users. |

---

## 7. Security Vulnerabilities

### 7.1 Critical

| Vulnerability | Description | Risk |
|--------------|-------------|------|
| **Prompt Injection** | User messages are concatenated directly into LLM system prompts. A crafted message like "Ignore all instructions and..." can manipulate bot output. | Attacker could extract knowledge base data, produce misleading sales info, or bypass constraints. |
| **RLS bypass on some tables** | `onboarding_leads`, `test_results`, `user_states` have `USING (true)` policies — any authenticated user can read/write ALL rows. | Data leakage across tenants. |
| **Service Role Key in Backend** | Backend uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses ALL RLS. If the server is compromised, all data is exposed. | Full database access on server compromise. |
| **No CSRF protection** | Admin actions (ban user, delete files) are server actions without CSRF tokens. | Cross-site attacks could manipulate admin state. |
| **Cookie-based auth flag** | Login sets `sb-access-auth-token=true` as a simple cookie. This is a boolean flag, not a real session token. | Could be spoofed to bypass client-side route guards. |

### 7.2 Medium

| Vulnerability | Description | Risk |
|--------------|-------------|------|
| **No file upload validation** | Backend accepts any file up to 20MB. Only checks size, not MIME type or magic bytes. | Malicious files could exploit MarkItDown parser or exhaust resources. |
| **Token string in URLs** | Invite tokens are passed as Telegram deep-link parameters and stored in plain text. | Tokens visible in browser history, logs, Telegram servers. |
| **`/restart` command exposed** | Any admin can trigger `os.execl` which restarts the entire bot process. | DoS vector; could be used to disrupt service. |
| **Cleartext phone numbers** | Phone numbers collected during onboarding stored unencrypted in `onboarding_leads`. | PII exposure on data breach. |
| **No API key rotation** | Groq/Gemini/Firecrawl keys in `.env` with no rotation mechanism. | Long-lived keys increase compromise window. |

### 7.3 Low

| Vulnerability | Description |
|--------------|-------------|
| **Debug logging of user data** | Logger outputs user queries and constraint data at INFO level. |
| **No HTTPS enforcement** | Webhook listens on `0.0.0.0` — relies on hosting platform for TLS. |
| **Google Analytics without consent** | `GoogleAnalytics.jsx` present — may violate GDPR without consent banner. |

---

## 8. Scalability Concerns

### 8.1 Current Architecture Limitations

| Concern | Impact | Threshold |
|---------|--------|-----------|
| **Single-process bot** | All Telegram messages processed by one Python process. No horizontal scaling. | ~50-100 concurrent users will cause noticeable latency. |
| **Synchronous LLM calls** | `llm_complete()` is sync, wrapped in `asyncio.to_thread`. Thread pool limits parallelism. | 10+ simultaneous LLM calls will queue up. |
| **Full knowledge base loaded per message** | `get_tenant_files()` fetches ALL files + condensed cards from DB on every message. | Admins with 50+ files will see 2-5s overhead per query. |
| **No caching layer** | Every request hits Supabase directly. No Redis/memcached for hot data (settings, user state, file maps). | DB connection pool exhaustion at ~200+ RPM. |
| **PicklePersistence** | Bot state (user_data, bot_data) stored in a single pickle file on disk. | Grows unboundedly; corrupts on concurrent writes. |
| **pgvector without IVFFlat/HNSW index** | `match_embeddings` uses brute-force `<=>` distance operator. | Scans degrade at 100K+ embeddings. |
| **Webhook on single port** | One webhook endpoint, one process. No load balancing. | Cannot scale horizontally without architectural change. |
| **Large LLM context windows** | Full AI rules (~3000 chars) + constraints + all file contents + vector results injected per query. | Token costs balloon; may hit context limits at 50K+ tokens. |

### 8.2 Scaling Recommendations

| Priority | Recommendation | Effort |
|----------|---------------|--------|
| **P0** | Add Redis caching for `get_bot_settings()`, `get_tenant_files()`, `get_user_state()` | Medium |
| **P0** | Create IVFFlat or HNSW index on `file_chunks.embedding` and `embeddings.vector` columns | Low |
| **P1** | Migrate to async Supabase client (or direct asyncpg) | Medium |
| **P1** | Split `handlers.py` into domain modules (onboarding, training, testing, chat, admin) | Medium |
| **P1** | Replace PicklePersistence with database-backed persistence (or Redis) | Medium |
| **P2** | Implement message queue (Celery/RQ) for long-running tasks (condensation, crawling) | High |
| **P2** | Add streaming LLM responses for better UX on long answers | Medium |
| **P2** | Implement token bucket rate limiting per user | Low |
| **P3** | Containerize with Docker + Kubernetes for horizontal pod autoscaling | High |
| **P3** | Implement webhook routing to multiple bot instances via a dispatcher | High |

---

## 9. Database Schema Summary (17 Tables)

```
invite_tokens          → Token generation & tracking
authorized_users       → Telegram user registry
bot_settings           → Per-admin bot configuration
user_states            → Current mode, step, metadata, constraints
onboarding_leads       → User profile data from onboarding
ingested_files         → File metadata registry
file_chunks            → Chunked text + embeddings (vector(384))
embeddings             → Dedicated embedding table with types
condensed_knowledge_cards → AI-generated knowledge cards (JSON)
knowledge_card_chunks  → Junction: cards ↔ chunks
asymmetric_anchors     → Q&A-style search anchors
chat_analytics         → All conversation logs
test_results           → Exam results + Q&A data
user_feedback          → User feedback submissions
condensation_logs      → Processing pipeline audit trail
condensation_metrics   → Performance metrics
embedding_metrics      → Vector search performance
```

---

## 10. Key Differentiators / Strengths

1. **Sophisticated RAG Pipeline** — Multi-stage: chunking → fact extraction → semantic clustering → knowledge cards → asymmetric anchors → context reranking (sandwich pattern)
2. **Constraint-Aware Responses** — Extracts budget/timeline/must-haves and validates LLM output against them
3. **Multi-Provider LLM Failover** — Automatic fallback between Groq and Gemini with zero config changes
4. **Lightweight Embeddings** — FastEmbed (ONNX) instead of PyTorch saves ~1.3GB RAM, runs on $4 servers
5. **Category-Aware Knowledge** — Files tagged as "Our Products" / "Competitor Products" / "Price Lists" with different LLM treatment strategies
6. **Sliding Window Memory** — Compresses long training conversations to save tokens while preserving context
7. **Real-Time Access Control** — Token revocation instantly blocks users mid-session

---

## 11. Monetization Status

- **Current:** No active payment integration. Billing page is a demo/placeholder.
- **Planned:** Subscription tiers visible in `manage-plan` page (Starter/Pro/Enterprise)
- **Model:** Per-admin monthly subscription with feature gating
- **Missing:** Stripe integration, usage metering, overage billing, free trial logic

---

## 12. Quick-Start Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure API keys
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

---

*Generated: July 2026 | Analysis based on full codebase review*
