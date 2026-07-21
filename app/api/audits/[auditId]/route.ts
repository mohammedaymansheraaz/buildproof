import { NextResponse } from "next/server";
import { z } from "zod";
import { completePersistedAudit } from "@/lib/persisted-audits";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

const patchSchema = z.object({
  action: z.literal("complete"),
});

async function requireUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return { userId };
  return {
    response: NextResponse.json(
      { error: "Authentication is required to update this audit." },
      { status: 401 },
    ),
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ auditId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid audit update request", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { auditId } = await context.params;
    const audit = await completePersistedAudit(auth.userId, auditId);
    if (!audit) return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audit could not be updated." },
      { status: 503 },
    );
  }
}
