import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getCleanSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/+$/, '');
  if (url.endsWith('/rest/v1')) {
    url = url.substring(0, url.length - '/rest/v1'.length);
  }
  return url.replace(/\/+$/, '');
}

export function getSupabaseCredentials() {
  let rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SAPBASE_URL ||
    process.env.SUPABASE_REST_URL ||
    '';

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '';
  if (!rawUrl && dbUrl) {
    const directMatch = dbUrl.match(/@db\.([a-z0-9-]+)\.supabase\.co/i);
    const poolerMatch = dbUrl.match(/postgres\.([a-z0-9-]+):/i);
    const ref = directMatch?.[1] || poolerMatch?.[1];
    if (ref) {
      rawUrl = `https://${ref}.supabase.co`;
    }
  }

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SAPBASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    '';

  const cleanUrl = getCleanSupabaseUrl(rawUrl);
  return { url: cleanUrl, key };
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClientInstance;
}

// Safe fallback client instance export for backward compatibility
const { url: initialUrl, key: initialKey } = getSupabaseCredentials();
export const supabase = (function() {
  if (initialUrl && initialKey) {
    return createClient(initialUrl, initialKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.key', {
    auth: { persistSession: false, autoRefreshToken: false }
  });
})();
