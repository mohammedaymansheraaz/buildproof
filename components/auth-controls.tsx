"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useAuthAvailability } from "@/components/app-providers";
import { cn } from "@/lib/utils";

export function MarketingAuthControls({ compact = false }: { compact?: boolean }) {
  const clerkEnabled = useAuthAvailability();

  if (!clerkEnabled) {
    return <GuestControls compact={compact} />;
  }

  return <ClerkMarketingAuthControls compact={compact} />;
}

function GuestControls({ compact }: { compact: boolean }) {
  return (
    <div className={cn("marketing-auth-actions", compact && "marketing-auth-actions--compact")}>
      <Link href="/sign-in" className="marketing-login">Log in</Link>
      <Link href="/sign-up" className="marketing-register">Register <ArrowRight size={14} /></Link>
    </div>
  );
}

function ClerkMarketingAuthControls({ compact }: { compact: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) return <GuestControls compact={compact} />;

  return (
    <div className={cn("marketing-auth-actions", compact && "marketing-auth-actions--compact")}>
      <Link href="/dashboard" className="marketing-register"><LayoutDashboard size={14} /> Workspace</Link>
      <UserButton appearance={{ elements: { avatarBox: "marketing-user-avatar" } }} />
    </div>
  );
}

export function WorkspaceUserControl() {
  const clerkEnabled = useAuthAvailability();
  if (!clerkEnabled) {
    return <span className="workspace-demo-user"><LogIn size={14} /> Demo workspace</span>;
  }

  return <ClerkWorkspaceUserControl />;
}

function ClerkWorkspaceUserControl() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return <span className="workspace-demo-user"><LogIn size={14} /> Loading session</span>;
  }

  return <UserButton appearance={{ elements: { avatarBox: "workspace-user-avatar" } }} />;
}
