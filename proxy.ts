import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { getAuthProvider } from "@/lib/auth-config";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/audit(.*)",
  "/audits(.*)",
  "/findings(.*)",
  "/fix-center(.*)",
  "/report(.*)",
  "/reports(.*)",
  "/integrations(.*)",
  "/settings(.*)",
]);

const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect();
});

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const authProvider = getAuthProvider();
  if (authProvider === "supabase") return updateSupabaseSession(request);
  if (authProvider === "clerk") return clerkProxy(request, event);
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
