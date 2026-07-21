export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

function readEnv(name: string) {
  return process.env[name]?.trim();
}

/**
 * This deliberately reads only browser-safe Supabase values. Service-role and
 * database secrets never belong in client or SSR authentication helpers.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL") || readEnv("SUPABASE_URL");
  // `ANON_KEY` is retained only for existing Supabase projects; new projects
  // should use the publishable key shown in .env.example.
  const publishableKey = readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    || readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    || readEnv("SUPABASE_PUBLISHABLE_KEY")
    || readEnv("SUPABASE_ANON_KEY");

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
