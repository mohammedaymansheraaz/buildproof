import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthProvider = "supabase" | "clerk" | "demo";

export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

/**
 * Supabase takes precedence once configured. Clerk remains a temporary
 * migration fallback so existing deployments do not lose their sign-in flow.
 */
export function getAuthProvider(): AuthProvider {
  if (isSupabaseConfigured()) return "supabase";
  if (isClerkConfigured()) return "clerk";
  return "demo";
}
