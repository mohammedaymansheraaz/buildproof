export const auditCategories = [
  "product",
  "functional",
  "security",
  "cloud",
  "api",
  "accessibility",
  "performance",
  "code",
  "database",
  "devops",
  "ai",
  "launch",
] as const;

export type AuditCategory = (typeof auditCategories)[number];

/**
 * The concise, user-facing audit taxonomy. Categories remain the internal
 * capabilities and evidence sources; domains are the expert teams users see.
 */
export const auditDomainIds = ["product", "experience", "engineering", "security", "ai-launch"] as const;
export type AuditDomainId = (typeof auditDomainIds)[number];

export const severities = ["critical", "high", "medium", "low", "info"] as const;
export type Severity = (typeof severities)[number];

export type FindingStatus = "open" | "resolved" | "accepted" | "needs_review";
export type AuditStatus = "queued" | "running" | "completed" | "cancelled";
export type ReleaseVerdict = "DO NOT SHIP" | "READY WITH REVIEW" | "READY TO SHIP";
export type EvidenceKind = "browser" | "network" | "code" | "config" | "trace";

export type AuditModule = {
  id: AuditCategory;
  label: string;
  description: string;
  icon: string;
};

export type TestPlanItem = {
  id: string;
  title: string;
  detail: string;
  category: AuditCategory;
  selected: boolean;
};

export type Evidence = {
  id: string;
  kind: EvidenceKind;
  title: string;
  source: string;
  capturedAt: string;
  description: string;
  payload?: string;
};

export type Finding = {
  id: string;
  auditRunId: string;
  /** Product-level audit team responsible for this signal. `category` remains the underlying capability/source. */
  primaryDomain?: AuditDomainId;
  category: AuditCategory;
  severity: Severity;
  confidence: "high" | "medium" | "low";
  status: FindingStatus;
  title: string;
  summary: string;
  impact: string;
  affectedArea: string;
  affectedFiles: string[];
  reproductionSteps: string[];
  recommendation: string;
  evidence: Evidence[];
  /** This signal relies on approved private repository or integration access. */
  requiresRepository?: boolean;
  autoFixEligible: boolean;
  discoveredAtStage: number;
};

export type AuditRun = {
  id: string;
  projectName: string;
  repositoryUrl: string;
  branch: string;
  stagingUrl: string;
  environment: "staging" | "preview" | "production";
  productIntent: string;
  testAccount?: string;
  selectedModules: AuditCategory[];
  plan: TestPlanItem[];
  findings: Finding[];
  createdAt: string;
  startedAt: string;
  finishedAt?: string;
  status: AuditStatus;
  isVerification?: boolean;
  report?: AuditReport;
};

export type AuditReport = {
  id: string;
  verdict: "ship" | "review" | "hold" | "incomplete";
  overallScore: number | null;
  generatedAt: string | null;
  report: {
    title?: string;
    generatedFrom?: string;
    verdict?: ReleaseVerdict;
    score?: number;
    blockerCount?: number;
    coverageLimits?: string[];
    aiSynthesis?: AgenticAuditReport;
    [key: string]: unknown;
  };
};

export type AgenticAuditSection = {
  domain: AuditDomainId;
  title: string;
  agents: string[];
  score: number;
  summary: string;
  keySignals: string[];
  recommendations: string[];
  limitations: string[];
  evidenceIds: string[];
};

export type AgenticAuditReport = {
  status: "generated" | "skipped" | "failed";
  provider?: string;
  model?: string;
  source?: "user" | "deployment";
  connectionId?: string;
  generatedAt: string;
  promptVersion: string;
  evidenceCount: number;
  specialistSections: AgenticAuditSection[];
  ctoSummary: string;
  verdictNarrative: string;
  criticalBlockers: string[];
  nextActions: string[];
  limitations: string[];
  error?: string;
};

export type AuditDraft = {
  projectName: string;
  repositoryUrl: string;
  branch: string;
  stagingUrl: string;
  environment: "staging" | "preview" | "production";
  productIntent: string;
  testAccount: string;
  selectedModules: AuditCategory[];
};

export type AuditStage = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  activity: string;
};

export type AuditProgress = {
  progress: number;
  stageIndex: number;
  stage: AuditStage;
  isComplete: boolean;
  visibleFindings: Finding[];
};
