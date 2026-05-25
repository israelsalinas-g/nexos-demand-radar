-- =====================================================================
-- Demand Radar — Migration 002
-- Extiende handle_new_user() para crear org + membership automáticamente
-- al registrarse un nuevo usuario.
--
-- Ejecutar en: Supabase → SQL Editor
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id   UUID;
  v_org_name TEXT;
BEGIN
  -- 1. Espejo del usuario en public.users
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Nombre de la org: metadata "name" o parte local del email
  v_org_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- 3. Crear organización personal
  INSERT INTO public.organizations (name, plan)
  VALUES (v_org_name, 'free')
  RETURNING id INTO v_org_id;

  -- 4. Agregar al usuario como owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;
