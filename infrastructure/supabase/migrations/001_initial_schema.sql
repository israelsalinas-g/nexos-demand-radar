-- ============================================================
-- Demand Radar – Initial Schema for Supabase
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- USERS
-- Mirrors auth.users. Row created automatically via trigger.
-- ============================================================
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORGANIZATIONS
-- Multi-tenant root entity.
-- ============================================================
CREATE TABLE public.organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  plan       TEXT NOT NULL DEFAULT 'free', -- free | pro | enterprise
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORGANIZATION_MEMBERS
-- Which users belong to which org and with what role.
-- ============================================================
CREATE TABLE public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id)         ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- ============================================================
-- SOURCES
-- Represents a feed, API endpoint, or scraping target.
-- ============================================================
CREATE TABLE public.sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,           -- rss | api | scraper | webhook
  url             TEXT,
  config          JSONB NOT NULL DEFAULT '{}', -- headers, selectors, auth, etc.
  vertical        TEXT,                    -- autos | real_estate | smartphones | laptops
  status          TEXT NOT NULL DEFAULT 'active', -- active | paused | error
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COLLECTED_ITEMS
-- Raw content fetched from sources. Deduplication via
-- (source_id, external_id) unique constraint.
-- ============================================================
CREATE TABLE public.collected_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  external_id  TEXT,               -- ID from the source platform
  url          TEXT,
  title        TEXT,
  body         TEXT,
  raw_payload  JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Full-text search vector (Spanish tokenizer; swap to 'english' if needed)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('spanish',
      coalesce(title, '') || ' ' || coalesce(body, '')
    )
  ) STORED,

  UNIQUE (source_id, external_id)
);

-- ============================================================
-- EXTRACTED_SIGNALS
-- AI-enriched intent signals derived from collected items.
-- ============================================================
CREATE TABLE public.extracted_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES public.collected_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id)   ON DELETE CASCADE,
  category        TEXT,              -- autos | real_estate | smartphones | laptops
  intent          TEXT,              -- buy | sell | rent | unknown
  score           NUMERIC(4, 2),     -- 0.00–1.00 confidence
  location        TEXT,
  price           NUMERIC(14, 2),
  currency        TEXT DEFAULT 'HNL',
  embedding       vector(1536),      -- for semantic similarity search
  metadata        JSONB NOT NULL DEFAULT '{}', -- brand, model, year, condition, etc.
  extracted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SAVED_SEARCHES
-- User-defined keyword/filter combos used to match signals.
-- ============================================================
CREATE TABLE public.saved_searches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  keywords        TEXT[]  NOT NULL DEFAULT '{}',
  filters         JSONB   NOT NULL DEFAULT '{}', -- category, location, price_min/max, intent
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ALERTS
-- Notification rules tied to a saved search.
-- ============================================================
CREATE TABLE public.alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id)   ON DELETE CASCADE,
  saved_search_id  UUID REFERENCES public.saved_searches(id)           ON DELETE SET NULL,
  created_by       UUID REFERENCES public.users(id)                    ON DELETE SET NULL,
  name             TEXT NOT NULL,
  channel          TEXT NOT NULL,              -- email | telegram | webhook
  channel_config   JSONB NOT NULL DEFAULT '{}',-- {email} | {chat_id} | {url, secret}
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ALERT_RUNS
-- Audit log of every notification dispatched (or failed).
-- ============================================================
CREATE TABLE public.alert_runs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id   UUID NOT NULL REFERENCES public.alerts(id)           ON DELETE CASCADE,
  signal_id  UUID NOT NULL REFERENCES public.extracted_signals(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed
  sent_at    TIMESTAMPTZ,
  error      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Sources
CREATE INDEX idx_sources_org    ON public.sources(organization_id);
CREATE INDEX idx_sources_status ON public.sources(status);
CREATE INDEX idx_sources_vertical ON public.sources(vertical);

-- Collected items
CREATE INDEX idx_items_source    ON public.collected_items(source_id);
CREATE INDEX idx_items_published ON public.collected_items(published_at DESC);
CREATE INDEX idx_items_fts       ON public.collected_items USING GIN(search_vector);
CREATE INDEX idx_items_body_trgm ON public.collected_items USING GIN(body gin_trgm_ops);

-- Extracted signals
CREATE INDEX idx_signals_item      ON public.extracted_signals(item_id);
CREATE INDEX idx_signals_org       ON public.extracted_signals(organization_id);
CREATE INDEX idx_signals_category  ON public.extracted_signals(category);
CREATE INDEX idx_signals_intent    ON public.extracted_signals(intent);
CREATE INDEX idx_signals_score     ON public.extracted_signals(score DESC);
CREATE INDEX idx_signals_embedding ON public.extracted_signals
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Saved searches
CREATE INDEX idx_saved_searches_org ON public.saved_searches(organization_id);

-- Alerts
CREATE INDEX idx_alerts_org    ON public.alerts(organization_id);
CREATE INDEX idx_alerts_search ON public.alerts(saved_search_id);

-- Alert runs
CREATE INDEX idx_alert_runs_alert  ON public.alert_runs(alert_id);
CREATE INDEX idx_alert_runs_status ON public.alert_runs(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every tenant only sees its own data.
-- ============================================================

ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collected_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_signals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_runs           ENABLE ROW LEVEL SECURITY;

-- Helper: returns the org IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.my_org_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id
  FROM   public.organization_members
  WHERE  user_id = auth.uid();
$$;

-- Users: read own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Organizations: members can read
CREATE POLICY "orgs_select_member" ON public.organizations
  FOR SELECT USING (id IN (SELECT public.my_org_ids()));

-- Organization members
CREATE POLICY "members_select" ON public.organization_members
  FOR SELECT USING (organization_id IN (SELECT public.my_org_ids()));

-- Sources: org members
CREATE POLICY "sources_select" ON public.sources
  FOR SELECT USING (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "sources_insert" ON public.sources
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "sources_update" ON public.sources
  FOR UPDATE USING (organization_id IN (SELECT public.my_org_ids()));

-- Collected items (read-only for users; written by service role)
CREATE POLICY "items_select" ON public.collected_items
  FOR SELECT USING (
    source_id IN (
      SELECT id FROM public.sources
      WHERE organization_id IN (SELECT public.my_org_ids())
    )
  );

-- Extracted signals
CREATE POLICY "signals_select" ON public.extracted_signals
  FOR SELECT USING (organization_id IN (SELECT public.my_org_ids()));

-- Saved searches
CREATE POLICY "saved_searches_select" ON public.saved_searches
  FOR SELECT USING (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "saved_searches_insert" ON public.saved_searches
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "saved_searches_update" ON public.saved_searches
  FOR UPDATE USING (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "saved_searches_delete" ON public.saved_searches
  FOR DELETE USING (organization_id IN (SELECT public.my_org_ids()));

-- Alerts
CREATE POLICY "alerts_select" ON public.alerts
  FOR SELECT USING (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "alerts_insert" ON public.alerts
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "alerts_update" ON public.alerts
  FOR UPDATE USING (organization_id IN (SELECT public.my_org_ids()));

-- Alert runs
CREATE POLICY "alert_runs_select" ON public.alert_runs
  FOR SELECT USING (
    alert_id IN (
      SELECT id FROM public.alerts
      WHERE organization_id IN (SELECT public.my_org_ids())
    )
  );

-- ============================================================
-- TRIGGER: auto-create user row on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
