import { NextResponse } from "next/server";
import { createPersistedVerificationAudit } from "@/lib/persisted-audits";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

async function requireUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return { userId };
  return {
    response: NextResponse.json(
      { error: "Authentication is required to re-run this audit." },
      { status: 401 },
    ),
  };
}

export async function POST(_request: Request, context: { params: Promise<{ auditId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    const { auditId } = await context.params;
    const audit = await createPersistedVerificationAudit(auth.userId, auditId);
    if (!audit) return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    return NextResponse.json({ audit }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification audit could not be started." },
      { status: 503 },
    );
  }
}
