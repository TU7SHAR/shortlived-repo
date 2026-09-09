# SalesJi — Project Handover (Start Here)

> **Purpose of this document:** the single "start here" reference for whoever takes ownership of SalesJi.
> It covers what the system is, what is live, how to set it up, how to run and maintain it day to day,
> what to hand over (access/accounts), known issues, and where to find deeper docs.
>
> **Outgoing owner:** Tushar Gautam (Drish Infotech)
> **Handover date:** _fill in_
> **New owner / maintainer:** _fill in_

---

## 0. Handover Checklist (tick these off on the KT call)

Access is not "handed over" until the new owner can log in **without** the previous owner's help. Confirm each:

- [ ] **GitHub repo access** — new maintainer added as a collaborator on the code repo (currently private under the `kchecker` org: `kchecker/Salesji-TelegramBot`). Sharing a link is **not** access.
- [ ] **Deploy PAT** — the fine-grained GitHub Personal Access Token stored on the server for `git pull` deploys is reissued under the new owner and the old one is revoked (see §6).
- [ ] **Server (DigitalOcean)** — SSH access to the droplet confirmed by the new owner; **root password rotated** after they are in (the old password was shared over chat and must be considered compromised).
- [ ] **Supabase project** — new owner invited as an org/project member (not just handed the keys).
- [ ] **Telegram BotFather** — control of the bot + token confirmed; who owns the BotFather account?
- [ ] **Domain / DNS** — registrar + DNS control for the app domain transferred.
- [ ] **LLM & service accounts** — Gemini (Google AI Studio), Firecrawl, Gmail SMTP: ownership + billing confirmed.
- [ ] **Google Drive folder** — the Drive folder with keys/envs/docs is shared with the **team**, not a single personal account that may be deprovisioned.
- [ ] **Secrets rotated** — all API keys and passwords that were shared in chat/Drive are rotated once the new owner has access.
- [ ] **Walkthrough call done** — live screen-share covering deploy, logs, restart, and known issues.

> ⚠️ **Security note:** any credential that was pasted into a chat or shared Drive should be rotated as part of handover. Treat shared secrets as compromised.

---

## 1. What SalesJi Is

SalesJi is a full-stack **AI-powered Telegram sales assistant** with a Next.js admin dashboard. Businesses onboard, train, test, and assist their sales teams using their own company data via a Telegram bot, backed by a RAG (Retrieval-Augmented Generation) pipeline.

- **Multi-tenant:** every business (admin) has isolated data, enforced at the database level with Row Level Security (RLS).
- **Two apps in one repo (monorepo):** a Next.js dashboard (`frontend/`) and a Python Telegram bot (`backend/`).
- **Cloud database:** Supabase (PostgreSQL + pgvector).

---

## 2. Live Architecture (What Runs Where)

```
Internet (HTTPS)
       │
       ▼
   Nginx (port 443, SSL via Let's Encrypt)
       │
       ├── /           → Next.js Dashboard  (localhost:3000)
       └── /webhook    → Python Telegram Bot (localhost:8443)

   Supabase Cloud (PostgreSQL + pgvector)   ← used by BOTH apps
   Gemini API (LLM + embeddings)            ← used by the bot
   Firecrawl API (web scraping)             ← used by the bot
```

| Component | Technology | Port | Process (PM2) |
|-----------|-----------|------|---------------|
| Reverse proxy + SSL | Nginx + Let's Encrypt | 80, 443 | (system service) |
| Frontend dashboard | Next.js 16, React 19, Tailwind | 3000 | `salesji-frontend` |
| Telegram bot | Python 3.12, python-telegram-bot | 8443 | `salesji-bot` |
| Database | Supabase (PostgreSQL + pgvector) | Cloud | — |
| LLM + embeddings | Google Gemini | Cloud | — |
| Web scraping | Firecrawl | Cloud | — |

**Hosting:** DigitalOcean droplet. The bot runs as a **webhook** (not polling): Telegram POSTs updates to `https://<domain>/webhook`, Nginx proxies that to `localhost:8443`.

---

## 3. Repository Layout

```
/
├── HANDOVER.md          ← this document (start here)
├── README.md            ← short repo overview
├── project.md           ← deep analysis: funnel, pain points, security, scaling
├── DEPLOYMENT.md        ← full deploy / ops / troubleshooting guide (READ THIS for server work)
├── docs/
│   └── SECURITY_FIX_REPORT.md   ← record of the RLS/security hardening (PR #16)
├── backend/             ← Python Telegram bot
│   ├── main.py          ← entry point: webhook config + handler registration
│   ├── handlers.py      ← all bot logic (onboarding, training, testing, crawl, RAG chat)
│   ├── database.py      ← Supabase CRUD + vector search
│   ├── config.py        ← env config (Gemini, Telegram, Supabase, Firecrawl)
│   ├── llm_client.py    ← unified LLM client
│   ├── embedder.py      ← embeddings
│   ├── data_condensation.py ← RAG pipeline: chunk → extract → cluster → knowledge cards
│   ├── context_ranker.py     ← "sandwich" reranking
│   ├── constraint_extractor.py ← extracts budget/timeline/must-haves from user text
│   ├── sliding_window.py ← conversation-memory compression
│   ├── scraper.py       ← Firecrawl + sitemap + single-page scraping
│   ├── schema.sql       ← full DB schema (17 tables, RLS, match_embeddings fn)
│   ├── migrations/      ← incremental SQL migrations
│   └── requirements.txt ← Python deps  (⚠️ ignore the stray `reuirements.txt` typo file)
└── frontend/            ← Next.js admin dashboard
    └── app/
        ├── (auth)/      ← login, register, forgot/update password, verify
        ├── (dashboard)/ ← protected admin pages (dashboard, knowledge, training,
        │                  conversations, analytics, settings, billing, users, invites, ...)
        ├── actions/     ← server actions (auth, bot settings)
        └── lib/         ← Supabase client, schema map, DB helpers
```

> **Note on `project.md`:** it's an excellent deep-dive but was written earlier. Some things have since changed in the code — see §8 "Current vs. documented" so you don't get surprised.

---

## 4. First-Time Setup (From Scratch)

> The authoritative, step-by-step server build is in **`DEPLOYMENT.md`** (§"Fresh Server Setup"). This is the condensed version.

### Backend (Python bot)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install 'markitdown[pdf]'
cp .env.example .env        # then fill in real values (see §5)
python main.py
```

### Frontend (Next.js dashboard)
```bash
cd frontend
npm install
npm run build     # production
npm run dev       # local development
```

### Database (Supabase)
1. Create a Supabase project.
2. In the SQL Editor, run the full contents of `backend/schema.sql` (creates all tables, RLS policies, indexes, and the `match_embeddings` vector-search function).
3. `pgvector` is enabled automatically by the schema (`CREATE EXTENSION IF NOT EXISTS vector`).
4. Grab the keys from **Settings → API**: the **anon** key for the frontend, the **service_role** key for the backend.

---

## 5. Environment Variables

> Real values live in the shared **Google Drive** folder for this project. Never commit secrets to the repo.

### Backend `.env`
```env
ENVIRONMENT=production

# Telegram
PROD_TELEGRAM_TOKEN=<from BotFather>
PROD_WEBHOOK_URL=https://<domain>/webhook
DEV_TELEGRAM_TOKEN=<optional>
DEV_WEBHOOK_URL=<optional>

# LLM — Gemini only (Groq has been removed from the codebase)
GEMINI_API_KEY=<Google AI Studio key>
GEMINI_MODEL=gemini-3.1-flash-lite        # optional override

# Web scraping
FIRECRAWL_API_KEY=<Firecrawl key>

# Supabase — backend uses the SERVICE ROLE key (bypasses RLS)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role JWT>

# Webhook security
WEBHOOK_SECRET_TOKEN=<random string>

# Email (optional — invite token delivery)
GMAIL_USER=...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
```

**CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` must be the JWT with `"role":"service_role"`. If the anon key is used by mistake, all backend DB queries return empty due to RLS. Verify with the one-liner in `DEPLOYMENT.md` → "Environment Variables".

### Frontend `.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
DATABASE_URL=<Supabase Postgres pooler URL, port 6543>   # use PgBouncer pooler
NEXT_PUBLIC_APP_URL=https://<domain>
smtp_name=<sender email>
smtp_password=<SMTP app password>
smtp_host=smtp.gmail.com
smtp_port=587
```

---

## 6. Day-to-Day Maintenance & Deployment

All processes run under **PM2** on the DigitalOcean droplet.

### Deploy a code update (most common task)
```bash
cd /root/salesji
git pull origin main        # authenticated via the deploy PAT (see note below)

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt      # only if deps changed
pm2 restart salesji-bot --update-env # --update-env is REQUIRED to pick up .env changes

# Frontend
cd ../frontend
npm install                          # only if package.json changed
npm run build
pm2 restart salesji-frontend
```

> **Deploy PAT:** the server pulls code using a **fine-grained GitHub Personal Access Token** (because the repo is private). During handover this must be **reissued under the new owner's GitHub account** and the old token revoked. Check how the remote is configured with `git -C /root/salesji remote -v`.

### Everyday PM2 commands
| Command | Purpose |
|---------|---------|
| `pm2 status` | See all processes + restart counts |
| `pm2 logs salesji-bot --lines 50` | Tail bot logs |
| `pm2 logs salesji-frontend --lines 50` | Tail frontend logs |
| `pm2 restart salesji-bot --update-env` | Restart bot (picks up env changes) |
| `pm2 restart salesji-frontend` | Restart dashboard |
| `pm2 flush` | Clear logs (frees disk) |
| `pm2 save` | Persist process list across reboots |

### SSL
- Certs auto-renew via `certbot.timer`. Manual renew: `certbot renew && systemctl restart nginx`.
- Nginx config: `/etc/nginx/sites-available/salesji`. After edits: `nginx -t && systemctl restart nginx`.

### Verify the bot's webhook
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

> Full troubleshooting playbook (bot not responding, 502s, disk full, rate limits, crash loops) is in **`DEPLOYMENT.md` → Troubleshooting**.

---

## 7. Reports & Analytics

The dashboard is the reporting surface; the data lives in Supabase. Key tables/pages for pulling reports:

| Report | Where | Source table(s) |
|--------|-------|-----------------|
| Team onboarding status | dashboard → Onboarding | `onboarding_leads` |
| Training completion / progress | dashboard → Training | `user_states`, training logs |
| Test scores per rep | dashboard → (training/test views) | `test_results` |
| Conversation / chat logs | dashboard → Conversations | `chat_analytics` |
| Usage analytics | dashboard → Analytics / API Usage | `chat_analytics`, metrics tables |
| Invites generated vs. claimed | dashboard → Invites | `invite_tokens` |
| User feedback | dashboard → Feedback | `user_feedback` |
| Pipeline / vector performance | (DB only) | `condensation_metrics`, `embedding_metrics`, `condensation_logs` |

Ad-hoc reporting can be done directly in the **Supabase SQL Editor** against these tables. All rows are scoped by `admin_id` (tenant).

---

## 8. Current State vs. `project.md` (Important Deltas)

The code has moved on since `project.md` was written. Don't be misled:

- **LLM is Gemini-only.** Groq has been fully removed (`config.py` says so explicitly). The "dual-provider auto-failover" described in older docs no longer applies; failover is now *between Gemini models* (`gemini-3.1-flash-lite` → `gemini-2.5-flash` → `gemini-2.5-flash-lite`).
- **Embeddings now use the Gemini Embeddings API** (Phase 2), replacing the earlier FastEmbed/ONNX approach mentioned in older docs.
- **Smart semantic chunking** for large documents was added (Phase 3).
- **PicklePersistence was removed** from `main.py` — this fixed a crash-loop bug (thousands of restarts from pickle corruption). Bot state is now rebuilt from Supabase, so there is no `bot_memory.pickle` to worry about anymore.
- **Thread pool raised to 15 workers** for more concurrent LLM calls.

If any older doc contradicts the code, **the code wins** — verify against `config.py` / `main.py`.

---

## 9. Known Issues & Tech Debt (Hand These Over Honestly)

From the codebase review in `project.md` (still worth a look for the full tables). The highest-signal items:

- **`/restart` command** triggers a full process restart via `os.execl` — risky on managed hosting; can cause restart loops. Consider removing or gating it.
- **No rate limiting** on the bot — a user can spam messages and burn LLM quota. Consider per-user token-bucket limiting.
- **`self` used inside a `@staticmethod`** in `constraint_extractor.py` — flagged as a crash on long texts; verify whether it's been fixed and, if not, fix it.
- **Prompt injection:** user text is inserted into LLM prompts without sanitization.
- **Scaling ceilings:** single-process bot, full knowledge base loaded per message, and (historically) no HNSW/IVFFlat index on vector columns. See `project.md` §8 for the scaling roadmap.
- **Billing/plan pages are demo-only** — no real payment integration.
- **Stray files** in `backend/` (`.cmds`, `.txt`, `1.txt`, `100.txt`, duplicate `reuirements.txt`) look like leftover junk — safe to review and clean up.

The **security hardening** (RLS on all tables, per-operation policies, hardened `match_embeddings`, revoked anon access) is documented in `docs/SECURITY_FIX_REPORT.md`.

---

## 10. Deeper Docs Index

| Doc | Read it when you need… |
|-----|------------------------|
| `DEPLOYMENT.md` | to build a server, deploy, manage PM2/Nginx/SSL, or troubleshoot |
| `project.md` | the full architecture, sales funnel, pain points, security & scaling analysis |
| `docs/SECURITY_FIX_REPORT.md` | to understand the database security model / RLS |
| `backend/readme.md` | backend-specific local dev (venv, ngrok tunneling) |
| `frontend/README.md` | frontend-specific local dev + env vars |
| `backend/schema.sql` | the full database schema |

---

_Prepared as part of the Bubbl + SalesJi project handover._
