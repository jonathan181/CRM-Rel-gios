import { getSupabaseClient } from '../lib/supabase';

export function getDbClient() {
  return getSupabaseClient();
}

export { getSupabaseClient };
