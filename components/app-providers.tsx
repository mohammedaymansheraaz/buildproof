"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { createContext, useContext } from "react";
import { AuditProvider } from "@/components/audit-provider";
import type { AuthProvider } from "@/lib/auth-config";

const AuthProviderContext = createContext<AuthProvider>("demo");

export function AppProviders({
  children,
  authProvider,
}: {
  children: React.ReactNode;
  authProvider: AuthProvider;
}) {
  const content = <AuditProvider>{children}</AuditProvider>;

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
