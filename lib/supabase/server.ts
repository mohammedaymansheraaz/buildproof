import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Server Components and route handlers get a cookie-backed client. Token
 * refreshes are normally persisted by proxy.ts; the try/catch is necessary
 * because Server Components cannot mutate cookies after rendering begins.
 */
export async function createServerSupabaseClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components rely on the proxy to refresh browser cookies.
        }
      },
    },
  });
}

/** Use verified JWT claims for route protection, never an unverified session. */
export async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error) return null;
    return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  } catch {
    return null;
  }
}
