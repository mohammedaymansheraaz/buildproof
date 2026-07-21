import { NextResponse } from "next/server";
import { z } from "zod";
import { auditCategories } from "@/lib/types";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import { createPersistedAudit, listPersistedAudits } from "@/lib/persisted-audits";

const optionalStagingUrlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .default("")
  .refine((value) => !value || z.string().url().safeParse(value).success, "Enter a valid staging or preview URL.");

const auditDraftSchema = z
  .object({
    projectName: z.string().trim().min(1).max(120),
    repositoryUrl: z.string().trim().max(500).optional().default(""),
    branch: z.string().trim().min(1).max(120).default("main"),
    stagingUrl: optionalStagingUrlSchema,
    environment: z.enum(["staging", "preview", "production"]),
    productIntent: z.string().trim().min(1).max(2_000),
    testAccount: z.string().trim().max(300).optional().default(""),
    selectedModules: z.array(z.enum(auditCategories)).min(1),
  })
  .refine((draft) => Boolean(draft.repositoryUrl.trim() || draft.stagingUrl.trim()), {
    message: "Choose a GitHub repository, a running app URL, or both.",
    path: ["repositoryUrl"],
  });

async function requireUser() {
  const userId = await getAuthenticatedUserId();
  if (userId) return { userId };
  return {
    response: NextResponse.json(
      { error: "Authentication is required to access BuildProof audits." },
      { status: 401 },
    ),
  };
}

function errorResponse(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "BuildProof could not complete that audit request." },
    { status: 503 },
  );
}

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  try {
    const audits = await listPersistedAudits(auth.userId);
    return NextResponse.json({ audits, mode: "supabase" });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body: unknown = await request.json().catch(() => undefined);
  const result = auditDraftSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid audit request", issues: result.error.flatten() }, { status: 400 });
  }

  try {
    const audit = await createPersistedAudit(auth.userId, result.data);
    return NextResponse.json({ audit, mode: "supabase" }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
