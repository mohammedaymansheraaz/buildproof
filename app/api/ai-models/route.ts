import { NextResponse } from "next/server";
import { z } from "zod";
import { aiModelPresets } from "@/lib/ai-model-catalog";
import {
  deleteAiModelConnection,
  listAiModelConnections,
  saveAiModelConnection,
  setDefaultAiModelConnection,
} from "@/lib/ai-model-connections";
import { getAiProviderStatus } from "@/lib/ai-provider";
import { testAiModelConnection } from "@/lib/ai-model-runtime";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

const saveSchema = z.object({
  presetId: z.string().trim().min(1).optional(),
  provider: z.enum(["openai", "openrouter", "nebius", "custom-openai"]),
  model: z.string().trim().min(1).max(200),
  baseUrl: z.string().trim().max(500).optional().default(""),
  apiKey: z.string().trim().min(1).max(2_000),
});

const patchSchema = z.object({
  action: z.literal("set_default"),
  connectionId: z.string().uuid(),
});

async function requireAuthenticatedApiUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return { userId };
  return {
    response: NextResponse.json({ error: "Authentication is required to manage AI models." }, { status: 401 }),
  };
}

export async function GET() {
  const auth = await requireAuthenticatedApiUser();
  if ("response" in auth) return auth.response;

  const saved = await listAiModelConnections(auth.userId);
  const deployment = await getAiProviderStatus(auth.userId);

  return NextResponse.json({
    presets: aiModelPresets,
    deployment: {
      ...deployment,
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
      hasNebiusKey: Boolean(process.env.NEBIUS_API_KEY),
      hasCredentialEncryptionKey: saved.storage.encryptionReady,
    },
    connections: saved.connections,
    defaultConnection: saved.defaultConnection,
    storage: saved.storage,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedApiUser();
  if ("response" in auth) return auth.response;

  const parsed = saveSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid model save request", issues: parsed.error.flatten() }, { status: 400 });
  }

  const beforeSave = await listAiModelConnections(auth.userId);
  if (!beforeSave.storage.canPersist) {
    return NextResponse.json({ error: beforeSave.storage.message, storage: beforeSave.storage }, { status: 409 });
  }

  try {
    const testResult = await testAiModelConnection({ ...parsed.data, useDeploymentKey: false });
    const connection = await saveAiModelConnection(auth.userId, {
      ...parsed.data,
      testResult,
    });
    const saved = await listAiModelConnections(auth.userId);
    return NextResponse.json({ connection, ...saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI model could not be saved." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuthenticatedApiUser();
  if ("response" in auth) return auth.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid model update request", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const connection = await setDefaultAiModelConnection(auth.userId, parsed.data.connectionId);
    const saved = await listAiModelConnections(auth.userId);
    return NextResponse.json({ connection, ...saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI model could not be updated." },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuthenticatedApiUser();
  if ("response" in auth) return auth.response;

  const connectionId = new URL(request.url).searchParams.get("id");
  if (!connectionId || !z.string().uuid().safeParse(connectionId).success) {
    return NextResponse.json({ error: "A valid AI model connection id is required." }, { status: 400 });
  }

  try {
    await deleteAiModelConnection(auth.userId, connectionId);
    const saved = await listAiModelConnections(auth.userId);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI model could not be deleted." },
      { status: 503 },
    );
  }
}
