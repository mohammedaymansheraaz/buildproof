import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateReleaseScore, getReleaseVerdict } from "@/lib/audit-engine";
import { AUDIT_STAGES } from "@/lib/audit-engine";
import { auditCategories, type AuditCategory, type AuditDraft, type AuditReport, type AuditRun, type AuditStatus, type Evidence, type EvidenceKind, type Finding, type FindingStatus, type ReleaseVerdict, type Severity, type TestPlanItem } from "@/lib/types";
import { getDomainForFinding } from "@/lib/audit-domains";
import { runSafeAudit } from "@/lib/audit-analyzer";
import { generateAgenticAuditReport, skippedAgenticAuditReport } from "@/lib/ai-agent-orchestrator";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
};

type TargetRow = {
  id: string;
  project_id: string;
  repository_url: string;
  repository_ref: string;
  staging_url: string;
  environment: "preview" | "staging" | "production";
};

type RunRow = {
  id: string;
  project_id: string;
  audit_target_id: string;
  requested_by: string;
  status: "queued" | "planning" | "running" | "completed" | "failed" | "canceled";
  selected_domains: unknown;
  product_intent: string | null;
  policy_snapshot: unknown;
  runner_metadata: unknown;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

type FindingRow = {
  id: string;
  project_id: string;
  audit_run_id: string;
  domain: "product" | "experience" | "engineering" | "security" | "ai-launch";
  severity: Severity;
  status: "open" | "acknowledged" | "in_progress" | "resolved" | "accepted_risk";
  title: string;
  summary: string;
  recommendation: string | null;
  confidence: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type EvidenceRow = {
  id: string;
  finding_id: string;
  evidence_kind: "source" | "request" | "response" | "screenshot" | "trace" | "scanner" | "artifact";
  artifact_path: string | null;
  summary: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type ReportRow = {
  id: string;
  project_id: string;
  audit_run_id: string;
  verdict: "ship" | "review" | "hold" | "incomplete";
  overall_score: number | null;
  report: Record<string, unknown> | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
};

const dbFindingStatusByUi: Record<FindingStatus, FindingRow["status"]> = {
  open: "open",
  needs_review: "acknowledged",
  resolved: "resolved",
  accepted: "accepted_risk",
};

const uiFindingStatusByDb: Record<FindingRow["status"], FindingStatus> = {
  open: "open",
  acknowledged: "needs_review",
  in_progress: "needs_review",
  resolved: "resolved",
  accepted_risk: "accepted",
};

const dbEvidenceKindByUi: Record<EvidenceKind, EvidenceRow["evidence_kind"]> = {
  browser: "screenshot",
  network: "request",
  code: "source",
  config: "artifact",
  trace: "trace",
};

const uiEvidenceKindByDb: Record<EvidenceRow["evidence_kind"], EvidenceKind> = {
  source: "code",
  request: "network",
  response: "network",
  screenshot: "browser",
  trace: "trace",
  scanner: "config",
  artifact: "config",
};

const dbReportVerdictByUi: Record<ReleaseVerdict, "ship" | "review" | "hold"> = {
  "READY TO SHIP": "ship",
  "READY WITH REVIEW": "review",
  "DO NOT SHIP": "hold",
};

function adminOrThrow() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase persistence is not configured. Add SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return admin;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "buildproof-project";
}

function fingerprint(parts: string[]) {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

function isAuditCategory(value: unknown): value is AuditCategory {
  return typeof value === "string" && (auditCategories as readonly string[]).includes(value);
}

function getSelectedModules(row: RunRow): AuditCategory[] {
  if (!Array.isArray(row.selected_domains)) return ["product", "functional", "security", "launch"];
  const selected = row.selected_domains.filter(isAuditCategory);
  return selected.length ? selected : ["product", "functional", "security", "launch"];
}

function getPlan(row: RunRow, selectedModules: AuditCategory[]): TestPlanItem[] {
  const snapshot = row.policy_snapshot as { plan?: unknown } | null;
  if (Array.isArray(snapshot?.plan)) return snapshot.plan as TestPlanItem[];
  return selectedModules.map((category) => ({
    id: `plan-${category}`,
    title: `${category.charAt(0).toUpperCase()}${category.slice(1)} review`,
    detail: "BuildProof will collect and normalize evidence for this selected release capability.",
    category,
    selected: true,
  }));
}

function confidenceLabel(value: number | null): Finding["confidence"] {
  if (value === null || value < 0.55) return "low";
  if (value < 0.8) return "medium";
  return "high";
}

function confidenceScore(value: Finding["confidence"]) {
  if (value === "high") return 0.9;
  if (value === "medium") return 0.65;
  return 0.4;
}

function mapStatus(row: RunRow): AuditStatus {
  if (row.status === "completed") return "completed";
  if (row.status === "canceled") return "cancelled";
  if (row.status === "queued") return "queued";
  return "running";
}

function mapEvidence(row: EvidenceRow): Evidence {
  const payload = row.payload ?? {};
  return {
    id: row.id,
    kind: typeof payload.uiKind === "string" ? payload.uiKind as EvidenceKind : uiEvidenceKindByDb[row.evidence_kind],
    title: typeof payload.title === "string" ? payload.title : row.summary,
    source: typeof payload.source === "string" ? payload.source : row.artifact_path ?? "BuildProof evidence",
    capturedAt: typeof payload.capturedAt === "string" ? payload.capturedAt : row.created_at,
    description: typeof payload.description === "string" ? payload.description : row.summary,
    payload: typeof payload.payload === "string" ? payload.payload : undefined,
  };
}

function mapFinding(row: FindingRow, evidenceRows: EvidenceRow[]): Finding {
  const metadata = row.metadata ?? {};
  const category = isAuditCategory(metadata.category) ? metadata.category : "security";
  const evidence = evidenceRows.filter((item) => item.finding_id === row.id).map(mapEvidence);

  return {
    id: row.id,
    auditRunId: row.audit_run_id,
    primaryDomain: row.domain,
    category,
    severity: row.severity,
    confidence: typeof metadata.confidenceLabel === "string" ? metadata.confidenceLabel as Finding["confidence"] : confidenceLabel(row.confidence),
    status: uiFindingStatusByDb[row.status],
    title: row.title,
    summary: row.summary,
    impact: typeof metadata.impact === "string" ? metadata.impact : row.summary,
    affectedArea: typeof metadata.affectedArea === "string" ? metadata.affectedArea : row.domain,
    affectedFiles: Array.isArray(metadata.affectedFiles) ? metadata.affectedFiles.filter((item): item is string => typeof item === "string") : [],
    reproductionSteps: Array.isArray(metadata.reproductionSteps) ? metadata.reproductionSteps.filter((item): item is string => typeof item === "string") : [],
    recommendation: row.recommendation ?? "Review this finding with the owning engineering team.",
    evidence,
    requiresRepository: typeof metadata.requiresRepository === "boolean" ? metadata.requiresRepository : undefined,
    autoFixEligible: Boolean(metadata.autoFixEligible),
    discoveredAtStage: typeof metadata.discoveredAtStage === "number" ? metadata.discoveredAtStage : 0,
  };
}

function mapReport(row: ReportRow): AuditReport {
  return {
    id: row.id,
    verdict: row.verdict,
    overallScore: row.overall_score,
    generatedAt: row.generated_at,
    report: row.report ?? {},
  };
}

function mapRun(row: RunRow, project: ProjectRow, target: TargetRow, findings: FindingRow[], evidence: EvidenceRow[], reports: ReportRow[]): AuditRun {
  const selectedModules = getSelectedModules(row);
  const runnerMetadata = row.runner_metadata as { isVerification?: unknown } | null;
  const report = reports.find((item) => item.audit_run_id === row.id);
  return {
    id: row.id,
    projectName: project.name,
    repositoryUrl: target.repository_url,
    branch: target.repository_ref,
    stagingUrl: target.staging_url,
    environment: target.environment,
    productIntent: row.product_intent ?? "",
    selectedModules,
    plan: getPlan(row, selectedModules),
    findings: findings.filter((findingRow) => findingRow.audit_run_id === row.id).map((findingRow) => mapFinding(findingRow, evidence)),
    createdAt: row.created_at,
    startedAt: row.started_at ?? row.created_at,
    finishedAt: row.finished_at ?? undefined,
    status: mapStatus(row),
    isVerification: runnerMetadata?.isVerification === true,
    report: report ? mapReport(report) : undefined,
  };
}

async function getProjectIdsForUser(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from("project_memberships")
    .select("project_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => String(row.project_id));
}

async function assertUserCanReadProject(admin: SupabaseClient, userId: string, projectId: string) {
  const { data, error } = await admin
    .from("project_memberships")
    .select("project_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("You do not have access to this audit workspace.");
}

async function ensureProfile(admin: SupabaseClient, userId: string) {
  const { data } = await admin.auth.admin.getUserById(userId);
  const user = data.user;
  if (!user) return;

  await admin.from("profiles").upsert({
    id: user.id,
    email: user.email,
    display_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null,
    avatar_url: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
  }, { onConflict: "id" });
}

async function ensureProject(admin: SupabaseClient, userId: string, draft: AuditDraft) {
  const slug = slugify(draft.projectName);
  const { data: existing, error: existingError } = await admin
    .from("projects")
    .select("id,name,slug,owner_id")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as ProjectRow;

  const { data, error } = await admin
    .from("projects")
    .insert({
      owner_id: userId,
      name: draft.projectName,
      slug,
      description: draft.productIntent.slice(0, 400),
    })
    .select("id,name,slug,owner_id")
    .single();

  if (error) throw error;
  return data as ProjectRow;
}

async function loadWorkspaceRows(admin: SupabaseClient, projectIds: string[]) {
  if (!projectIds.length) {
    return { projects: [] as ProjectRow[], targets: [] as TargetRow[], runs: [] as RunRow[], findings: [] as FindingRow[], evidence: [] as EvidenceRow[], reports: [] as ReportRow[] };
  }

  const [projectsResult, targetsResult, runsResult] = await Promise.all([
    admin.from("projects").select("id,name,slug,owner_id").in("id", projectIds),
    admin.from("audit_targets").select("id,project_id,repository_url,repository_ref,staging_url,environment").in("project_id", projectIds),
    admin.from("audit_runs").select("id,project_id,audit_target_id,requested_by,status,selected_domains,product_intent,policy_snapshot,runner_metadata,started_at,finished_at,created_at").in("project_id", projectIds).order("created_at", { ascending: false }).limit(30),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (targetsResult.error) throw targetsResult.error;
  if (runsResult.error) throw runsResult.error;

  const runs = (runsResult.data ?? []) as RunRow[];
  const runIds = runs.map((run) => run.id);
  if (!runIds.length) {
    return {
      projects: (projectsResult.data ?? []) as ProjectRow[],
      targets: (targetsResult.data ?? []) as TargetRow[],
      runs,
      findings: [] as FindingRow[],
      evidence: [] as EvidenceRow[],
      reports: [] as ReportRow[],
    };
  }

  const [findingsResult, reportsResult] = await Promise.all([
    admin
      .from("findings")
      .select("id,project_id,audit_run_id,domain,severity,status,title,summary,recommendation,confidence,metadata,created_at")
      .in("audit_run_id", runIds)
      .order("created_at", { ascending: true }),
    admin
      .from("audit_reports")
      .select("id,project_id,audit_run_id,verdict,overall_score,report,generated_at,created_at,updated_at")
      .in("audit_run_id", runIds),
  ]);

  if (findingsResult.error) throw findingsResult.error;
  if (reportsResult.error) throw reportsResult.error;
  const findings = (findingsResult.data ?? []) as FindingRow[];
  const findingIds = findings.map((findingRow) => findingRow.id);
  const evidenceResult = findingIds.length
    ? await admin
      .from("finding_evidence")
      .select("id,finding_id,evidence_kind,artifact_path,summary,payload,created_at")
      .in("finding_id", findingIds)
      .order("created_at", { ascending: true })
    : { data: [] as EvidenceRow[], error: null };

  if (evidenceResult.error) throw evidenceResult.error;

  return {
    projects: (projectsResult.data ?? []) as ProjectRow[],
    targets: (targetsResult.data ?? []) as TargetRow[],
    runs,
    findings,
    evidence: (evidenceResult.data ?? []) as EvidenceRow[],
    reports: (reportsResult.data ?? []) as ReportRow[],
  };
}

function rowsToRuns(rows: Awaited<ReturnType<typeof loadWorkspaceRows>>) {
  return rows.runs.flatMap((run) => {
    const project = rows.projects.find((item) => item.id === run.project_id);
    const target = rows.targets.find((item) => item.id === run.audit_target_id);
    if (!project || !target) return [];
    return [mapRun(run, project, target, rows.findings, rows.evidence, rows.reports)];
  });
}

async function loadAudit(admin: SupabaseClient, userId: string, auditId: string) {
  const { data: run, error } = await admin
    .from("audit_runs")
    .select("project_id")
    .eq("id", auditId)
    .maybeSingle();

  if (error) throw error;
  if (!run) return null;

  await assertUserCanReadProject(admin, userId, String(run.project_id));
  const rows = await loadWorkspaceRows(admin, [String(run.project_id)]);
  return rowsToRuns(rows).find((audit) => audit.id === auditId) ?? null;
}

async function insertFinding(admin: SupabaseClient, projectId: string, auditRunId: string, source: Finding) {
  const domain = getDomainForFinding(source).id;
  const { data, error } = await admin
    .from("findings")
    .insert({
      project_id: projectId,
      audit_run_id: auditRunId,
      domain,
      severity: source.severity,
      status: dbFindingStatusByUi[source.status],
      title: source.title,
      summary: source.summary,
      recommendation: source.recommendation,
      fingerprint: fingerprint([auditRunId, domain, source.category, source.title]),
      confidence: confidenceScore(source.confidence),
      metadata: {
        category: source.category,
        primaryDomain: source.primaryDomain,
        confidenceLabel: source.confidence,
        impact: source.impact,
        affectedArea: source.affectedArea,
        affectedFiles: source.affectedFiles,
        reproductionSteps: source.reproductionSteps,
        requiresRepository: source.requiresRepository ?? false,
        autoFixEligible: source.autoFixEligible,
        discoveredAtStage: source.discoveredAtStage,
      },
    })
    .select("id")
    .single();

  if (error) throw error;

  const findingId = String(data.id);
  if (source.evidence.length) {
    const evidenceRows = source.evidence.map((item) => ({
      project_id: projectId,
      finding_id: findingId,
      evidence_kind: dbEvidenceKindByUi[item.kind],
      artifact_path: item.source,
      summary: item.description,
      redacted: true,
      payload: {
        uiKind: item.kind,
        title: item.title,
        source: item.source,
        capturedAt: item.capturedAt,
        description: item.description,
        payload: item.payload,
      },
    }));
    const evidenceResult = await admin.from("finding_evidence").insert(evidenceRows);
    if (evidenceResult.error) throw evidenceResult.error;
  }
}

export async function listPersistedAudits(userId: string) {
  const admin = adminOrThrow();
  await ensureProfile(admin, userId);
  const projectIds = await getProjectIdsForUser(admin, userId);
  const rows = await loadWorkspaceRows(admin, projectIds);
  return rowsToRuns(rows);
}

export async function createPersistedAudit(userId: string, draft: AuditDraft, options: { isVerification?: boolean; sourceAuditId?: string } = {}) {
  const admin = adminOrThrow();
  await ensureProfile(admin, userId);
  const project = await ensureProject(admin, userId, draft);
  await assertUserCanReadProject(admin, userId, project.id);

  const targetInsert = await admin
    .from("audit_targets")
    .insert({
      project_id: project.id,
      created_by: userId,
      repository_url: draft.repositoryUrl.trim(),
      repository_ref: draft.branch.trim() || "main",
      staging_url: draft.stagingUrl,
      environment: draft.environment,
      verification_status: "verified",
      verified_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (targetInsert.error) throw targetInsert.error;

  const startedAt = new Date().toISOString();
  const runInsert = await admin
    .from("audit_runs")
    .insert({
      project_id: project.id,
      audit_target_id: targetInsert.data.id,
      requested_by: userId,
      status: "running",
      selected_domains: draft.selectedModules,
      product_intent: draft.productIntent,
      policy_snapshot: { plan: [] },
      runner_metadata: {
        isVerification: options.isVerification === true,
        sourceAuditId: options.sourceAuditId,
        runnerMode: "safe-control-plane-mvp",
      },
      started_at: startedAt,
    })
    .select("id")
    .single();

  if (runInsert.error) throw runInsert.error;
  const auditRunId = String(runInsert.data.id);

  try {
    const result = await runSafeAudit(draft);
    const findings = result.findings.map((item) => ({ ...item, auditRunId }));

    const events = AUDIT_STAGES.map((stage, index) => ({
      project_id: project.id,
      audit_run_id: auditRunId,
      event_type: index === AUDIT_STAGES.length - 1 ? "report.assembled" : `${stage.id}.completed`,
      actor_type: "agent",
      payload: {
        stageId: stage.id,
        label: stage.label,
        activity: stage.activity,
        runnerMode: "safe-control-plane-mvp",
      },
    }));
    const eventsResult = await admin.from("audit_events").insert(events);
    if (eventsResult.error) throw eventsResult.error;

    for (const item of findings) {
      await insertFinding(admin, project.id, auditRunId, item);
    }

    const score = calculateReleaseScore(findings);
    const verdict = getReleaseVerdict(findings);
    const finishedAt = new Date().toISOString();
    const updateResult = await admin
      .from("audit_runs")
      .update({
        status: "completed",
        policy_snapshot: { plan: result.plan, selectedModules: draft.selectedModules },
        runner_metadata: {
          isVerification: options.isVerification === true,
          sourceAuditId: options.sourceAuditId,
          runnerMode: "safe-control-plane-mvp",
          repositoryInspection: result.repositoryInspection,
          stagingObservation: result.stagingObservation,
        },
        finished_at: finishedAt,
      })
      .eq("id", auditRunId);

    if (updateResult.error) throw updateResult.error;

    const reportResult = await admin.from("audit_reports").insert({
      project_id: project.id,
      audit_run_id: auditRunId,
      verdict: dbReportVerdictByUi[verdict],
      overall_score: score,
      report: {
        title: "BuildProof CTO-level release report",
        generatedFrom: "safe-control-plane-mvp",
        verdict,
        score,
        blockerCount: findings.filter((findingItem) => findingItem.severity === "critical" || findingItem.severity === "high").length,
        coverageLimits: [
          "Full browser replay, Lighthouse, Semgrep, Gitleaks, Trivy, ZAP, and Nuclei execution are reserved for the isolated runner phase.",
          "This MVP report uses source-map, repository configuration, and safe staging-response evidence.",
        ],
      },
      generated_at: finishedAt,
    });

    if (reportResult.error) throw reportResult.error;

    await generatePersistedAiReport(userId, auditRunId, { recordSkipped: true }).catch(async (aiError) => {
      await admin.from("audit_events").insert({
        project_id: project.id,
        audit_run_id: auditRunId,
        event_type: "agent.ai_synthesis.skipped",
        actor_type: "agent",
        payload: {
          runnerMode: "safe-control-plane-mvp",
          error: aiError instanceof Error ? aiError.message : "AI synthesis could not be generated.",
        },
      });
    });
  } catch (error) {
    await admin
      .from("audit_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        runner_metadata: {
          isVerification: options.isVerification === true,
          sourceAuditId: options.sourceAuditId,
          runnerMode: "safe-control-plane-mvp",
          error: error instanceof Error ? error.message : "Safe audit runner failed.",
        },
      })
      .eq("id", auditRunId);
    throw error;
  }

  const audit = await loadAudit(admin, userId, auditRunId);
  if (!audit) throw new Error("Audit was created but could not be loaded.");
  return audit;
}

export async function completePersistedAudit(userId: string, auditId: string) {
  const admin = adminOrThrow();
  const audit = await loadAudit(admin, userId, auditId);
  if (!audit) return null;

  const { error } = await admin
    .from("audit_runs")
    .update({ status: "completed", finished_at: new Date().toISOString() })
    .eq("id", auditId);

  if (error) throw error;
  return loadAudit(admin, userId, auditId);
}

export async function updatePersistedFindingStatus(userId: string, auditId: string, findingId: string, status: FindingStatus) {
  const admin = adminOrThrow();
  const audit = await loadAudit(admin, userId, auditId);
  if (!audit) return null;

  const { error } = await admin
    .from("findings")
    .update({ status: dbFindingStatusByUi[status] })
    .eq("audit_run_id", auditId)
    .eq("id", findingId);

  if (error) throw error;
  return loadAudit(admin, userId, auditId);
}

export async function createPersistedVerificationAudit(userId: string, auditId: string) {
  const admin = adminOrThrow();
  const audit = await loadAudit(admin, userId, auditId);
  if (!audit) return null;

  return createPersistedAudit(userId, {
    projectName: audit.projectName,
    repositoryUrl: audit.repositoryUrl,
    branch: audit.branch,
    stagingUrl: audit.stagingUrl,
    environment: audit.environment,
    productIntent: audit.productIntent,
    testAccount: audit.testAccount ?? "",
    selectedModules: audit.selectedModules,
  }, { isVerification: true, sourceAuditId: auditId });
}

export async function generatePersistedAiReport(
  userId: string,
  auditId: string,
  options: { recordSkipped?: boolean } = {},
) {
  const admin = adminOrThrow();
  const audit = await loadAudit(admin, userId, auditId);
  if (!audit) return null;

  const { data: runRow, error: runError } = await admin
    .from("audit_runs")
    .select("project_id")
    .eq("id", auditId)
    .maybeSingle();

  if (runError) throw runError;
  if (!runRow) return null;

  const projectId = String(runRow.project_id);
  await assertUserCanReadProject(admin, userId, projectId);

  let aiSynthesis;
  try {
    aiSynthesis = await generateAgenticAuditReport(userId, audit);
  } catch (error) {
    if (!options.recordSkipped) throw error;
    aiSynthesis = skippedAgenticAuditReport(
      error instanceof Error ? error.message : "AI synthesis could not be generated.",
      audit,
    );
  }

  const findings = audit.findings;
  const score = calculateReleaseScore(findings);
  const verdict = getReleaseVerdict(findings);
  const generatedAt = new Date().toISOString();
  const existingReport = audit.report?.report ?? {};

  const reportPayload = {
    ...existingReport,
    title: "BuildProof CTO-level release report",
    generatedFrom: "safe-control-plane-mvp",
    verdict,
    score,
    blockerCount: findings.filter((findingItem) => findingItem.severity === "critical" || findingItem.severity === "high").length,
    coverageLimits: Array.isArray(existingReport.coverageLimits)
      ? existingReport.coverageLimits
      : [
        "Full browser replay, Lighthouse, Semgrep, Gitleaks, Trivy, ZAP, and Nuclei execution are reserved for the isolated runner phase.",
        "This MVP report uses source-map, repository configuration, and safe staging-response evidence.",
      ],
    aiSynthesis,
  };

  const reportResult = await admin.from("audit_reports").upsert({
    project_id: projectId,
    audit_run_id: auditId,
    verdict: dbReportVerdictByUi[verdict],
    overall_score: score,
    report: reportPayload,
    generated_at: generatedAt,
  }, { onConflict: "audit_run_id" });

  if (reportResult.error) throw reportResult.error;

  const eventRows: Array<{
    project_id: string;
    audit_run_id: string;
    event_type: string;
    actor_type: "agent";
    payload: Record<string, unknown>;
  }> = aiSynthesis.status === "generated"
    ? [
      ...aiSynthesis.specialistSections.map((section) => ({
        project_id: projectId,
        audit_run_id: auditId,
        event_type: `agent.${section.domain}.synthesized`,
        actor_type: "agent" as const,
        payload: {
          provider: aiSynthesis.provider,
          model: aiSynthesis.model,
          source: aiSynthesis.source,
          score: section.score,
          agents: section.agents,
          evidenceIds: section.evidenceIds,
        },
      })),
      {
        project_id: projectId,
        audit_run_id: auditId,
        event_type: "agent.cto_report.synthesized",
        actor_type: "agent" as const,
        payload: {
          provider: aiSynthesis.provider,
          model: aiSynthesis.model,
          source: aiSynthesis.source,
          verdict,
          score,
          evidenceCount: aiSynthesis.evidenceCount,
        },
      },
    ]
    : [{
      project_id: projectId,
      audit_run_id: auditId,
      event_type: "agent.ai_synthesis.skipped",
      actor_type: "agent" as const,
      payload: {
        error: aiSynthesis.error,
        promptVersion: aiSynthesis.promptVersion,
      },
    }];

  const eventsResult = await admin.from("audit_events").insert(eventRows);
  if (eventsResult.error) throw eventsResult.error;

  return loadAudit(admin, userId, auditId);
}
