# Salesji Admin Dashboard

A highly responsive, multi-tenant administrative dashboard built with Next.js to manage the Salesji AI Telegram Assistant. It provides real-time access control, knowledge base management, lead tracking, and visual analytics with a polished, mobile-responsive UI.

## Tech Stack

- **Core Framework:** Next.js 16 (App Router), React 19
- **Styling & UI:** Tailwind CSS v4, Lucide React
- **Animations:** GSAP & `@gsap/react`
- **Charts & Analytics:** Recharts
- **Database & Auth:** Supabase (PostgreSQL), `postgres`
- **ORM & Schema:** Drizzle ORM (`drizzle-kit`)
- **Utilities:** Nodemailer (SMTP dispatch)

## Key Features

- **Real-Time Token Management:** Generate, copy, and email unique Telegram access links. Includes a "Live Revoke" feature that instantly cuts off user access.
- **Knowledge Base Control:** Upload, filter, and manage context documents for the backend RAG engine.
- **User & Lead Management:** View onboarding leads, toggle user bans, and monitor API usage/chat analytics.
- **Mobile-First Responsive UI:** Features a slide-out GSAP-animated sidebar and dynamic topbar for seamless management on any device.
- **Multi-Tenant Isolation:** All data queries are strictly bound to the logged-in Supabase Auth UUID.

## Environment Variables

To run the frontend locally, create a `.env.local` file in the root directory and populate it with the following keys:

- Supabase URLs needs to be fetched/get from https://supabase.com/
- `DATABASE_URL` - Supabase Postgres connection string. **(Note: You must use the PgBouncer Pooler address on port 6543 to prevent serverless connection exhaustion in Next.js).**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public anon key.
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key for bypassing RLS during server actions.
- `NEXT_PUBLIC_APP_URL` - The application base URL (e.g., `http://localhost:3000`).
- `smtp_name` - Email address used for sending tokens.
- `smtp_password` - App password for the SMTP email.
- `smtp_host` - SMTP server host (e.g., `smtp.gmail.com`).
- `smtp_port` - SMTP server port (e.g., `587`).

## Local Development Setup

Follow these instructions to set up the dashboard locally. **Ensure you have Node.js 18+ installed.**

### 1. Install Dependencies

Navigate to the frontend directory and install the necessary npm packages:

```bash
npm install
npm run dev
```
