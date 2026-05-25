# Demand Radar — CLAUDE.md

Demand Radar is a SaaS platform that detects buying-intent signals from public sources (RSS, classifieds, forums) and surfaces them via a dashboard and alerts. The system collects raw content, enriches it with AI (intent classification, scoring, entity extraction), and notifies users by email or Telegram.

Target market: small businesses, car dealers, and resellers in Latin America (Honduras first).

---

## Monorepo Layout

```
apps/
  web/          Next.js frontend (dashboard, saved searches, alerts config)
  api/          NestJS backend (auth, REST API, queue dispatch, scheduler)
  ai-worker/    FastAPI Python service (AI enrichment, intent classification)

workers/
  collector/    BullMQ worker — fetches sources, writes collected_items
  enrich/       BullMQ worker — calls ai-worker, writes extracted_signals
  notifier/     BullMQ worker — sends email / Telegram notifications

packages/
  db/           Prisma client + Supabase client, exports @radar/db
  queue/        BullMQ helpers + QUEUES enum, exports @radar/queue
  logger/       Pino logger, exports @radar/logger
  shared-types/ Shared TypeScript types, exports @radar/shared-types

infrastructure/
  docker/       docker-compose.yml (postgres, redis, all services)
  supabase/     SQL migrations

docs/           Product context, architecture brief, DB schema notes
```

---

## Tech Stack (decisions are fixed — don't change without strong reason)

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js + TypeScript + TailwindCSS |
| API | NestJS (TypeScript) |
| AI / NLP | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma (`packages/db/prisma/schema.prisma`) |
| Queue | Redis + BullMQ |
| Auth | Supabase Auth (JWT) |
| Alerts | Resend (email) + Telegram Bot API |

---

## Data Flow

```
Source (RSS / API / scraper)
  → collector worker   [QUEUES.COLLECT]  fetches raw content → collected_items
  → enrich worker      [QUEUES.ENRICH]   calls ai-worker → extracted_signals
  → notifier worker    [QUEUES.NOTIFY]   sends email / Telegram → alert_runs
```

Queue names are the single source of truth in `packages/queue/src/index.ts`:

```ts
export const QUEUES = {
  COLLECT: "collect",
  ENRICH:  "enrich",
  NOTIFY:  "notify",
} as const;
```

Workers are standalone Node.js processes — they do **not** use NestJS. They import from `@radar/queue`, `@radar/db`, and `@radar/logger`.

---

## Package Responsibilities

### `@radar/db`
- Exports the Prisma client and all generated types
- Exports `createClient()` for the Supabase JS client
- Usage: `import { PrismaClient } from "@radar/db"`

### `@radar/queue`
- Exports `createQueue(name)`, `createWorker(name, processor)`, `QUEUES`, `connection`
- Usage: `import { createWorker, QUEUES } from "@radar/queue"`

### `@radar/logger`
- Exports a pre-configured Pino logger instance
- Usage: `import { logger } from "@radar/logger"`

### `@radar/shared-types`
- Shared TypeScript types and interfaces across apps and workers

---

## NestJS Module Conventions (`apps/api`)

Every domain is a module under `apps/api/src/modules/<name>/`.

Structure for a new module:

```
modules/
  <name>/
    dto/
      create-<name>.dto.ts
      update-<name>.dto.ts
    <name>.module.ts
    <name>.service.ts
    <name>.controller.ts
```

Rules:
- Controller uses `@ApiTags("name")` and `@ApiBearerAuth()` — all routes are authenticated by default
- Extract the current user with `@CurrentUser() user: AuthUser`
- Inject `PrismaService` for DB access; inject `OrgContextService` to resolve the user's org
- Always scope queries to `organizationId` via `OrgContextService.getPrimaryOrgId(userId)`
- Register the module in `apps/api/src/app.module.ts`

Example service pattern:

```ts
@Injectable()
export class ThingsService {
  constructor(
    private prisma: PrismaService,
    private orgCtx: OrgContextService,
  ) {}

  async findAll(userId: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.thing.findMany({ where: { organizationId: orgId } });
  }
}
```

To inject a queue in a module:

```ts
// module
imports: [BullModule.registerQueue({ name: QUEUES.COLLECT })]

// service
@InjectQueue(QUEUES.COLLECT) private collectQueue: Queue
```

---

## Auth Pattern

- Auth is global via `SupabaseAuthGuard` (validates Supabase JWT on every request)
- To make a route public, use the `@Public()` decorator
- The guard attaches `req.user = { id, email }` — use `@CurrentUser()` to read it
- Never query DB directly with `userId` alone — always resolve to `organizationId` first

---

## Worker Conventions (`workers/*`)

Workers are minimal standalone processes:

```ts
import { createWorker, createQueue, QUEUES } from "@radar/queue";
import { PrismaClient } from "@radar/db";
import { logger } from "@radar/logger";

const prisma = new PrismaClient();

createWorker<{ jobPayload: string }>(QUEUES.COLLECT, async (job) => {
  // process job
});

logger.info("worker started");
```

- Define the job payload as a TypeScript interface
- Always log job start and completion with `logger.info`
- Use `attempts: 3` + exponential backoff when enqueuing
- Deduplication is done via `externalId` in `collected_items`

---

## Database / Prisma

Schema: `packages/db/prisma/schema.prisma`

### Key models

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | Synced from Supabase Auth |
| `Organization` | `organizations` | Multi-tenant unit |
| `Source` | `sources` | Configured data source (RSS, etc.) |
| `CollectedItem` | `collected_items` | Raw fetched content |
| `ExtractedSignal` | `extracted_signals` | AI-enriched intent signal |
| `SavedSearch` | `saved_searches` | Keyword filters per org |
| `Alert` | `alerts` | Notification rules linked to saved searches |
| `AlertRun` | `alert_runs` | Delivery log per signal/alert pair |

### Prisma workflow

```bash
# After changing schema.prisma:
pnpm --filter @radar/db exec prisma migrate dev --name <description>
pnpm --filter @radar/db exec prisma generate

# Apply migrations in production:
pnpm --filter @radar/db exec prisma migrate deploy
```

### Domain enums (stored as strings in DB)

```
Source.type:         rss | api | scraper | webhook
Source.vertical:     autos | real_estate | smartphones | laptops
ExtractedSignal.intent:   buy | sell | rent | unknown
ExtractedSignal.category: autos | real_estate | smartphones | laptops
Alert.channel:       email | telegram | webhook
AlertRun.status:     pending | sent | failed
```

---

## AI Worker (`apps/ai-worker`)

- FastAPI Python service called **only** by `workers/enrich`
- `POST /signals/enrich` → returns `{ category, intent, score, location, price, metadata }`
- Uses OpenAI chat completions with `response_format: { type: "json_object" }`
- Score: `≥0.8` = clear intent, `0.4–0.79` = probable, `<0.4` = irrelevant
- Config in `apps/ai-worker/app/config.py` (reads env vars)

---

## Environment Variables

Copy `.env.example` to `.env`. Required vars:

```
DATABASE_URL           Postgres connection string (Supabase direct)
REDIS_URL              Redis connection (default: redis://localhost:6379)
SUPABASE_URL           Supabase project URL
SUPABASE_ANON_KEY      Public Supabase key (frontend + API auth)
SUPABASE_SERVICE_ROLE_KEY  Backend-only Supabase key
AI_WORKER_URL          FastAPI service URL (default: http://localhost:8000)
OPENAI_API_KEY         OpenAI key for enrichment
RESEND_API_KEY         Resend key for email alerts
EMAIL_FROM             Sender address for email alerts
TELEGRAM_BOT_TOKEN     Telegram bot token
```

---

## Commands

```bash
# Install all dependencies
pnpm install

# Run everything in dev mode (Turborepo)
pnpm dev

# Build all packages and apps
pnpm build

# Type-check all workspaces
pnpm type-check

# Run a single workspace in dev
pnpm --filter @radar/collector-worker dev
pnpm --filter @radar/api dev
pnpm --filter web dev

# Prisma
pnpm --filter @radar/db exec prisma migrate dev --name <name>
pnpm --filter @radar/db exec prisma generate
pnpm --filter @radar/db exec prisma studio

# Python ai-worker (from apps/ai-worker)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## Development Philosophy

- **Prefer simple over scalable** — if there are two ways to do it, pick the faster one unless complexity is clearly justified
- **No overengineering** — no unnecessary abstractions, no premature event-driven patterns, no Kubernetes
- **Solo-developer optimized** — minimize boilerplate, maximize velocity
- **Queue-based async** — collectors, enrichment, and notifications are always async via BullMQ
- **Multi-tenant by default** — every query must be scoped to `organizationId`

### Out of scope for MVP

Do not build: CRM features, automatic outbound messaging, billing automation, mobile apps, multi-user roles, WhatsApp integration.

---

## Future Product: Tender Monitor

A public procurement monitor for Honduras (ONCAE) built on the same platform. The collector, enrichment, alert, and queue layers should remain reusable for this. When adding new features, consider whether they belong in a shared layer or are Demand Radar–specific.
