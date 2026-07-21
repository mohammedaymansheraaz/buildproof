"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useAuthProvider } from "@/components/app-providers";
import { useSupabaseUser } from "@/components/supabase-session";
import { cn } from "@/lib/utils";

export function MarketingAuthControls({ compact = false }: { compact?: boolean }) {
  const authProvider = useAuthProvider();

  if (authProvider === "demo") {
    return <GuestControls compact={compact} />;
  }

  if (authProvider === "supabase") return <SupabaseMarketingAuthControls compact={compact} />;
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
  const authProvider = useAuthProvider();
  if (authProvider === "demo") {
    return <span className="workspace-demo-user"><LogIn size={14} /> Demo workspace</span>;
  }

  if (authProvider === "supabase") return <SupabaseWorkspaceUserControl />;
  return <ClerkWorkspaceUserControl />;
}

function SupabaseMarketingAuthControls({ compact }: { compact: boolean }) {
  const { user, loading, signOut } = useSupabaseUser();
  const router = useRouter();

  if (loading || !user) return <GuestControls compact={compact} />;

  return (
    <div className={cn("marketing-auth-actions", compact && "marketing-auth-actions--compact")}>
      <Link href="/dashboard" className="marketing-register"><LayoutDashboard size={14} /> Workspace</Link>
      <button className="marketing-login marketing-auth-signout" type="button" onClick={async () => {
        await signOut();
        router.replace("/");
        router.refresh();
      }} aria-label="Sign out"><LogOut size={14} /></button>
    </div>
  );
}

function SupabaseWorkspaceUserControl() {
  const { user, loading, signOut } = useSupabaseUser();
  const router = useRouter();

  if (loading) return <span className="workspace-demo-user"><LogIn size={14} /> Loading session</span>;
  if (!user) return <span className="workspace-demo-user"><LogIn size={14} /> Signed out</span>;

  const identifier = user.email ?? "Authenticated user";
  return (
    <button className="workspace-demo-user workspace-auth-user" type="button" title={`Signed in as ${identifier}`} onClick={async () => {
      await signOut();
      router.replace("/");
      router.refresh();
    }}>
      <span>{identifier.slice(0, 2).toUpperCase()}</span>
      <small>Sign out</small>
      <LogOut size={13} />
    </button>
  );
}

function ClerkWorkspaceUserControl() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return <span className="workspace-demo-user"><LogIn size={14} /> Loading session</span>;
  }

  return <UserButton appearance={{ elements: { avatarBox: "workspace-user-avatar" } }} />;
}
