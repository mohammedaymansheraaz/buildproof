import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAiBrief, getAiProviderStatus } from "@/lib/ai-provider";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

const briefSchema = z.object({
  purpose: z.enum(["product-intelligence", "finding-explanation", "launch-brief"]),
  instructions: z.string().min(1).max(4_000),
  evidence: z.array(z.string().max(2_000)).max(20),
});

async function requireAuthenticatedApiUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return null;
  return NextResponse.json({ error: "Authentication is required to use AI-assisted audit intelligence." }, { status: 401 });
}

export async function GET() {
  const denied = await requireAuthenticatedApiUser();
  if (denied) return denied;
  return NextResponse.json(getAiProviderStatus());
}

export async function POST(request: Request) {
  const denied = await requireAuthenticatedApiUser();
  if (denied) return denied;

  const parsed = briefSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI brief request", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json(await generateAiBrief(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI brief could not be generated." },
      { status: 503 },
    );
  }
}
