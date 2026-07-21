import "server-only";

import type { AuditCategory, AuditDraft, Evidence, Finding, TestPlanItem } from "@/lib/types";
import { getDomainForCategory } from "@/lib/audit-domains";
import { inspectGitHubRepositorySource, type RepositorySourceInspection, type RepositorySourceMap } from "@/lib/github-repository";

type StagingObservation = {
  reachable: boolean;
  status: number | null;
  elapsedMs: number | null;
  finalUrl: string;
  headers: {
    contentSecurityPolicy: boolean;
    strictTransportSecurity: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    referrerPolicy: boolean;
  };
  error: string | null;
};

export type SafeAuditResult = {
  plan: TestPlanItem[];
  findings: Finding[];
  repositoryInspection: RepositorySourceInspection | null;
  stagingObservation: StagingObservation | null;
};

function nowIso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
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
    capturedAt: nowIso(),
    payload,
  };
}

function finding(input: Omit<Finding, "id" | "auditRunId" | "evidence"> & { evidence: Evidence[] }): Finding {
  return {
    ...input,
    id: makeId("finding"),
    auditRunId: "pending",
  };
}

export function buildAuditPlan(selectedModules: AuditCategory[]): TestPlanItem[] {
  const items: TestPlanItem[] = [
    {
      id: "plan-product-intelligence",
      title: "Map product intent and approved audit boundary",
      detail: "Translate the submitted release promise into roles, critical journeys, source surfaces, and evidence limits.",
      category: "product",
      selected: selectedModules.includes("product"),
    },
    {
      id: "plan-experience",
      title: "Inspect user experience and functional journeys",
      detail: "Use the staging target, visible UI, accessibility signals, and future browser replay evidence to evaluate customer-facing behavior.",
      category: "functional",
      selected: selectedModules.includes("functional") || selectedModules.includes("accessibility"),
    },
    {
      id: "plan-engineering",
      title: "Trace engineering, source, data, and delivery readiness",
      detail: "Read approved repository structure for frameworks, APIs, CI/CD, database, deployment, dependency, and test readiness signals.",
      category: "code",
      selected: selectedModules.some((category) => ["api", "cloud", "performance", "code", "database", "devops"].includes(category)),
    },
    {
      id: "plan-security",
      title: "Run safe security and reliability baseline",
      detail: "Check authentication surfaces, secret-risk file paths, dependency automation signals, and passive security headers inside the approved scope.",
      category: "security",
      selected: selectedModules.includes("security"),
    },
    {
      id: "plan-ai-launch",
      title: "Evaluate conditional AI scope and launch decision",
      detail: "Only evaluate AI-specific behavior when source evidence declares AI surfaces, then assemble a CTO-level launch brief.",
      category: "launch",
      selected: selectedModules.includes("ai") || selectedModules.includes("launch"),
    },
  ];

  return items.filter((item) => item.selected);
}

async function observeStagingTarget(stagingUrl: string): Promise<StagingObservation> {
  const startedAt = Date.now();
  if (!stagingUrl.trim()) {
    return {
      reachable: false,
      status: null,
      elapsedMs: null,
      finalUrl: "not supplied",
      headers: {
        contentSecurityPolicy: false,
        strictTransportSecurity: false,
        xFrameOptions: false,
        xContentTypeOptions: false,
        referrerPolicy: false,
      },
      error: "No staging URL was supplied for this audit.",
    };
  }

  const normalized = new URL(stagingUrl).toString();

  try {
    let response = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(normalized, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
    }

    const elapsedMs = Date.now() - startedAt;
    return {
      reachable: response.ok,
      status: response.status,
      elapsedMs,
      finalUrl: response.url || normalized,
      headers: {
        contentSecurityPolicy: response.headers.has("content-security-policy"),
        strictTransportSecurity: response.headers.has("strict-transport-security"),
        xFrameOptions: response.headers.has("x-frame-options"),
        xContentTypeOptions: response.headers.has("x-content-type-options"),
        referrerPolicy: response.headers.has("referrer-policy"),
      },
      error: response.ok ? null : `The target responded with HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      reachable: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      finalUrl: normalized,
      headers: {
        contentSecurityPolicy: false,
        strictTransportSecurity: false,
        xFrameOptions: false,
        xContentTypeOptions: false,
        referrerPolicy: false,
      },
      error: error instanceof Error ? error.message : "The staging target could not be reached.",
    };
  }
}

function summarizeSourceMap(sourceMap: RepositorySourceMap) {
  return [
    `framework: ${sourceMap.framework ?? "not detected"}`,
    `package manager: ${sourceMap.packageManager ?? "not detected"}`,
    `files scanned: ${sourceMap.filesScanned}`,
    `routes: ${sourceMap.surfaces.routes.length}`,
    `api handlers: ${sourceMap.surfaces.apiHandlers.length}`,
    `auth files: ${sourceMap.surfaces.authFiles.length}`,
    `database files: ${sourceMap.surfaces.databaseFiles.length}`,
    `ci workflows: ${sourceMap.surfaces.ciWorkflows.length}`,
    `deployment files: ${sourceMap.surfaces.deploymentFiles.length}`,
    `tests: ${sourceMap.surfaces.testFiles.length}`,
  ].join("\n");
}

function createProductFindings(draft: AuditDraft, sourceMap: RepositorySourceMap | null): Finding[] {
  const surfaces = sourceMap
    ? `${sourceMap.surfaces.routes.length} routes, ${sourceMap.surfaces.apiHandlers.length} API handlers, and ${sourceMap.surfaces.authFiles.length} auth-related source files`
    : "the submitted product intent and staging boundary";

  return [
    finding({
      primaryDomain: "product",
      category: "product",
      severity: "info",
      confidence: sourceMap ? "high" : "medium",
      status: "needs_review",
      title: "Product intelligence map created for the approved audit scope",
      summary: `BuildProof mapped ${surfaces} against the stated product promise before running deeper specialist checks.`,
      impact: "Every later finding can be tied back to the declared release intent instead of appearing as an isolated technical warning.",
      affectedArea: "Product intelligence · audit boundary",
      affectedFiles: [],
      reproductionSteps: [
        "Review the submitted product intent.",
        "Confirm the repository, branch, staging target, and selected expert teams match the release you intended to assess.",
        "Use the source and staging evidence limits when interpreting the final CTO report.",
      ],
      recommendation: "Keep the product intent short, explicit, and tied to the most important user journeys before each re-audit.",
      evidence: [
        evidence(
          "config",
          "Submitted release intent",
          "Audit intake",
          "The user-approved release promise anchors all product, engineering, security, and launch findings.",
          `project: ${draft.projectName}\nbranch: ${draft.branch}\nenvironment: ${draft.environment}\nintent: ${draft.productIntent}`,
        ),
      ],
      autoFixEligible: false,
      discoveredAtStage: 0,
    }),
  ];
}

function createExperienceFindings(observation: StagingObservation | null): Finding[] {
  if (!observation) return [];

  if (observation.finalUrl === "not supplied") {
    return [
      finding({
        primaryDomain: "experience",
        category: "functional",
        severity: "info",
        confidence: "high",
        status: "needs_review",
        title: "Browser journey evidence is waiting for a staging URL",
        summary: "No staging URL was available, so BuildProof skipped live browser, accessibility, and performance checks.",
        impact: "Repository evidence can still support source review, but BuildProof cannot fully inspect the running application without a reachable app URL.",
        affectedArea: "Application Experience & Quality · browser coverage",
        affectedFiles: [],
        reproductionSteps: [
          "Connect a staging or preview URL when one is available.",
          "Add test-account handling through the isolated runner before signed-in browser replay.",
          "Re-run the audit to add Playwright, accessibility, performance, and passive HTTP evidence.",
        ],
        recommendation: "Add an authorized staging or preview URL before using BuildProof as a full release gate.",
        evidence: [
          evidence(
            "config",
            "Missing running app URL",
            "Audit intake",
            "No staging target was supplied, so browser-based checks were intentionally skipped.",
            "stagingUrl: not supplied\nbrowserReplay: skipped\naccessibility: skipped\nperformance: skipped",
          ),
        ],
        autoFixEligible: false,
        discoveredAtStage: 1,
      }),
    ];
  }

  if (!observation.reachable) {
    return [
      finding({
        primaryDomain: "experience",
        category: "functional",
        severity: "high",
        confidence: "high",
        status: "open",
        title: "Staging target is not reachable from the audit control plane",
        summary: "BuildProof could not reach the submitted staging URL during the safe baseline check.",
        impact: "Functional QA, browser journey replay, accessibility review, and performance evidence cannot start until the target is reachable.",
        affectedArea: "Application Experience & Quality · staging target",
        affectedFiles: [],
        reproductionSteps: [
          "Open the submitted staging URL from a normal browser.",
          "Confirm the URL is public or reachable from the audit runner network.",
          "Re-run the audit once the target responds successfully.",
        ],
        recommendation: "Expose a stable preview/staging URL for audit traffic, or run the future isolated runner inside the same private network.",
        evidence: [
          evidence(
            "network",
            "Staging reachability probe",
            observation.finalUrl,
            observation.error ?? "The target did not return a successful response.",
            `status: ${observation.status ?? "unavailable"}\nelapsedMs: ${observation.elapsedMs ?? "unavailable"}\nerror: ${observation.error ?? "none"}`,
          ),
        ],
        autoFixEligible: false,
        discoveredAtStage: 1,
      }),
    ];
  }

  const slow = observation.elapsedMs !== null && observation.elapsedMs > 3_500;

  return [
    finding({
      primaryDomain: "experience",
      category: slow ? "performance" : "functional",
      severity: slow ? "medium" : "info",
      confidence: "medium",
      status: slow ? "needs_review" : "resolved",
      title: slow ? "Initial staging response is slow enough to affect perceived quality" : "Staging target responds to the safe baseline check",
      summary: slow
        ? `The staging target responded in ${observation.elapsedMs}ms during the baseline reachability check.`
        : "The staging target was reachable, so future browser journey, accessibility, and performance runners have a valid starting point.",
      impact: slow
        ? "Slow first response can make journey replay, login, and dashboard loading feel unreliable even when functionality is correct."
        : "A reachable target allows the experience team to progress from intake into browser-backed evidence.",
      affectedArea: "Application Experience & Quality · staging target",
      affectedFiles: [],
      reproductionSteps: [
        "Request the submitted staging URL.",
        "Record HTTP status and elapsed response time.",
        "Use this baseline to decide whether full Lighthouse and Playwright evidence should be scheduled.",
      ],
      recommendation: slow
        ? "Run Lighthouse and request tracing on the primary user journey, then optimize the slowest server or frontend startup path."
        : "Add Playwright journey credentials next so BuildProof can validate the full signed-in path instead of only reachability.",
      evidence: [
        evidence(
          "network",
          "Safe staging response",
          observation.finalUrl,
          "BuildProof performed a non-destructive reachability check against the authorized target.",
          `status: ${observation.status}\nelapsedMs: ${observation.elapsedMs}\nfinalUrl: ${observation.finalUrl}`,
        ),
      ],
      autoFixEligible: false,
      discoveredAtStage: 1,
    }),
  ];
}

function createEngineeringFindings(sourceMap: RepositorySourceMap | null, repositoryLimitation: string | null): Finding[] {
  if (!sourceMap) {
    return [
      finding({
        primaryDomain: "engineering",
        category: "code",
        severity: "medium",
        confidence: "high",
        status: "needs_review",
        title: "Repository source evidence is not available yet",
        summary: repositoryLimitation ?? "BuildProof could not read the repository source tree for this audit.",
        impact: "Backend, cloud, database, DevOps, dependency, and code architecture checks remain coverage-limited.",
        affectedArea: "Engineering Performance & Infrastructure · source coverage",
        affectedFiles: [],
        reproductionSteps: [
          "Confirm the repository URL and branch.",
          "Ensure the server-side GitHub token can read the repository.",
          "Re-run the audit after source access is available.",
        ],
        recommendation: "Connect a GitHub token with read-only repository access before relying on engineering or security source findings.",
        evidence: [
          evidence(
            "config",
            "Repository coverage limit",
            "GitHub source map",
            repositoryLimitation ?? "No source map was produced.",
          ),
        ],
        autoFixEligible: false,
        discoveredAtStage: 2,
      }),
    ];
  }

  const findings: Finding[] = [
    finding({
      primaryDomain: "engineering",
      category: "code",
      severity: "info",
      confidence: "high",
      status: "resolved",
      title: "Repository source map captured for engineering review",
      summary: `BuildProof detected ${sourceMap.framework ?? "an application"} with ${sourceMap.filesScanned} files, ${sourceMap.surfaces.apiHandlers.length} API surfaces, and ${sourceMap.surfaces.ciWorkflows.length} CI workflows.`,
      impact: "The engineering team has enough source structure to reason about APIs, deployment, database, tests, and scalability signals.",
      affectedArea: "Engineering Performance & Infrastructure · source map",
      affectedFiles: [
        ...sourceMap.surfaces.apiHandlers.slice(0, 3),
        ...sourceMap.surfaces.deploymentFiles.slice(0, 2),
      ],
      reproductionSteps: [
        "Read the GitHub tree for the selected branch.",
        "Classify routes, API handlers, database files, deployment files, and CI workflows.",
        "Use this source map to prioritize deeper runner checks.",
      ],
      recommendation: "Keep API, database, and deployment surfaces easy to locate so future specialist runners can attach evidence quickly.",
      evidence: [
        evidence(
          "code",
          "Repository source map",
          "GitHub tree",
          "BuildProof classified source surfaces without cloning or executing the repository.",
          summarizeSourceMap(sourceMap),
        ),
      ],
      autoFixEligible: false,
      discoveredAtStage: 2,
    }),
  ];

  if (sourceMap.riskSignals.missingCi) {
    findings.push(finding({
      primaryDomain: "engineering",
      category: "devops",
      severity: "high",
      confidence: "high",
      status: "open",
      title: "No CI workflow was detected in the repository source map",
      summary: "The selected branch does not expose a GitHub Actions workflow or equivalent CI signal in the files BuildProof inspected.",
      impact: "Build, test, migration, smoke, and rollback checks may depend on manual release discipline rather than repeatable automation.",
      affectedArea: "Engineering Performance & Infrastructure · delivery readiness",
      affectedFiles: [],
      reproductionSteps: [
        "Inspect the repository tree for `.github/workflows` or another declared CI entry point.",
        "Confirm whether build, test, lint, migration, and smoke checks run before deployment.",
        "Add or connect CI evidence before treating the release as production-ready.",
      ],
      recommendation: "Add a CI workflow that runs typecheck, lint, tests, build, migrations where relevant, and a smoke check for the deployed target.",
      evidence: [
        evidence("config", "CI source-map check", ".github/workflows", "No workflow files were visible in the selected source tree."),
      ],
      autoFixEligible: true,
      discoveredAtStage: 2,
    }));
  }

  if (sourceMap.manifest.hasPackageJson && sourceMap.riskSignals.missingLockfile) {
    findings.push(finding({
      primaryDomain: "engineering",
      category: "performance",
      severity: "medium",
      confidence: "high",
      status: "open",
      title: "JavaScript package manifest exists without a detected lockfile",
      summary: "BuildProof found `package.json` but did not detect npm, pnpm, yarn, or bun lockfile evidence.",
      impact: "Dependency versions can drift between local, CI, staging, and production environments, making audit results harder to reproduce.",
      affectedArea: "Engineering Performance & Infrastructure · dependency reproducibility",
      affectedFiles: ["package.json"],
      reproductionSteps: [
        "Inspect the repository root for package manager lockfiles.",
        "Compare install behavior between development and CI.",
        "Commit the correct lockfile for the package manager your team uses.",
      ],
      recommendation: "Commit a lockfile and make CI install dependencies with a frozen/immutable mode.",
      evidence: [
        evidence("code", "Dependency reproducibility check", "package.json", "A package manifest was visible, but no recognized lockfile was detected."),
      ],
      autoFixEligible: false,
      discoveredAtStage: 2,
    }));
  }

  if (sourceMap.riskSignals.missingTests) {
    findings.push(finding({
      primaryDomain: "engineering",
      category: "code",
      severity: "medium",
      confidence: "medium",
      status: "needs_review",
      title: "No obvious test files were detected in the source map",
      summary: "BuildProof did not find common test directories or `.test`/`.spec` files in the visible repository tree.",
      impact: "Critical user journeys and backend policies may be verified manually instead of being protected by repeatable regression tests.",
      affectedArea: "Engineering Performance & Infrastructure · regression coverage",
      affectedFiles: [],
      reproductionSteps: [
        "Inspect the repository tree for test directories and spec files.",
        "Confirm whether tests live outside the inspected branch or use a non-standard naming convention.",
        "Add regression tests for the release-critical journeys and security boundaries.",
      ],
      recommendation: "Add targeted tests for sign-in, role boundaries, invite flows, API errors, and deployment smoke checks.",
      evidence: [
        evidence("code", "Test surface check", "GitHub tree", "No common test surfaces were visible in the selected source tree."),
      ],
      autoFixEligible: false,
      discoveredAtStage: 2,
    }));
  }

  return findings;
}

function createSecurityFindings(sourceMap: RepositorySourceMap | null, observation: StagingObservation | null): Finding[] {
  const findings: Finding[] = [];

  if (sourceMap?.riskSignals.possibleSecretFiles.length) {
    findings.push(finding({
      primaryDomain: "security",
      category: "security",
      severity: "critical",
      confidence: "medium",
      status: "open",
      title: "Potential secret-bearing files are visible in the repository tree",
      summary: "The source map includes filenames commonly associated with environment secrets, private keys, or credentials.",
      impact: "Secrets in repository history or source files can lead to account takeover, data exposure, or unauthorized infrastructure access.",
      affectedArea: "Security & Reliability Intelligence · secret exposure",
      affectedFiles: sourceMap.riskSignals.possibleSecretFiles,
      reproductionSteps: [
        "Review the listed files and confirm whether they contain real secret material.",
        "Rotate any exposed secret immediately.",
        "Remove the secret from history and add automated secret scanning before the next release.",
      ],
      recommendation: "Run Gitleaks or GitHub secret scanning in CI and keep only `.env.example` style placeholders in source control.",
      evidence: [
        evidence(
          "code",
          "Secret-risk filename scan",
          "GitHub tree",
          "BuildProof only inspected filenames at this stage; content scanning should run in the isolated runner.",
          sourceMap.riskSignals.possibleSecretFiles.join("\n"),
        ),
      ],
      autoFixEligible: false,
      discoveredAtStage: 3,
    }));
  }

  if (sourceMap && sourceMap.riskSignals.missingSecurityAutomation) {
    findings.push(finding({
      primaryDomain: "security",
      category: "security",
      severity: "medium",
      confidence: "medium",
      status: "needs_review",
      title: "No security automation signal was detected in source control",
      summary: "BuildProof did not detect CodeQL, Semgrep, Dependabot, Trivy, Gitleaks, or similar security automation configuration.",
      impact: "Known vulnerability, code-pattern, and secret checks may happen ad hoc instead of being part of every release.",
      affectedArea: "Security & Reliability Intelligence · release automation",
      affectedFiles: [],
      reproductionSteps: [
        "Inspect CI and repository configuration for security scanning.",
        "Confirm whether scanning runs outside GitHub or in a private CI system.",
        "Connect scanner evidence to BuildProof before relying on the final security verdict.",
      ],
      recommendation: "Start with dependency and secret scanning in CI, then add Semgrep/CodeQL rules for authentication and authorization boundaries.",
      evidence: [
        evidence("config", "Security automation check", "GitHub tree", "No common security automation configuration was visible in the selected source map."),
      ],
      autoFixEligible: true,
      discoveredAtStage: 3,
    }));
  }

  if (observation?.reachable) {
    const missingHeaders = Object.entries(observation.headers)
      .filter(([, present]) => !present)
      .map(([key]) => key);

    if (missingHeaders.length) {
      findings.push(finding({
        primaryDomain: "security",
        category: "security",
        severity: missingHeaders.includes("contentSecurityPolicy") ? "high" : "medium",
        confidence: "high",
        status: "open",
        title: "Passive security header baseline is incomplete",
        summary: `The staging response is missing ${missingHeaders.length} common browser security header${missingHeaders.length === 1 ? "" : "s"}.`,
        impact: "Missing browser security headers can increase exposure to injection, clickjacking, content-sniffing, and referrer leakage risks.",
        affectedArea: "Security & Reliability Intelligence · passive HTTP baseline",
        affectedFiles: [],
        reproductionSteps: [
          "Request the submitted staging URL.",
          "Inspect response headers for CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.",
          "Add the missing headers at the app, CDN, or reverse proxy layer.",
        ],
        recommendation: "Add a strict but tested CSP, HSTS for HTTPS production domains, X-Content-Type-Options, Referrer-Policy, and clickjacking protection where appropriate.",
        evidence: [
          evidence(
            "network",
            "Passive HTTP security header check",
            observation.finalUrl,
            "BuildProof performed a safe non-destructive header inspection against the authorized target.",
            Object.entries(observation.headers).map(([key, present]) => `${key}: ${present ? "present" : "missing"}`).join("\n"),
          ),
        ],
        autoFixEligible: true,
        discoveredAtStage: 3,
      }));
    }
  }

  return findings;
}

function createAiLaunchFindings(sourceMap: RepositorySourceMap | null): Finding[] {
  const aiDetected = Boolean(sourceMap?.surfaces.aiFiles.length)
    || Boolean(sourceMap?.manifest.dependencies.some((dependency) => /openai|anthropic|langchain|ai|llama|vector/i.test(dependency)));

  return [
    finding({
      primaryDomain: "ai-launch",
      category: aiDetected ? "ai" : "launch",
      severity: aiDetected ? "medium" : "info",
      confidence: sourceMap ? "medium" : "low",
      status: aiDetected ? "needs_review" : "resolved",
      title: aiDetected ? "AI surface detected and needs explicit evaluation coverage" : "No AI application surface was detected in the source map",
      summary: aiDetected
        ? "BuildProof found AI-related files or dependencies, so prompt, retrieval, evaluation, and cost controls should be reviewed before launch."
        : "The conditional AI agent stepped aside because the inspected source map did not declare an obvious AI feature surface.",
      impact: aiDetected
        ? "AI features need separate evaluation for hallucination risk, retrieval quality, prompt exposure, cost limits, and fallback behavior."
        : "The final CTO report can focus on product, experience, engineering, security, and launch readiness without inventing AI-specific issues.",
      affectedArea: "AI & Launch Readiness · conditional AI evaluation",
      affectedFiles: sourceMap?.surfaces.aiFiles.slice(0, 6) ?? [],
      reproductionSteps: [
        "Inspect dependencies and filenames for AI, agent, prompt, retrieval, embedding, or model usage.",
        "If AI is present, add evaluation datasets, expected behavior, fallback rules, and cost controls.",
        "If AI is absent, keep the AI section marked as not applicable instead of forcing a fake score.",
      ],
      recommendation: aiDetected
        ? "Add an AI evaluation plan covering prompts, retrieval inputs, model outputs, refusal behavior, latency, and cost ceilings."
        : "Keep AI evaluation conditional and spend launch-review effort on the evidence-backed product risks.",
      evidence: [
        evidence(
          "code",
          "Conditional AI surface check",
          "GitHub source map",
          aiDetected ? "AI-related files or dependencies were visible in source evidence." : "No obvious AI surface was visible in source evidence.",
          [
            `aiFiles: ${(sourceMap?.surfaces.aiFiles ?? []).join(", ") || "none"}`,
            `aiDependencies: ${(sourceMap?.manifest.dependencies ?? []).filter((dependency) => /openai|anthropic|langchain|ai|llama|vector/i.test(dependency)).join(", ") || "none"}`,
          ].join("\n"),
        ),
      ],
      autoFixEligible: false,
      discoveredAtStage: 4,
    }),
    finding({
      primaryDomain: "ai-launch",
      category: "launch",
      severity: "info",
      confidence: "high",
      status: "needs_review",
      title: "CTO launch report assembled from observed evidence and declared limitations",
      summary: "BuildProof prepared the final launch reading from product, experience, engineering, security, and conditional AI evidence.",
      impact: "Decision makers can separate proven issues, coverage gaps, and recommended next checks before shipping.",
      affectedArea: "AI & Launch Readiness · CTO report",
      affectedFiles: [],
      reproductionSteps: [
        "Review open critical and high findings first.",
        "Check evidence coverage limitations for source, runner, cloud, database, and security depth.",
        "Assign owners and re-run the audit after remediation.",
      ],
      recommendation: "Treat the first MVP report as a release-readiness baseline; add isolated runner tools next for deeper Playwright, Lighthouse, Semgrep, Gitleaks, Trivy, ZAP, and Nuclei evidence.",
      evidence: [
        evidence("config", "CTO report assembly", "BuildProof report engine", "The report contains observed findings, severity, confidence, coverage limits, and next actions."),
      ],
      autoFixEligible: false,
      discoveredAtStage: 5,
    }),
  ];
}

export async function runSafeAudit(draft: AuditDraft): Promise<SafeAuditResult> {
  const plan = buildAuditPlan(draft.selectedModules);
  const [repositoryResult, stagingObservation] = await Promise.allSettled([
    draft.repositoryUrl.trim() ? inspectGitHubRepositorySource(draft.repositoryUrl, draft.branch) : Promise.resolve(null),
    observeStagingTarget(draft.stagingUrl),
  ]);
  const repositoryInspection = repositoryResult.status === "fulfilled" ? repositoryResult.value : null;
  const sourceMap = repositoryInspection?.sourceMap ?? null;
  const repositoryLimitation = repositoryResult.status === "rejected"
    ? repositoryResult.reason instanceof Error ? repositoryResult.reason.message : "Repository source inspection failed."
    : repositoryInspection?.limitation ?? null;
  const observation = stagingObservation.status === "fulfilled" ? stagingObservation.value : null;

  const findings = [
    ...createProductFindings(draft, sourceMap),
    ...createExperienceFindings(observation),
    ...createEngineeringFindings(sourceMap, repositoryLimitation),
    ...createSecurityFindings(sourceMap, observation),
    ...createAiLaunchFindings(sourceMap),
  ].map((item) => ({
    ...item,
    primaryDomain: item.primaryDomain ?? getDomainForCategory(item.category).id,
  }));

  return {
    plan,
    findings,
    repositoryInspection,
    stagingObservation: observation,
  };
}
