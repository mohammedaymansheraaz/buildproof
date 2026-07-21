import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let adminClient: SupabaseClient | null | undefined;

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.SUPABASE_SECRET_KEY?.trim();
}

export function isSupabaseAdminConfigured() {
  return Boolean(getSupabasePublicConfig() && getServiceRoleKey());
}

export function createSupabaseAdminClient() {
  if (adminClient !== undefined) return adminClient;

  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!publicConfig || !serviceRoleKey) {
    adminClient = null;
    return adminClient;
  }

  adminClient = createClient(publicConfig.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}
