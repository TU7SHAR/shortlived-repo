# SalesJi — Deployment, Setup & Operations Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Requirements](#server-requirements)
3. [Fresh Server Setup (From Scratch)](#fresh-server-setup-from-scratch)
4. [Environment Variables](#environment-variables)
5. [Database Setup (Supabase)](#database-setup-supabase)
6. [Backend Deployment (Python Bot)](#backend-deployment-python-bot)
7. [Frontend Deployment (Next.js)](#frontend-deployment-nextjs)
8. [Nginx & SSL Configuration](#nginx--ssl-configuration)
9. [PM2 Process Management](#pm2-process-management)
10. [Redeployment (Code Updates)](#redeployment-code-updates)
11. [Troubleshooting](#troubleshooting)
12. [File Locations Reference](#file-locations-reference)
13. [Key Architecture Decisions](#key-architecture-decisions)

---

## Architecture Overview

```
Internet (HTTPS)
       │
       ▼
   Nginx (port 443)
       │
       ├── /           → Next.js Dashboard (port 3000)
       └── /webhook    → Python Telegram Bot (port 8443)
       
   Supabase Cloud (PostgreSQL + pgvector)
       │
       └── Used by both frontend and backend
```

| Component | Technology | Port |
|-----------|-----------|------|
| Reverse Proxy + SSL | Nginx + Let's Encrypt | 80, 443 |
| Frontend Dashboard | Next.js 16, React 19, Tailwind | 3000 |
| Telegram Bot | Python 3.12, python-telegram-bot | 8443 |
| Database | Supabase (PostgreSQL + pgvector) | Cloud |
| LLM Providers | Gemini 2.0 Flash + Groq (Llama 4 Scout) | Cloud APIs |
| Embeddings | FastEmbed (local ONNX, all-MiniLM-L6-v2) | Local |
| Process Manager | PM2 | — |

---

## Server Requirements

**Minimum (demo/small team):**
- 1 vCPU, 512MB RAM, 10GB disk
- Ubuntu 22.04+ or 24.04
- Node.js 20.x, Python 3.12+
- Public IP with domain pointed

**Recommended (production):**
- 2 vCPU, 2GB RAM, 50GB disk
- Same software stack

---

## Fresh Server Setup (From Scratch)

### 1. System Updates & Dependencies

```bash
apt update && apt upgrade -y
apt install -y git curl python3 python3-venv python3-pip nginx certbot python3-certbot-nginx
```

### 2. Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3. Install PM2

```bash
npm install -g pm2
```

### 4. Clone Repository

```bash
cd /root
git clone https://github.com/TU7SHAR/TelegramBot.git salesji
```

### 5. Setup Backend

```bash
cd /root/salesji/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install 'markitdown[pdf]'
```

### 6. Setup Frontend

```bash
cd /root/salesji/frontend
npm install
npm run build
```

### 7. Configure Environment Files

See [Environment Variables](#environment-variables) section below.

### 8. Start Services

```bash
# Start backend bot
cd /root/salesji/backend
pm2 start "source venv/bin/activate && python main.py" --name salesji-bot

# Start frontend
cd /root/salesji/frontend
pm2 start "npm run start" --name salesji-frontend

# Save PM2 process list (survives reboot)
pm2 save
pm2 startup
```

### 9. Configure Nginx & SSL

See [Nginx & SSL Configuration](#nginx--ssl-configuration) section below.

---

## Environment Variables

### Backend (`/root/salesji/backend/.env`)

```env
# Environment toggle
ENVIRONMENT=production

# Telegram Bot Tokens
PROD_TELEGRAM_TOKEN=<telegram-bot-token-from-botfather>
PROD_WEBHOOK_URL=https://app.salesji.com/webhook

DEV_TELEGRAM_TOKEN=<dev-bot-token-optional>
DEV_WEBHOOK_URL=<dev-webhook-url-optional>

# LLM Provider Configuration
# Options: auto | gemini | groq
# "auto" tries Groq first, falls back to Gemini
# "gemini" tries Gemini first, falls back to Groq
LLM_PROVIDER=gemini

GEMINI_API_KEY=<google-ai-studio-api-key>
GROQ_API_KEY=<groq-console-api-key>

# Web Scraping
FIRECRAWL_API_KEY=<firecrawl-api-key>

# Supabase (Backend uses SERVICE ROLE key — bypasses RLS)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt-with-role-service_role>

# Webhook Security
WEBHOOK_SECRET_TOKEN=<any-random-string>

# Email (Optional — for invite token delivery)
GMAIL_USER=<gmail-address>
GMAIL_CLIENT_ID=<google-oauth-client-id>
GMAIL_CLIENT_SECRET=<google-oauth-client-secret>
GMAIL_REFRESH_TOKEN=<google-oauth-refresh-token>
```

**CRITICAL:** The `SUPABASE_SERVICE_ROLE_KEY` must contain a JWT with `"role":"service_role"` in the payload. If you accidentally use the anon key (`"role":"anon"`), all database queries will return empty due to RLS policies.

To verify your key:
```bash
python3 -c "import base64,json,os; from dotenv import load_dotenv; load_dotenv(); k=os.getenv('SUPABASE_SERVICE_ROLE_KEY'); p=k.split('.')[1]; p+='='*(-len(p)%4); print(json.loads(base64.urlsafe_b64decode(p))['role'])"
```
Should print: `service_role`

### Frontend (`/root/salesji/frontend/.env`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

The frontend uses the **anon (publishable)** key — safe for browser exposure. RLS policies protect data.

---

## Database Setup (Supabase)

### 1. Create a new Supabase project

Go to https://supabase.com → New Project → Select a region.

### 2. Run the schema

Open **SQL Editor** in Supabase Dashboard and run the entire contents of:
```
/root/salesji/backend/schema.sql
```

This creates all 17 tables, indexes, RLS policies, and the `match_embeddings` vector search function.

### 3. Enable pgvector

The schema includes `CREATE EXTENSION IF NOT EXISTS vector;` — this runs automatically.

### 4. Get your API keys

Go to **Settings → API** in Supabase Dashboard:
- **anon key** → Frontend `.env` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → Backend `.env` as `SUPABASE_SERVICE_ROLE_KEY`

For the service_role key: Go to **Legacy anon, service_role API keys** tab and copy the one with the red "secret" badge.

---

## Backend Deployment (Python Bot)

### How it works

- Runs as a **webhook-based** Telegram bot (not polling)
- Telegram sends all messages to `https://app.salesji.com/webhook`
- Nginx proxies `/webhook` to `localhost:8443`
- The bot registers its webhook URL with Telegram on startup

### Start/Restart

```bash
cd /root/salesji/backend
source venv/bin/activate
pm2 restart salesji-bot --update-env
```

### Verify it's working

```bash
pm2 logs salesji-bot --lines 20
```

You should see:
```
Initializing Document Assistant Bot...
Starting Webhook on port 8443. Listening for Telegram...
HTTP Request: POST .../setWebhook "HTTP/1.1 200 OK"
Application started
```

### Add a new Python dependency

```bash
cd /root/salesji/backend
source venv/bin/activate
pip install <package-name>
pip freeze > requirements.txt
pm2 restart salesji-bot
```

---

## Frontend Deployment (Next.js)

### Build & Restart

```bash
cd /root/salesji/frontend
npm run build
pm2 restart salesji-frontend
```

### Verify

```bash
curl -I http://localhost:3000
# Should return HTTP 200
```

### Add a new npm dependency

```bash
cd /root/salesji/frontend
npm install <package-name>
npm run build
pm2 restart salesji-frontend
```

---

## Nginx & SSL Configuration

### Config file location

```
/etc/nginx/sites-available/salesji
```

### Current configuration (after Certbot modification)

To view:
```bash
cat /etc/nginx/sites-available/salesji
```

Base config (before SSL was added by Certbot):
```nginx
server {
    listen 80;
    server_name app.salesji.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /webhook {
        proxy_pass http://127.0.0.1:8443/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Certbot auto-adds the SSL (port 443) listener and HTTP→HTTPS redirect.

### SSL Certificate

| Item | Path |
|------|------|
| Certificate | `/etc/letsencrypt/live/app.salesji.com/fullchain.pem` |
| Private Key | `/etc/letsencrypt/live/app.salesji.com/privkey.pem` |
| Auto-renewal | `certbot.timer` (systemd, runs twice daily) |

### Renew SSL manually (if needed)

```bash
certbot renew
systemctl restart nginx
```

### Test Nginx config after edits

```bash
nginx -t
systemctl restart nginx
```

---

## PM2 Process Management

### Common commands

| Command | Purpose |
|---------|---------|
| `pm2 status` | Show all processes |
| `pm2 logs` | Tail all logs live |
| `pm2 logs salesji-bot --lines 50` | Last 50 lines of bot logs |
| `pm2 restart salesji-bot --update-env` | Restart bot (picks up .env changes) |
| `pm2 restart salesji-frontend` | Restart Next.js |
| `pm2 flush` | Clear all log files (frees disk) |
| `pm2 save` | Persist process list across reboots |
| `pm2 startup` | Generate boot startup script |

### Process names

| Name | Service |
|------|---------|
| `salesji-bot` | Python Telegram bot |
| `salesji-frontend` | Next.js dashboard |

---

## Redeployment (Code Updates)

### Quick deploy (most common)

```bash
# Pull latest code
cd /root/salesji
git pull origin main

# Restart backend
cd backend
source venv/bin/activate
pip install -r requirements.txt  # Only if dependencies changed
pm2 restart salesji-bot --update-env

# Rebuild & restart frontend
cd ../frontend
npm install  # Only if package.json changed
npm run build
pm2 restart salesji-frontend
```

### After changing .env

```bash
pm2 restart salesji-bot --update-env
# --update-env is CRITICAL — PM2 caches env vars without it
```

### After changing Nginx config

```bash
nginx -t
systemctl restart nginx
```

### After changing database schema

1. Run new SQL in Supabase Dashboard → SQL Editor
2. Update `schema.sql` in the repo for documentation
3. No server restart needed (Supabase is cloud)

---

## Troubleshooting

### Bot not responding to messages

```bash
# 1. Check if bot is running
pm2 status

# 2. Check logs for errors
pm2 logs salesji-bot --lines 50

# 3. Verify webhook is set correctly
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# 4. Common fixes:
pm2 restart salesji-bot --update-env
```

### "Token not found in database"

**Cause:** Using the anon key instead of service_role key in backend .env.

**Fix:** Replace `SUPABASE_SERVICE_ROLE_KEY` with the actual service_role key (the JWT with `"role":"service_role"` in payload). Then `pm2 restart salesji-bot --update-env`.

### Dashboard not loading

```bash
# Check if Next.js is running
pm2 logs salesji-frontend --lines 20

# Rebuild if needed
cd /root/salesji/frontend
npm run build
pm2 restart salesji-frontend
```

### "Server Action not found" errors in frontend logs

**Cause:** Browser cached old deployment. Clear browser cache or hard-refresh. If persistent:
```bash
cd /root/salesji/frontend
npm run build
pm2 restart salesji-frontend
```

### Disk space full

```bash
# Check usage
df -h /

# Emergency cleanup
pm2 flush                        # Clear PM2 logs
pip cache purge                  # Clear pip download cache
apt-get clean                    # Clear apt cache
journalctl --vacuum-size=10M     # Trim system logs
rm -f ~/salesji/backend/bot_memory.pickle  # Remove old pickle (if exists)

# Find biggest offenders
du -sh /root/salesji/backend/venv ~/.cache ~/.pm2/logs /var/log /tmp 2>/dev/null | sort -rh
```

### LLM API rate limit errors

**Symptoms:** Slow responses, timeout errors, or "429 Too Many Requests" in logs.

**Fix:** Switch primary provider in `.env`:
```
LLM_PROVIDER=gemini   # or groq
```
Then: `pm2 restart salesji-bot --update-env`

### Bot crash-looping (high restart count)

```bash
# Check what's crashing it
pm2 logs salesji-bot --err --lines 50

# Common cause: corrupted pickle persistence (removed in latest version)
rm -f ~/salesji/backend/bot_memory.pickle
pm2 restart salesji-bot --update-env
```

### SSL certificate expired

```bash
certbot renew
systemctl restart nginx
```

### Nginx 502 Bad Gateway

**Cause:** The upstream service (Next.js or bot) isn't running.

```bash
pm2 status
# Restart whichever is down:
pm2 restart salesji-bot --update-env
pm2 restart salesji-frontend
```

---

## File Locations Reference

| What | Path |
|------|------|
| Backend code | `/root/salesji/backend/` |
| Backend .env | `/root/salesji/backend/.env` |
| Backend venv | `/root/salesji/backend/venv/` |
| Frontend code | `/root/salesji/frontend/` |
| Frontend .env | `/root/salesji/frontend/.env` |
| Frontend build | `/root/salesji/frontend/.next/` |
| Nginx config | `/etc/nginx/sites-available/salesji` |
| SSL cert | `/etc/letsencrypt/live/app.salesji.com/fullchain.pem` |
| SSL key | `/etc/letsencrypt/live/app.salesji.com/privkey.pem` |
| PM2 logs | `~/.pm2/logs/` |
| PM2 process list | `~/.pm2/dump.pm2` |
| Database schema | `/root/salesji/backend/schema.sql` |

---

## Key Architecture Decisions

| Decision | Reasoning |
|----------|-----------|
| **Custom RAG pipeline** (not Gemini File Search) | Multi-tenant data isolation, category-aware retrieval, constraint injection, and full control over ranking — not possible with Gemini's black-box file search |
| **Dual LLM with auto-failover** | Zero downtime if one provider has outages or hits rate limits |
| **FastEmbed (ONNX)** instead of sentence-transformers | Saves ~1.3GB RAM (no PyTorch needed). Runs on $4 servers. Same 384-dim vectors |
| **Supabase (cloud PostgreSQL)** | Managed DB with built-in auth, RLS, pgvector, real-time — no local DB maintenance |
| **PM2** for process management | Auto-restart on crash, log management, startup scripts |
| **Nginx reverse proxy** | SSL termination, domain routing, future load balancing capability |
| **In-memory TTL cache** | Reduces DB calls by 60-80% per message with zero infrastructure (no Redis needed) |
| **Webhook** (not polling) | More efficient, lower latency, required for production Telegram bots |

---

## Capacity & Scaling

**Current server ($4-6 droplet, 1 vCPU, 512MB RAM):**
- Frontend: ~200-300 concurrent visitors
- Bot: 5-8 users chatting simultaneously
- ~3,000 messages/month

**Scaling path (no code changes needed):**

| Upgrade | Result |
|---------|--------|
| $12 droplet (2 vCPU, 2GB RAM) | 12-15 concurrent bot users |
| Paid LLM API | Remove rate limit ceiling |
| Supabase Pro ($25/mo) | Unlimited API calls, 8GB DB |

---

*Last updated: July 2, 2026*
*Maintained by: Tushar Gautam*
