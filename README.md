# Demand Radar

Demand Radar is a SaaS platform that detects buying-intent signals from public sources. It collects content from RSS feeds, classifieds, and forums; enriches it with AI to extract purchase intent; and surfaces relevant signals through a dashboard and real-time alerts via email or Telegram.

**Target market:** small businesses, car dealers, and resellers in Latin America.

---

## Features

- **Signal detection** — identifies posts where people are actively looking to buy or sell products
- **AI enrichment** — classifies category, intent, urgency score (0–1), location, price, and product metadata from raw text
- **Multi-source collection** — supports RSS feeds today; architecture is built to add scrapers, APIs, and webhooks
- **Saved searches** — define keyword filters to track specific products or categories
- **Alerts** — get notified by email or Telegram when a matching signal is detected
- **Multi-tenant** — all data is isolated per organization
- **Vertical focus** — used cars (MVP), with real estate, smartphones, and laptops planned

---

## Architecture

```
Source (RSS / API / scraper)
  → Collector Worker   — fetches raw content → collected_items
  → Enrich Worker      — calls AI service   → extracted_signals
  → Notifier Worker    — sends email / Telegram
```

All workers communicate asynchronously via **BullMQ queues on Redis**.

### Services

| Service | Technology | Port | Purpose |
|---|---|---|---|
| `apps/web` | Next.js + TailwindCSS | 3000 | Customer dashboard |
| `apps/api` | NestJS | 3001 | REST API, auth, queue dispatch |
| `apps/ai-worker` | FastAPI (Python) | 8000 | Intent classification, AI enrichment |
| `workers/collector` | Node.js + BullMQ | — | Fetches sources |
| `workers/enrich` | Node.js + BullMQ | — | Processes items via AI |
| `workers/notifier` | Node.js + BullMQ | — | Sends notifications |

### Shared packages

| Package | Purpose |
|---|---|
| `@radar/db` | Prisma client + Supabase client |
| `@radar/queue` | BullMQ helpers + queue name constants |
| `@radar/logger` | Pino logger |
| `@radar/shared-types` | Shared TypeScript types |

---

## Tech Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js, TypeScript, TailwindCSS
- **API:** NestJS, TypeScript
- **AI service:** FastAPI, Python 3.12, OpenAI
- **Database:** PostgreSQL (Supabase), Prisma ORM
- **Queue / Cache:** Redis, BullMQ
- **Auth:** Supabase Auth (JWT)
- **Notifications:** Resend (email), Telegram Bot API

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| Python | 3.12+ |
| Docker Desktop | latest |

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd nexos-demand-radar
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in real values. Required:

```
DATABASE_URL              # Postgres connection string
SUPABASE_URL              # Supabase project URL
SUPABASE_ANON_KEY         # Public Supabase key
SUPABASE_SERVICE_ROLE_KEY # Backend-only Supabase key
OPENAI_API_KEY            # For AI enrichment
REDIS_URL                 # redis://localhost:6379 for local dev
```

Optional (for alerts):

```
RESEND_API_KEY            # Email notifications
EMAIL_FROM                # Sender address
TELEGRAM_BOT_TOKEN        # Telegram bot token
TELEGRAM_CHAT_ID          # Default chat ID
```

### 3. Start infrastructure

```bash
docker compose -f infrastructure/docker/docker-compose.yml up postgres redis -d
```

### 4. Set up the database

**Option A — Supabase (recommended for production):**
Run `infrastructure/supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.

**Option B — Local Postgres:**
```bash
pnpm --filter @radar/db db:push
```

### 5. Generate Prisma client

```bash
pnpm db:generate
```

### 6. Set up the Python AI worker

```bash
cd apps/ai-worker
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
cd ../..
```

---

## Running in Development

Open five terminals:

```bash
# Terminal 1 — API + Web (Turborepo watches all JS apps)
pnpm dev

# Terminal 2 — Collector worker
pnpm --filter @radar/collector-worker dev

# Terminal 3 — Enrich worker
pnpm --filter @radar/enrich-worker dev

# Terminal 4 — Notifier worker
pnpm --filter @radar/notifier-worker dev

# Terminal 5 — AI worker
cd apps/ai-worker
uvicorn app.main:app --reload --port 8000
```

### Local URLs

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/docs |
| AI Worker Docs | http://localhost:8000/docs |
| AI Worker Health | http://localhost:8000/health |

---

## Running with Docker

Build and run all services with a single command:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

This starts: Postgres, Redis, API, AI Worker, Collector Worker, Enrich Worker, and Notifier Worker.

> The Next.js frontend is not included in Docker Compose — run it separately with `pnpm --filter web dev` or deploy to Vercel.

---

## Manual Test Flow

1. Go to http://localhost:3000/auth/login and sign in
2. Create an organization via the Supabase dashboard or a direct SQL insert
3. Navigate to **Sources** → create an RSS source with a valid feed URL
4. Click **Collect now** on the source
5. Wait ~5 seconds → navigate to the **Dashboard** → signals appear
6. Create a **Saved Search** with keywords to filter relevant signals
7. Create an **Alert** linked to the saved search to receive notifications

---

## Project Structure

```
nexos-demand-radar/
├── apps/
│   ├── web/                  Next.js frontend
│   ├── api/                  NestJS REST API
│   │   └── src/
│   │       ├── modules/      Feature modules (sources, signals, alerts, ...)
│   │       ├── auth/         Supabase JWT guard, decorators
│   │       ├── common/       OrgContextService (multi-tenancy)
│   │       └── db/           Prisma module
│   └── ai-worker/            FastAPI enrichment service
│       └── app/
│           ├── main.py
│           ├── enricher.py   OpenAI intent extraction
│           └── routers/
├── workers/
│   ├── collector/            Fetches sources, enqueues to ENRICH
│   ├── enrich/               Calls ai-worker, creates signals, enqueues to NOTIFY
│   └── notifier/             Sends email / Telegram notifications
├── packages/
│   ├── db/                   Prisma schema + client
│   ├── queue/                BullMQ helpers, queue name constants
│   ├── logger/               Pino logger
│   └── shared-types/         Shared TypeScript types
├── infrastructure/
│   ├── docker/               docker-compose.yml
│   └── supabase/             SQL migrations
├── docs/                     Architecture and requirements docs
├── .env.example
├── turbo.json
└── pnpm-workspace.yaml
```

---

## API Modules

| Module | Base path | Description |
|---|---|---|
| Sources | `POST/GET/PATCH/DELETE /sources` | Manage data sources |
| Sources | `POST /sources/:id/collect` | Trigger manual collection |
| Signals | `GET /signals` | Query enriched signals |
| Saved Searches | `POST/GET/PATCH/DELETE /saved-searches` | Manage keyword filters |
| Alerts | `POST/GET/PATCH/DELETE /alerts` | Manage notification rules |

All endpoints require a Supabase JWT in the `Authorization: Bearer <token>` header.

---

## Data Model (key tables)

```
users ─── organization_members ─── organizations
                                         │
                                    ┌────┴─────┐
                                 sources    saved_searches
                                    │              │
                              collected_items    alerts
                                    │              │
                              extracted_signals ──┘
                                    │
                                alert_runs
```

---

## Useful Commands

```bash
# Install all dependencies
pnpm install

# Build all packages and apps
pnpm build

# Type-check all workspaces
pnpm type-check

# Lint all workspaces
pnpm lint

# Run all tests
pnpm test

# Prisma: create a migration
pnpm --filter @radar/db exec prisma migrate dev --name <description>

# Prisma: regenerate client after schema change
pnpm db:generate

# Prisma: open Prisma Studio
pnpm --filter @radar/db exec prisma studio

# Run a single workspace in dev
pnpm --filter <package-name> dev
```

---

## Future Roadmap

- Additional source types: scrapers, webhooks, customer CSV uploads
- Semantic search with pgvector embeddings
- New alert channel: WhatsApp
- New verticals: real estate, smartphones, laptops
- **Tender Monitor** — a public procurement monitor for Honduras (ONCAE) built on the same platform infrastructure
