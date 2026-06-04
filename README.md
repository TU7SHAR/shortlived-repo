# 🚀 SALESJI - Full Stack AI Telegram Assistant

This repository contains the complete source code for the **SALESJI** project, including the Next.js admin dashboard and the Python-powered Telegram bot engine.

## Repository Structure

This is a monorepo separated into two distinct environments:

### 1. [`/frontend`](./frontend/README.md)

The Next.js administrative dashboard. Handles multi-tenant token generation, live access revocation, and RAG knowledge base management.

- **Tech:** Next.js, Tailwind CSS, GSAP, Supabase Auth.

### 2. [`/backend`](./backend/README.md)

The Python AI engine. Intercepts Telegram messages, validates security in real-time, performs FAISS vector searches, and handles the automated onboarding flow.

- **Tech:** Python, Telegram Bot API, LangChain, Groq/Gemini, BeautifulSoup.

---

_Developed by Tushar Gautam | Drish Infotech_
