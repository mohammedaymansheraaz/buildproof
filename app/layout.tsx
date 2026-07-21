import type { Metadata } from "next";
import "@/app/globals.css";
import { AppProviders } from "@/components/app-providers";
import { getAuthProvider } from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "BuildProof — Release assurance",
  description: "Evidence-backed release assurance for modern software teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders authProvider={getAuthProvider()}>{children}</AppProviders>
      </body>
    </html>
  );
}
