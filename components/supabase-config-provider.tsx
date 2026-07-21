"use client";

import { createContext, useContext } from "react";
import type { SupabasePublicConfig } from "@/lib/supabase/config";

const SupabaseConfigContext = createContext<SupabasePublicConfig | null>(null);

export function SupabaseConfigProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: SupabasePublicConfig | null;
}) {
  return <SupabaseConfigContext.Provider value={config}>{children}</SupabaseConfigContext.Provider>;
}

export function useSupabaseConfig() {
  return useContext(SupabaseConfigContext);
}
