export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

/**
 * This deliberately reads only browser-safe Supabase values. Service-role and
 * database secrets never belong in client or SSR authentication helpers.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  // `ANON_KEY` is retained only for existing Supabase projects; new projects
  // should use the publishable key shown in .env.example.
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
