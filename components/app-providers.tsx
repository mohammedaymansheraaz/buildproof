"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { createContext, useContext } from "react";
import { AuditProvider } from "@/components/audit-provider";
import { SupabaseConfigProvider } from "@/components/supabase-config-provider";
import type { AuthProvider } from "@/lib/auth-config";
import type { SupabasePublicConfig } from "@/lib/supabase/config";

const AuthProviderContext = createContext<AuthProvider>("demo");

export function AppProviders({
  children,
  authProvider,
  supabaseConfig,
}: {
  children: React.ReactNode;
  authProvider: AuthProvider;
  supabaseConfig: SupabasePublicConfig | null;
}) {
  const content = <SupabaseConfigProvider config={supabaseConfig}><AuditProvider>{children}</AuditProvider></SupabaseConfigProvider>;

  return (
    <AuthProviderContext.Provider value={authProvider}>
      {authProvider === "clerk" ? (
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#9FE8FF",
              colorBackground: "#0A0D12",
              colorInput: "rgba(255,255,255,0.06)",
              colorInputForeground: "#E7ECF2",
              colorForeground: "#E7ECF2",
              colorMutedForeground: "#9AA4B2",
              borderRadius: "0.9rem",
            },
          }}
        >
          {content}
        </ClerkProvider>
      ) : (
        content
      )}
    </AuthProviderContext.Provider>
  );
}

export function useAuthProvider() {
  return useContext(AuthProviderContext);
}
