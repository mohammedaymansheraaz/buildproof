import { NextResponse } from "next/server";
import { z } from "zod";
import { createDemoAudit } from "@/lib/demo-data";
import { auditCategories } from "@/lib/types";
import { isDemoAuditMode } from "@/lib/config";

const auditDraftSchema = z.object({
  projectName: z.string().min(1),
  // A verified staging URL can support browser evidence without a repository.
  // Repository-only evidence remains unavailable until source access is connected.
  repositoryUrl: z.union([z.string().url(), z.literal("")]).default(""),
  branch: z.string().min(1).default("main"),
  stagingUrl: z.string().url(),
  environment: z.enum(["staging", "preview", "production"]),
  productIntent: z.string().min(1),
  testAccount: z.string().optional().default(""),
  selectedModules: z.array(z.enum(auditCategories)).min(1),
});

export function GET() {
  return NextResponse.json({
    mode: "demo",
    message: "Demo audit data is stored locally by the browser. Connect persistence and a worker runner for production use.",
  });
}

export async function POST(request: Request) {
  if (!isDemoAuditMode()) {
    return NextResponse.json(
      { error: "Live audits are not configured. Connect authenticated persistence, policy checks, and an isolated runner before enabling this endpoint." },
      { status: 503 },
    );
  }

  const body: unknown = await request.json().catch(() => undefined);
  const result = auditDraftSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid audit request", issues: result.error.flatten() }, { status: 400 });
  }

  const audit = createDemoAudit(result.data);
  return NextResponse.json({ audit, mode: "demo" }, { status: 201 });
}
