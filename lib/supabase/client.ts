"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | undefined;

/** Returns null rather than constructing a broken client in local demo mode. */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  browserClient ??= createBrowserClient(config.url, config.publishableKey);
  return browserClient;
}
