import { createClient } from '@supabase/supabase-js';

export function getServerSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
