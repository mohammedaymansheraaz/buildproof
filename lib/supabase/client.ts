"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, type SupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | undefined;
let activeConfig: SupabasePublicConfig | null = null;

/** Returns null rather than constructing a broken client in local demo mode. */
export function createBrowserSupabaseClient(explicitConfig?: SupabasePublicConfig | null): SupabaseClient | null {
  const config = explicitConfig ?? activeConfig ?? getSupabasePublicConfig();
  if (!config) return null;

  if (!browserClient || activeConfig?.url !== config.url || activeConfig?.publishableKey !== config.publishableKey) {
    browserClient = createBrowserClient(config.url, config.publishableKey);
    activeConfig = config;
  }

  return browserClient;
}
