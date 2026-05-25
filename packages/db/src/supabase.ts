import { createClient as _createClient } from "@supabase/supabase-js";

export function createClient(options?: { serviceRole?: boolean }) {
  const url = process.env.SUPABASE_URL!;
  const key = options?.serviceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.SUPABASE_ANON_KEY!;

  return _createClient(url, key);
}
