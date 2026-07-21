import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthProvider } from "@/lib/auth-config";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export async function AppAccessGate({ children }: { children: React.ReactNode }) {
  const authProvider = getAuthProvider();

  if (authProvider === "supabase") {
    const userId = await getAuthenticatedUserId();
    if (!userId) redirect("/sign-in");
    return children;
  }

  if (authProvider === "demo") return children;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return children;
}
