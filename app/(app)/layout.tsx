import { AppAccessGate } from "@/components/app-access-gate";
import { AppShell } from "@/components/app-shell";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppAccessGate>
      <AppShell>{children}</AppShell>
    </AppAccessGate>
  );
}
