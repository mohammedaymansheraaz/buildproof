import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/dashboard";
  return value;
}

function signInErrorUrl(request: NextRequest, code: string) {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("auth_error", code);
  return url;
}

/** Exchanges Supabase's PKCE code and accepts only an internal redirect path. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(signInErrorUrl(request, "missing_code"));

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.redirect(signInErrorUrl(request, "not_configured"));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(signInErrorUrl(request, "exchange_failed"));

  return NextResponse.redirect(new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url));
}
