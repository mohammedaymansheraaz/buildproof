"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { createContext, useContext } from "react";
import { AuditProvider } from "@/components/audit-provider";

const AuthAvailabilityContext = createContext(false);

export function AppProviders({
  children,
  clerkEnabled,
}: {
  children: React.ReactNode;
  clerkEnabled: boolean;
}) {
  const content = <AuditProvider>{children}</AuditProvider>;

  return (
    <AuthAvailabilityContext.Provider value={clerkEnabled}>
      {clerkEnabled ? (
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
    </AuthAvailabilityContext.Provider>
  );
}

export function useAuthAvailability() {
  return useContext(AuthAvailabilityContext);
}
