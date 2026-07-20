import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/auth-config";

export async function AppAccessGate({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) return children;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return children;
}
