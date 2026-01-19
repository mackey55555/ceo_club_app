import { createClient } from '@supabase/supabase-js';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[Supabase] Missing env: ${name}`);
  return value;
}

/**
 * Service-role Supabase client for server-side usage only.
 * - RLS is bypassed
 * - DO NOT import this into client components
 */
export function createServiceSupabase() {
  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  // Prefer the new "Secret API key" (sb_secret_...) if available.
  // Fallback to legacy service_role key for backward compatibility.
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  if (!secretKey) {
    throw new Error(
      '[Supabase] Missing env: SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY (legacy)'
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}


