import "server-only";

import { Agent, OpenAIProvider, Runner } from "@openai/agents";
import OpenAI from "openai";
import { auditDomains, getDomainFindings, type AuditDomainId } from "@/lib/audit-domains";
import { calculateReleaseScore, countBySeverity, domainReadiness, getReleaseVerdict } from "@/lib/audit-engine";
import { resolveAiProviderConfig } from "@/lib/ai-model-connections";
import type { AgenticAuditReport, AgenticAuditSection, AuditRun, Finding } from "@/lib/types";

const promptVersion = "buildproof-agentic-report-v1";

const specialistAgents: Record<AuditDomainId, string[]> = {
  product: ["Product Understanding Agent"],
  experience: ["UI/UX Testing Agent", "Functional QA Agent", "Accessibility Agent"],
  engineering: ["Performance Engineer Agent", "Backend + Cloud Engineer Agent", "Database Engineer Agent", "DevOps Engineer Agent"],
  security: ["Security Engineer Agent", "Auth/AuthZ Reviewer", "Data Protection Reviewer"],
  "ai-launch": ["AI Evaluation Agent", "Finance/Cost Agent", "Final CTO-Level Report Agent"],
};

const domainTitles: Record<AuditDomainId, string> = {
  product: "Product Intelligence",
  experience: "Application Experience & Quality",
  engineering: "Engineering Performance & Infrastructure",
  security: "Security & Reliability Intelligence",
  "ai-launch": "AI & Launch Readiness",
};

function compactFinding(finding: Finding) {
  return {
    id: finding.id,
    domain: finding.primaryDomain,
    category: finding.category,
    severity: finding.severity,
    confidence: finding.confidence,
    status: finding.status,
    title: finding.title,
    summary: finding.summary,
    impact: finding.impact,
    affectedArea: finding.affectedArea,
    affectedFiles: finding.affectedFiles.slice(0, 8),
    recommendation: finding.recommendation,
    evidence: finding.evidence.slice(0, 6).map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      source: item.source,
      description: item.description,
    })),
  };
}

function buildCoverageLimits(audit: AuditRun) {
  const limits: string[] = [];
  if (!audit.repositoryUrl.trim()) {
    limits.push("GitHub repository evidence was not supplied, so source, dependency, CI/CD, database, and code architecture coverage is limited.");
  }
  if (!audit.stagingUrl.trim()) {
    limits.push("Running app URL was not supplied, so browser journey, accessibility, performance, and passive HTTP coverage is limited.");
  }
  limits.push("The MVP uses deterministic safe checks as evidence; active exploitation and destructive testing are not authorized in this report.");
  return limits;
}

function reportInput(audit: AuditRun) {
  const findings = audit.findings.map(compactFinding);
  return {
    project: {
      name: audit.projectName,
      repositoryUrl: audit.repositoryUrl || "not supplied",
      branch: audit.branch,
      stagingUrl: audit.stagingUrl || "not supplied",
      environment: audit.environment,
      productIntent: audit.productIntent,
      selectedModules: audit.selectedModules,
    },
    score: calculateReleaseScore(audit.findings),
    verdict: getReleaseVerdict(audit.findings),
    counts: countBySeverity(audit.findings),
    coverageLimits: buildCoverageLimits(audit),
    findings,
  };
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  const trimmed = value.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function stringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 8)
    : fallback;
}

function sectionFromOutput(domainId: AuditDomainId, output: string, domainFindings: Finding[]): AgenticAuditSection {
  const parsed = safeJsonParse(output);
  return {
    domain: domainId,
    title: typeof parsed?.title === "string" ? parsed.title : domainTitles[domainId],
    agents: specialistAgents[domainId],
    score: typeof parsed?.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : domainReadiness(domainFindings, domainId),
    summary: typeof parsed?.summary === "string" ? parsed.summary : output.slice(0, 900),
    keySignals: stringArray(parsed?.keySignals, domainFindings.slice(0, 4).map((finding) => `${finding.severity}: ${finding.title}`)),
    recommendations: stringArray(parsed?.recommendations, domainFindings.slice(0, 4).map((finding) => finding.recommendation)),
    limitations: stringArray(parsed?.limitations),
    evidenceIds: stringArray(parsed?.evidenceIds, domainFindings.flatMap((finding) => finding.evidence.map((item) => item.id)).slice(0, 8)),
  };
}

function ctoFromOutput(output: string) {
  const parsed = safeJsonParse(output);
  return {
    ctoSummary: typeof parsed?.ctoSummary === "string" ? parsed.ctoSummary : output.slice(0, 1_200),
    verdictNarrative: typeof parsed?.verdictNarrative === "string" ? parsed.verdictNarrative : "The verdict is based only on the evidence collected in this audit run.",
    criticalBlockers: stringArray(parsed?.criticalBlockers),
    nextActions: stringArray(parsed?.nextActions),
    limitations: stringArray(parsed?.limitations),
  };
}

function makeProvider(config: Awaited<ReturnType<typeof resolveAiProviderConfig>>) {
  if (!config) return null;
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    timeout: 28_000,
    maxRetries: 0,
    defaultHeaders: config.id === "openrouter" ? {
      "HTTP-Referer": config.siteUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": config.title ?? "BuildProof",
    } : undefined,
  });

  return new OpenAIProvider({
    openAIClient: client,
    useResponses: false,
    strictFeatureValidation: false,
  });
}

async function runTextAgent(
  runner: Runner,
  agent: Agent,
  input: unknown,
) {
  const result = await runner.run(agent, JSON.stringify(input, null, 2), {
    maxTurns: 1,
    signal: AbortSignal.timeout(32_000),
  });
  return String(result.finalOutput ?? "");
}

export async function generateAgenticAuditReport(userId: string, audit: AuditRun): Promise<AgenticAuditReport> {
  const config = await resolveAiProviderConfig(userId);
  const modelProvider = makeProvider(config);
  if (!config || !modelProvider) {
    throw new Error("No saved or deployment AI model is configured. Add a model in AI Models before generating AI synthesis.");
  }

  const runner = new Runner({ modelProvider, tracingDisabled: true });
  const input = reportInput(audit);

  const specialistSections: AgenticAuditSection[] = [];
  for (const domain of auditDomains) {
    const domainFindings = getDomainFindings(audit.findings, domain.id);
    const agent = new Agent({
      name: `${domainTitles[domain.id]} Specialist`,
      model: config.model,
      modelSettings: {
        temperature: 0.18,
        maxTokens: 700,
        store: false,
      },
      instructions: [
        `You are BuildProof's ${domainTitles[domain.id]} specialist team.`,
        `Specialist perspectives: ${specialistAgents[domain.id].join(", ")}.`,
        "Use only the supplied audit evidence. Do not invent scans, browser sessions, vulnerabilities, files, or scores.",
        "If evidence is missing, write that as a limitation.",
        "Return only JSON with keys: title, score, summary, keySignals, recommendations, limitations, evidenceIds.",
      ].join("\n"),
    });
    const output = await runTextAgent(runner, agent, {
      domain: domain.id,
      domainTitle: domainTitles[domain.id],
      agents: specialistAgents[domain.id],
      project: input.project,
      domainScore: domainReadiness(domainFindings, domain.id),
      coverageLimits: input.coverageLimits,
      findings: domainFindings.map(compactFinding),
    });
    specialistSections.push(sectionFromOutput(domain.id, output, domainFindings));
  }

  const ctoAgent = new Agent({
    name: "Final CTO-Level Report Agent",
    model: config.model,
    modelSettings: {
      temperature: 0.18,
      maxTokens: 850,
      store: false,
    },
    instructions: [
      "You are BuildProof's final CTO-level report agent.",
      "Synthesize the specialist sections into a launch decision. Keep severity and confidence separate.",
      "Do not invent evidence. Every blocker or recommendation must trace to a supplied section or finding.",
      "Return only JSON with keys: ctoSummary, verdictNarrative, criticalBlockers, nextActions, limitations.",
    ].join("\n"),
  });

  const ctoOutput = await runTextAgent(runner, ctoAgent, {
    project: input.project,
    deterministicScore: input.score,
    deterministicVerdict: input.verdict,
    severityCounts: input.counts,
    coverageLimits: input.coverageLimits,
    specialistSections,
    topFindings: input.findings.slice(0, 12),
  });
  const cto = ctoFromOutput(ctoOutput);

  return {
    status: "generated",
    provider: config.id,
    model: config.model,
    source: config.source,
    connectionId: config.connectionId,
    generatedAt: new Date().toISOString(),
    promptVersion,
    evidenceCount: audit.findings.reduce((total, finding) => total + finding.evidence.length, 0),
    specialistSections,
    ...cto,
    limitations: [...new Set([...cto.limitations, ...input.coverageLimits])],
  };
}

export function skippedAgenticAuditReport(error: string, audit: AuditRun): AgenticAuditReport {
  return {
    status: "skipped",
    generatedAt: new Date().toISOString(),
    promptVersion,
    evidenceCount: audit.findings.reduce((total, finding) => total + finding.evidence.length, 0),
    specialistSections: [],
    ctoSummary: "AI synthesis has not been generated for this audit yet.",
    verdictNarrative: "The deterministic BuildProof report is still available. Add a saved AI model to generate specialist summaries and a CTO synthesis.",
    criticalBlockers: [],
    nextActions: ["Open AI Models, test a provider key, save it as default, then regenerate this report."],
    limitations: buildCoverageLimits(audit),
    error,
  };
}
