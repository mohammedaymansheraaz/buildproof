import { NextResponse } from "next/server";
import { z } from "zod";
import { updatePersistedFindingStatus } from "@/lib/persisted-audits";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

const findingStatusSchema = z.object({
  status: z.enum(["open", "resolved", "accepted", "needs_review"]),
});

async function requireUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return { userId };
  return {
    response: NextResponse.json(
      { error: "Authentication is required to update this finding." },
      { status: 401 },
    ),
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ auditId: string; findingId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const parsed = findingStatusSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid finding update request", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { auditId, findingId } = await context.params;
    const audit = await updatePersistedFindingStatus(auth.userId, auditId, findingId, parsed.data.status);
    if (!audit) return NextResponse.json({ error: "Audit or finding not found." }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Finding could not be updated." },
      { status: 503 },
    );
  }
}
