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
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SAPBASE_URL ||
    process.env.SUPABASE_REST_URL ||
    '';

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

// Fallback client instance export for backward compatibility
const { url: initialUrl, key: initialKey } = getSupabaseCredentials();
export const supabase = createClient(
  initialUrl || 'https://placeholder.supabase.co',
  initialKey || 'placeholder-key'
);
