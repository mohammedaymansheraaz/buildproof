import { NextResponse } from "next/server";
import { generatePersistedAiReport } from "@/lib/persisted-audits";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

async function requireUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return { userId };
  return {
    response: NextResponse.json(
      { error: "Authentication is required to generate an AI CTO report." },
      { status: 401 },
    ),
  };
}

export async function POST(_request: Request, context: { params: Promise<{ auditId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    const { auditId } = await context.params;
    const audit = await generatePersistedAiReport(auth.userId, auditId);
    if (!audit) return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI CTO report could not be generated." },
      { status: 503 },
    );
  }
}
