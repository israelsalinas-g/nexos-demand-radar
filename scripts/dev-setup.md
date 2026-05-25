# Dev Setup

## Requisitos
- Node 20+
- pnpm 9+
- Python 3.12+
- Docker Desktop

## Primera vez

```bash
# 1. Clonar y entrar al repo
cd nexos-demand-radar

# 2. Copiar variables de entorno y llenar valores reales
cp .env.example .env

# 3. Instalar dependencias JS
pnpm install

# 4. Generar Prisma client
pnpm db:generate

# 5. Levantar Postgres + Redis localmente
docker compose -f infrastructure/docker/docker-compose.yml up postgres redis -d

# 6. Ejecutar migración SQL en Supabase (o en Postgres local)
# Opción A — Supabase dashboard: pegar infrastructure/supabase/migrations/001_initial_schema.sql
# Opción B — Prisma (para dev local):
pnpm --filter @radar/db db:push

# 7. Crear venv para AI worker
cd apps/ai-worker
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

## Levantar todo en desarrollo

```bash
# Terminal 1 — API + Web (Turborepo)
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

## URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Dashboard | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/docs |
| AI Worker | http://localhost:8000/docs |

## Flujo de prueba manual

1. Registrarse con magic link en http://localhost:3000/auth/login
2. Crear organización (via Supabase dashboard o SQL directo)
3. Ir a Fuentes → crear una fuente RSS
4. Clic en "Collect ahora"
5. Esperar ~5s → ir al Dashboard → ver señales aparecer
6. Crear búsqueda guardada + alerta para recibir notificaciones
