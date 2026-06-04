# Salesji Backend API

The backend service for the Salesji AI Telegram Assistant. This project leverages a Retrieval-Augmented Generation (RAG) architecture to provide intelligent, context-aware responses to users via Telegram, utilizing Supabase for state management and user authorization.

## Tech Stack

- **Core Framework:** Python 3.12+
- **Bot Interface:** `python-telegram-bot`
- **AI & Inference:** `groq`, `google-genai`, `langchain`, `langchain-groq`
- **Vector Search & Embeddings:** `faiss-cpu`, `sentence-transformers`
- **Database & Auth:** `supabase`
- **Data Extraction:** `firecrawl-py`, `beautifulsoup4`, `pypdf`, `python-docx`
- **Local Webhook Tunneling:** `ngrok`

## Environment Variables

To run the backend locally, create a `.env` file in the root directory and populate it with the following keys:

- `DEV_TELEGRAM_TOKEN` / `PROD_TELEGRAM_TOKEN` - API tokens from Telegram BotFather.
- `DEV_WEBHOOK_URL` / `PROD_WEBHOOK_URL` - The public HTTPS URL routing to your server (use Ngrok for local dev).
- `GROQ_API_KEY` - Primary LLM inference engine.
- `GEMINI_API_KEY` - Fallback/Secondary inference engine.
- `FIRECRAWL_API_KEY` - Required for live web scraping capabilities.
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key for bypassing RLS during server operations.

## Local Development Setup

Follow these instructions to set up the project locally. **Ensure you have Python 3.12+ installed.**

### 1. Initialize Virtual Environment

**Windows (PowerShell):**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt

ngrok config add-authtoken <YOUR_AUTH_TOKEN>
ngrok http 8443

python main.py

```
