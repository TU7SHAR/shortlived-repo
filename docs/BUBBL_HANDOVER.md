# Bubbl — Project Handover (Start Here)

> **⚠️ Where this belongs:** the Bubbl source code lives in a **separate private repo** (`kchecker/bubblooo`), not in this SalesJi repo. This document was drafted here during the joint KT because that's where the handover tooling was available — **it should be copied into the Bubbl repo** (e.g. as `HANDOVER.md` at its root) and completed there against the actual Bubbl codebase.
>
> **Fields marked `⟨fill in⟩` need Bubbl-specific detail** that can only be confirmed by looking at the Bubbl code/server. Everything else is carried over from the handover chat and general handover best practice.

> **Purpose:** the single "start here" reference for whoever takes ownership of Bubbl.
>
> **Outgoing owner:** Tushar Gautam (Drish Infotech)
> **Handover date:** _fill in_
> **New owner / maintainer:** _fill in_

---

## 0. Handover Checklist (tick these off on the KT call)

Access is not "handed over" until the new owner can log in **without** the previous owner's help.

- [ ] **GitHub repo access** — new maintainer added as collaborator on `kchecker/bubblooo` (private repo; a link is not access).
- [ ] **Deploy PAT** — the fine-grained GitHub PAT used on the Bubbl server for `git pull` deploys is reissued under the new owner and the old one revoked.
- [ ] **Server access** — SSH to the Bubbl droplet confirmed by the new owner; **root password rotated** after they're in (the password was shared over chat → treat as compromised).
- [ ] **Database access** — ⟨fill in: Supabase / other DB⟩ ownership transferred, not just keys.
- [ ] **Domain / DNS** — ⟨fill in Bubbl domain(s)⟩ registrar + DNS control transferred.
- [ ] **Marketing site separation** — confirm the marketing site vs. the app are properly separated (see §2.1 — Karan explicitly flagged that these are currently mixed up in Bubbl).
- [ ] **Third-party / service accounts** — ⟨fill in: LLM keys, email/SMTP, payment, analytics, etc.⟩ ownership + billing confirmed.
- [ ] **Google Drive folder** — shared with the **team**, not a single personal account.
- [ ] **Secrets rotated** — all keys/passwords shared in chat or Drive rotated once new owner has access.
- [ ] **Walkthrough call done** — live screen-share covering deploy, logs, restart, and known issues.

> ⚠️ **Security note:** the Bubbl server password was shared in chat. Rotate it as part of handover.

---

## 1. Known Coordinates (from the handover chat)

| Item | Value |
|------|-------|
| **Server IP** | `168.144.123.62` |
| **SSH user** | `root` |
| **Server password** | _shared privately in chat — **rotate on handover**, do not store here_ |
| **Code repo** | `https://github.com/kchecker/bubblooo` (private) |
| **Docs / keys / envs** | Google Drive folder shared in chat (contains related documents, keys, and envs) |
| **Hosting provider** | ⟨fill in — DigitalOcean? confirm⟩ |
| **Deploy method** | `git pull` on server using a fine-grained GitHub PAT (same pattern as SalesJi) |

---

## 2. What Bubbl Is

⟨fill in: 2–4 sentences describing what Bubbl does, who its users are, and the core value it delivers.⟩

### 2.1 Marketing site vs. application (flagged issue)
Karan's guidance during the KT: **the marketing website should be a separate concern from the application** (as it is for the HouseKraft website), but in Bubbl these are currently **mixed together**. Document:

- ⟨fill in: how the marketing site and the app are currently structured / where each lives⟩
- ⟨fill in: what "mixed up" means in practice — shared repo? shared server? shared build?⟩
- ⟨fill in: recommended path to separate them, if that's the plan⟩

---

## 2b. Tech Stack

⟨fill in from the Bubbl repo⟩

| Layer | Technology |
|-------|-----------|
| Frontend | ⟨…⟩ |
| Backend | ⟨…⟩ |
| Database | ⟨…⟩ |
| Auth | ⟨…⟩ |
| Hosting | DigitalOcean droplet `168.144.123.62` (confirm) + ⟨reverse proxy? PM2? Docker?⟩ |
| Other services | ⟨LLM / email / payments / analytics⟩ |

---

## 3. Live Architecture (What Runs Where)

⟨fill in a diagram like the one below once confirmed against the server⟩

```
Internet (HTTPS)
       │
       ▼
   ⟨Reverse proxy? Nginx? — confirm⟩
       │
       ├── ⟨marketing site → ?⟩
       └── ⟨app → ?⟩

   ⟨Database⟩
   ⟨External APIs⟩
```

| Component | Technology | Port | Process |
|-----------|-----------|------|---------|
| ⟨…⟩ | ⟨…⟩ | ⟨…⟩ | ⟨…⟩ |

---

## 4. First-Time Setup (From Scratch)

⟨fill in — mirror the structure below⟩

```bash
# Clone
git clone https://github.com/kchecker/bubblooo.git

# Install deps
⟨…⟩

# Configure environment (see §5)
⟨…⟩

# Run
⟨…⟩
```

Database setup: ⟨fill in — schema file location, how to apply it⟩

---

## 5. Environment Variables

> Real values are in the shared **Google Drive** folder for Bubbl. Never commit secrets.

⟨fill in every env var the app reads, grouped by app/service⟩

```env
# Example structure
⟨SERVICE⟩_API_KEY=...
DATABASE_URL=...
NEXT_PUBLIC_APP_URL=...
```

---

## 6. Day-to-Day Maintenance & Deployment

⟨fill in — confirm process manager (PM2? systemd? Docker?) and the exact deploy steps⟩

### Deploy a code update
```bash
ssh root@168.144.123.62
cd ⟨app path on server⟩
git pull origin ⟨branch⟩        # uses the deploy PAT
⟨install deps if changed⟩
⟨build step if any⟩
⟨restart command⟩
```

> **Deploy PAT:** reissue under the new owner during handover; revoke the old one. Confirm remote with `git -C ⟨path⟩ remote -v`.

### Logs & restart
⟨fill in — how to view logs and restart each service⟩

### SSL / domain
⟨fill in — cert location, renewal, reverse-proxy config path⟩

---

## 7. Reports & Analytics

⟨fill in — what reporting exists, where it's viewed, and how to pull ad-hoc reports⟩

---

## 8. Known Issues & Tech Debt

- **Marketing site and app are mixed** (see §2.1) — Karan flagged this explicitly; document current state and separation plan.
- ⟨fill in other known bugs, fragile areas, manual steps, or things that break on redeploy⟩
- **Secrets shared in chat/Drive** must be rotated on handover.

---

## 9. Open Questions for the KT Call

Use these to make sure nothing is missed:

- [ ] Which domain(s) does Bubbl use, and who controls DNS?
- [ ] Is the database Supabase or something else? Who owns it?
- [ ] What external/paid services does Bubbl depend on (and who's billed)?
- [ ] How exactly are the marketing site and app separated vs. mixed today?
- [ ] What's the exact deploy + restart sequence on the server?
- [ ] Are there any cron jobs / scheduled tasks / background workers?
- [ ] Where are backups (DB + files), if any?

---

_Prepared as part of the Bubbl + SalesJi project handover. Copy this file into the `kchecker/bubblooo` repo and complete the `⟨fill in⟩` sections against the actual codebase._
