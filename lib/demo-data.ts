import type {
  AuditCategory,
  AuditDraft,
  AuditModule,
  AuditRun,
  Evidence,
  Finding,
  TestPlanItem,
} from "@/lib/types";
import { getDomainForCategory } from "@/lib/audit-domains";

export const auditModules: AuditModule[] = [
  { id: "functional", label: "Functional QA", description: "Critical user journeys and interaction behavior.", icon: "Pointer" },
  { id: "api", label: "API & config", description: "Requests, integrations, environment readiness.", icon: "Network" },
  { id: "cloud", label: "Cloud readiness", description: "Deployment posture and data handling signals.", icon: "Cloud" },
  { id: "security", label: "Safe security review", description: "Authorized, non-destructive exposure checks.", icon: "Shield" },
  { id: "accessibility", label: "Accessibility", description: "Keyboard, contrast, semantics, and usability.", icon: "Accessibility" },
  { id: "performance", label: "Performance", description: "Experience quality and release-impacting regressions.", icon: "Gauge" },
];

export const sampleDraft: AuditDraft = {
  projectName: "Northstar Workspace",
  repositoryUrl: "github.com/buildproof-demo/northstar-workspace",
  branch: "main",
  stagingUrl: "https://northstar-staging.example",
  environment: "staging",
  testAccount: "qa@northstar.example",
  productIntent:
    "Teams can create a workspace, invite teammates, upload source files, and export a shared release report.",
  selectedModules: ["functional", "api", "cloud", "security", "accessibility", "performance"],
};

function nowIso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function evidence(
  kind: Evidence["kind"],
  title: string,
  source: string,
  description: string,
  payload?: string,
): Evidence {
  return {
    id: makeId("ev"),
    kind,
    title,
    source,
    description,
    capturedAt: nowIso(-1000 * 60 * 18),
    payload,
  };
}

function buildPlan(selectedModules: AuditCategory[]): TestPlanItem[] {
  const items: TestPlanItem[] = [
    {
      id: "plan-onboarding",
      title: "Create a workspace",
      detail: "Validate signup, workspace creation, and recovery paths.",
      category: "functional",
      selected: selectedModules.includes("functional"),
    },
    {
      id: "plan-invite",
      title: "Invite a teammate",
      detail: "Verify UI feedback, mail configuration, and authorization boundaries.",
      category: "api",
      selected: selectedModules.includes("functional") || selectedModules.includes("api"),
    },
    {
      id: "plan-upload",
      title: "Upload a source file",
      detail: "Check validation, storage handoff, and safe file-type behavior.",
      category: "cloud",
      selected: selectedModules.includes("cloud") || selectedModules.includes("security"),
    },
    {
      id: "plan-export",
      title: "Export a shared report",
      detail: "Trace permission checks, API response behavior, and data exposure.",
      category: "security",
      selected: selectedModules.includes("security") || selectedModules.includes("api"),
    },
    {
      id: "plan-accessibility",
      title: "Navigate billing controls by keyboard",
      detail: "Review focus, contrast, labels, and important action states.",
      category: "accessibility",
      selected: selectedModules.includes("accessibility"),
    },
  ];

  return items.filter((item) => item.selected);
}

function buildFindings(auditRunId: string): Finding[] {
  return [
    {
      id: makeId("finding"),
      auditRunId,
      primaryDomain: "security",
      category: "security",
      severity: "critical",
      confidence: "high",
      status: "open",
      title: "Export endpoint lacks a verified admin boundary",
      summary:
        "The release export route returned an administrative data response after a standard workspace session was evaluated in the authorized demo scenario.",
      impact: "Sensitive workspace data could be exposed outside the intended administrator role.",
      affectedArea: "Reports · export API",
      affectedFiles: ["app/api/admin/export/route.ts", "lib/auth/roles.ts"],
      reproductionSteps: [
        "Sign in with the scoped standard workspace test account.",
        "Open the report export action available in the authorized staging scenario.",
        "Observe that the server response does not enforce the expected administrator role check.",
      ],
      recommendation:
        "Enforce a server-side role check before building any export response, then add an authorization test for standard and administrator sessions.",
      evidence: [
        evidence(
          "network",
          "Authorized staging response",
          "GET /api/admin/export",
          "The route returned a 200 response in the scoped test workflow where an administrator-only decision was expected.",
          "GET /api/admin/export\nstatus: 200\nexpected policy: administrator role required",
        ),
        evidence(
          "code",
          "Route authorization context",
          "app/api/admin/export/route.ts",
          "The reviewed route needs a server-side role assertion before data serialization.",
          "const session = await getSession();\n// Add: assertRole(session, 'admin');\nreturn exportWorkspaceData(session.workspaceId);",
        ),
      ],
      autoFixEligible: true,
      discoveredAtStage: 3,
    },
    {
      id: makeId("finding"),
      auditRunId,
      primaryDomain: "engineering",
      category: "api",
      severity: "high",
      confidence: "high",
      status: "open",
      title: "Workspace invite flow fails when mail config is absent",
      summary:
        "The Invite teammate action returned a server error because the mail provider configuration was missing from the staging environment.",
      impact: "Teams cannot invite collaborators, blocking a core activation workflow.",
      affectedArea: "Workspace · team invite",
      affectedFiles: ["app/api/invitations/route.ts", "lib/email/send-invite.ts"],
      reproductionSteps: [
        "Create a workspace with the scoped test account.",
        "Enter a teammate email in the Invite teammate control.",
        "Submit the form and observe the server error in the authorized staging trace.",
      ],
      recommendation:
        "Fail fast during deploy validation when the mail provider key is absent, and return a safe actionable UI error if delivery is unavailable.",
      evidence: [
        evidence(
          "browser",
          "Invite workflow replay",
          "Workspace settings · invite teammate",
          "The submit control entered an error state instead of confirming that the invitation was created.",
        ),
        evidence(
          "config",
          "Release environment check",
          "Staging configuration",
          "Required mail delivery configuration was not present in the release contract.",
          "Required: RESEND_API_KEY\nStaging: not configured\nImpact: invitation delivery unavailable",
        ),
      ],
      autoFixEligible: true,
      discoveredAtStage: 2,
    },
    {
      id: makeId("finding"),
      auditRunId,
      primaryDomain: "security",
      category: "code",
      severity: "high",
      confidence: "medium",
      status: "open",
      title: "Example configuration includes a secret-shaped value",
      summary:
        "Repository intelligence found a value formatted like a credential in an example configuration file. The value should be removed and rotated if it was ever active.",
      impact: "A copied or historic credential can spread into forks, logs, or deployment environments.",
      affectedArea: "Repository · configuration hygiene",
      affectedFiles: [".env.example"],
      reproductionSteps: [
        "Review the repository configuration template.",
        "Locate the secret-shaped example value flagged by the static review.",
        "Replace it with an empty placeholder and confirm the related credential is rotated if applicable.",
      ],
      recommendation:
        "Keep configuration templates value-free, add secret scanning to pull requests, and rotate any credential that may have been exposed.",
      evidence: [
        evidence(
          "code",
          "Static configuration signal",
          ".env.example",
          "A credential-shaped placeholder was detected during repository review.",
          "SERVICE_API_KEY=replace_with_your_own_key\nRecommendation: keep the value empty in templates.",
        ),
      ],
      autoFixEligible: true,
      discoveredAtStage: 0,
    },
    {
      id: makeId("finding"),
      auditRunId,
      primaryDomain: "security",
      category: "cloud",
      severity: "medium",
      confidence: "high",
      status: "open",
      title: "Upload path does not declare an allowed file-type policy",
      summary:
        "The release contract did not demonstrate a server-enforced file type allowlist before storage handoff.",
      impact: "Unexpected file types can increase storage, processing, and downstream handling risk.",
      affectedArea: "Files · upload pipeline",
      affectedFiles: ["app/api/uploads/route.ts", "lib/storage/put-object.ts"],
      reproductionSteps: [
        "Open the scoped upload workflow.",
        "Review the server validation path before the storage call.",
        "Confirm that an explicit allowlist is applied before accepting the file.",
      ],
      recommendation:
        "Validate MIME type and file signature on the server, cap upload size, and store uploads outside public delivery paths.",
      evidence: [
        evidence(
          "trace",
          "Upload route trace",
          "POST /api/uploads",
          "The inspected route flowed from request parsing to storage handoff without a declared allowlist checkpoint.",
        ),
      ],
      autoFixEligible: true,
      discoveredAtStage: 2,
    },
    {
      id: makeId("finding"),
      auditRunId,
      primaryDomain: "experience",
      category: "accessibility",
      severity: "medium",
      confidence: "high",
      status: "open",
      title: "Billing confirmation text falls below readable contrast",
      summary:
        "The confirmation label in the billing form has insufficient contrast on its current surface.",
      impact: "People with low vision may miss a critical billing state or action result.",
      affectedArea: "Billing · confirmation state",
      affectedFiles: ["app/(app)/billing/page.tsx", "app/globals.css"],
      reproductionSteps: [
        "Navigate to the billing confirmation state in the authorized staging workflow.",
        "Inspect the confirmation label against its background.",
        "Adjust the foreground token until it meets the required contrast threshold.",
      ],
      recommendation:
        "Use the stronger confirmation text token and add contrast checks to the visual regression suite.",
      evidence: [
        evidence(
          "browser",
          "Billing confirmation capture",
          "Billing · confirmation state",
          "The confirmation label is visually present but does not meet the target contrast threshold in the captured state.",
        ),
      ],
      autoFixEligible: true,
      discoveredAtStage: 1,
    },
    {
      id: makeId("finding"),
      auditRunId,
      primaryDomain: "engineering",
      category: "performance",
      severity: "low",
      confidence: "medium",
      status: "open",
      title: "Dashboard hero asset delays primary content paint",
      summary:
        "The primary dashboard image is larger than its rendered size and delays the first useful view on a cold load.",
      impact: "The dashboard feels slower than necessary for new or returning users on constrained connections.",
      affectedArea: "Dashboard · first content paint",
      affectedFiles: ["app/(app)/dashboard/page.tsx"],
      reproductionSteps: [
        "Run the primary dashboard route with a cold cache.",
        "Inspect the largest contentful element in the performance trace.",
        "Serve a responsive image size and preload only the needed asset.",
      ],
      recommendation:
        "Serve a responsive asset, reserve layout space, and defer non-essential imagery below the first viewport.",
      evidence: [
        evidence(
          "trace",
          "Experience quality signal",
          "Dashboard performance trace",
          "The primary visual asset dominates the early loading window in the captured trace.",
        ),
      ],
      autoFixEligible: false,
      discoveredAtStage: 2,
    },
  ];
}

export function createDemoAudit(draft: AuditDraft, options?: { completed?: boolean; isVerification?: boolean }): AuditRun {
  const id = makeId("audit");
  const completed = options?.completed ?? false;
  const startedAt = completed ? nowIso(-1000 * 60 * 42) : nowIso();
  const run: AuditRun = {
    id,
    ...draft,
    plan: buildPlan(draft.selectedModules),
    findings: [],
    createdAt: completed ? nowIso(-1000 * 60 * 46) : nowIso(),
    startedAt,
    finishedAt: completed ? nowIso(-1000 * 60 * 34) : undefined,
    status: completed ? "completed" : "running",
    isVerification: options?.isVerification,
  };

  const selectedDomains = new Set(draft.selectedModules.map((category) => getDomainForCategory(category).id));
  run.findings = buildFindings(id).filter(
    (finding) => draft.selectedModules.includes(finding.category) || (finding.primaryDomain && selectedDomains.has(finding.primaryDomain)),
  );
  return run;
}

export function createSampleAudit(): AuditRun {
  return createDemoAudit(sampleDraft, { completed: true });
}

export function createVerificationAudit(source: AuditRun): AuditRun {
  const run = createDemoAudit(
    {
      projectName: source.projectName,
      repositoryUrl: source.repositoryUrl,
      branch: source.branch,
      stagingUrl: source.stagingUrl,
      environment: source.environment,
      productIntent: source.productIntent,
      testAccount: source.testAccount ?? "",
      selectedModules: source.selectedModules,
    },
    { isVerification: true },
  );

  run.findings = run.findings.map((finding) =>
    finding.severity === "critical"
      ? {
          ...finding,
          status: "resolved",
          summary: "Verification confirmed the expected server-side authorization guard is now in place for the scoped test scenario.",
          recommendation: "Keep the new authorization regression test in the release suite.",
        }
      : finding,
  );
  return run;
}
