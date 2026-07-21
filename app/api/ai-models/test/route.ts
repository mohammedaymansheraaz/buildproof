import { NextResponse } from "next/server";
import { z } from "zod";
import { testAiModelConnection } from "@/lib/ai-model-runtime";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

const testSchema = z.object({
  presetId: z.string().trim().min(1).optional(),
  provider: z.enum(["openai", "openrouter", "nebius", "custom-openai"]),
  model: z.string().trim().min(1).max(200),
  baseUrl: z.string().trim().max(500).optional().default(""),
  apiKey: z.string().trim().max(2_000).optional().default(""),
  useDeploymentKey: z.boolean().optional().default(false),
});

async function requireAuthenticatedApiUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return null;
  return NextResponse.json({ error: "Authentication is required to test AI model keys." }, { status: 401 });
}

export async function POST(request: Request) {
  const denied = await requireAuthenticatedApiUser();
  if (denied) return denied;

  const parsed = testSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid model test request", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json(await testAiModelConnection(parsed.data));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        provider: parsed.data.provider,
        model: parsed.data.model,
        baseUrl: parsed.data.baseUrl,
        score: 0,
        rating: "Connection failed",
        error: error instanceof Error ? error.message : "Model test failed.",
      },
      { status: 502 },
    );
  }
}
