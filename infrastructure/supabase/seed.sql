-- =====================================================================
-- Demand Radar — Seed para Supabase SQL Editor
-- Pegar completo en: Supabase → SQL Editor → Run
--
-- Usuarios creados:
--   admin@nexos.com   / Amin1234!  → owner
--   ops@nexos.com     / Amin1234!  → admin
--   ventas@nexos.com  / Amin1234!  → member
--
-- Idempotente: usar ON CONFLICT DO NOTHING, seguro de ejecutar varias veces.
-- =====================================================================

-- pgcrypto es necesario para hashear contraseñas (está activo por defecto en Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- UUIDs fijos para que el seed sea idempotente
  v_admin_id   UUID := '10000000-0000-0000-0000-000000000001';
  v_ops_id     UUID := '10000000-0000-0000-0000-000000000002';
  v_ventas_id  UUID := '10000000-0000-0000-0000-000000000003';
  v_org_id     UUID := '20000000-0000-0000-0000-000000000001';
  v_password   TEXT := 'Amin1234!';
BEGIN

  -- ==================================================================
  -- 1. AUTH USERS  (auth.users — esquema interno de Supabase)
  -- ==================================================================
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  )
  VALUES
    (
      v_admin_id, 'authenticated', 'authenticated',
      'admin@nexos.com',
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Admin Nexos"}'::jsonb,
      FALSE, NOW(), NOW()
    ),
    (
      v_ops_id, 'authenticated', 'authenticated',
      'ops@nexos.com',
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Ops Nexos"}'::jsonb,
      FALSE, NOW(), NOW()
    ),
    (
      v_ventas_id, 'authenticated', 'authenticated',
      'ventas@nexos.com',
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Ventas Nexos"}'::jsonb,
      FALSE, NOW(), NOW()
    )
  ON CONFLICT (id) DO NOTHING;

  -- ==================================================================
  -- 2. AUTH IDENTITIES  (necesario para que el login con contraseña funcione)
  -- ==================================================================
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (
      v_admin_id,
      v_admin_id::text,
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@nexos.com'),
      'email', NOW(), NOW(), NOW()
    ),
    (
      v_ops_id,
      v_ops_id::text,
      v_ops_id,
      jsonb_build_object('sub', v_ops_id::text, 'email', 'ops@nexos.com'),
      'email', NOW(), NOW(), NOW()
    ),
    (
      v_ventas_id,
      v_ventas_id::text,
      v_ventas_id,
      jsonb_build_object('sub', v_ventas_id::text, 'email', 'ventas@nexos.com'),
      'email', NOW(), NOW(), NOW()
    )
  ON CONFLICT DO NOTHING;

  -- ==================================================================
  -- 3. PUBLIC.USERS  (el trigger on_auth_user_created debería crearlos,
  --                   pero lo hacemos explícito para el seed)
  -- ==================================================================
  INSERT INTO public.users (id, email, name)
  VALUES
    (v_admin_id,  'admin@nexos.com',  'Admin Nexos'),
    (v_ops_id,    'ops@nexos.com',    'Ops Nexos'),
    (v_ventas_id, 'ventas@nexos.com', 'Ventas Nexos')
  ON CONFLICT (id) DO NOTHING;

  -- ==================================================================
  -- 4. ORGANIZACIÓN
  -- ==================================================================
  INSERT INTO public.organizations (id, name, plan)
  VALUES (v_org_id, 'Nexos', 'free')
  ON CONFLICT (id) DO NOTHING;

  -- ==================================================================
  -- 5. MEMBRESÍAS
  -- ==================================================================
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES
    (v_org_id, v_admin_id,  'owner'),
    (v_org_id, v_ops_id,    'admin'),
    (v_org_id, v_ventas_id, 'member')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- ==================================================================
  -- 6. FUENTES  (sources)
  -- ==================================================================
  INSERT INTO public.sources (id, organization_id, name, type, url, vertical, status)
  VALUES
    (
      '30000000-0000-0000-0000-000000000001',
      v_org_id,
      'Encuentra24 – Autos Honduras',
      'rss',
      'https://www.encuentra24.com/rss/hn/cars',
      'autos',
      'active'
    ),
    (
      '30000000-0000-0000-0000-000000000002',
      v_org_id,
      'OLX Honduras – Smartphones',
      'rss',
      'https://www.olx.hn/rss/smartphones',
      'smartphones',
      'active'
    ),
    (
      '30000000-0000-0000-0000-000000000003',
      v_org_id,
      'InmoHN – Bienes Raíces',
      'rss',
      'https://www.inmohn.com/feed',
      'real_estate',
      'active'
    )
  ON CONFLICT (id) DO NOTHING;

  -- ==================================================================
  -- 7. BÚSQUEDAS GUARDADAS  (saved_searches)
  -- ==================================================================
  INSERT INTO public.saved_searches
    (id, organization_id, created_by, name, keywords, filters, is_active)
  VALUES
    (
      '40000000-0000-0000-0000-000000000001',
      v_org_id, v_admin_id,
      'Toyota Hilux SPS',
      ARRAY['toyota', 'hilux'],
      '{"category":"autos","intent":"buy"}'::jsonb,
      TRUE
    ),
    (
      '40000000-0000-0000-0000-000000000002',
      v_org_id, v_admin_id,
      'iPhone 14 Tegucigalpa',
      ARRAY['iphone', '14'],
      '{"category":"smartphones"}'::jsonb,
      TRUE
    ),
    (
      '40000000-0000-0000-0000-000000000003',
      v_org_id, v_admin_id,
      'Apartamentos en renta Zona Sur',
      ARRAY['apartamento', 'zona sur'],
      '{"category":"real_estate","intent":"rent"}'::jsonb,
      TRUE
    )
  ON CONFLICT (id) DO NOTHING;

  -- ==================================================================
  -- 8. ALERTA DE EJEMPLO
  -- ==================================================================
  INSERT INTO public.alerts
    (id, organization_id, created_by, saved_search_id, name, channel, channel_config, is_active)
  VALUES
    (
      '50000000-0000-0000-0000-000000000001',
      v_org_id, v_admin_id,
      '40000000-0000-0000-0000-000000000001',
      'Alerta Toyota Hilux',
      'email',
      '{"email":"admin@nexos.com"}'::jsonb,
      TRUE
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Seed completado — org: Nexos | usuarios: admin, ops, ventas @nexos.com';
END $$;
