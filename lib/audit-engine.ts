import type {
  AuditCategory,
  AuditProgress,
  AuditRun,
  AuditStage,
  Finding,
  ReleaseVerdict,
  Severity,
} from "@/lib/types";
import { getDomainForFinding, type AuditDomainId } from "@/lib/audit-domains";

export const AUDIT_STAGES: AuditStage[] = [
  {
    id: "understand",
    label: "Map the application",
    shortLabel: "Understand",
    description: "Mapping product intent, routes, dependencies, permission boundaries, and the approved target.",
    activity: "Mapping the application and its approved audit surface.",
  },
  {
    id: "experience",
    label: "Analyze experience & quality",
    shortLabel: "Experience",
    description: "Replaying critical journeys, interface behavior, and accessibility with controlled test access.",
    activity: "Following the product through real customer journeys and interaction states.",
  },
  {
    id: "engineering",
    label: "Analyze engineering systems",
    shortLabel: "Engineering",
    description: "Tracing API behavior, performance, data flow, cloud posture, and delivery readiness.",
    activity: "Correlating user actions with APIs, data, infrastructure, and deployment signals.",
  },
  {
    id: "security",
    label: "Analyze security & reliability",
    shortLabel: "Security",
    description: "Reviewing authorization, data protection, safe vulnerability signals, and operational reliability evidence.",
    activity: "Explaining authorized security and reliability signals with evidence.",
  },
  {
    id: "report",
    label: "Assemble application health report",
    shortLabel: "Health report",
    description: "Combining expert readings, severity, proof, and recommendations into a decision-ready report.",
    activity: "Assembling a decision-ready application health report.",
  },
];

export const AUDIT_STAGE_MS = 5200;
export const AUDIT_TOTAL_MS = AUDIT_STAGES.length * AUDIT_STAGE_MS;

const severityPenalty: Record<Severity, number> = {
  critical: 18,
  high: 8,
  medium: 3,
  low: 1,
  info: 0,
};

export function getAuditProgress(run: AuditRun, now = Date.now()): AuditProgress {
  const elapsed = run.finishedAt
    ? AUDIT_TOTAL_MS
    : Math.max(0, now - new Date(run.startedAt).getTime());
  const progress = Math.min(100, Math.round((elapsed / AUDIT_TOTAL_MS) * 100));
  const isComplete = Boolean(run.finishedAt) || elapsed >= AUDIT_TOTAL_MS || run.status === "completed";
  const stageIndex = isComplete
    ? AUDIT_STAGES.length - 1
    : Math.min(AUDIT_STAGES.length - 1, Math.floor(elapsed / AUDIT_STAGE_MS));

  return {
    progress: isComplete ? 100 : progress,
    stageIndex,
    stage: AUDIT_STAGES[stageIndex],
    isComplete,
    visibleFindings: run.findings.filter((finding) => isComplete || finding.discoveredAtStage <= stageIndex),
  };
}

export function calculateReleaseScore(findings: Finding[]): number {
  const unresolved = findings.filter((finding) => finding.status !== "resolved" && finding.status !== "accepted");
  const penalty = unresolved.reduce((total, finding) => total + severityPenalty[finding.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function getReleaseVerdict(findings: Finding[]): ReleaseVerdict {
  const unresolved = findings.filter((finding) => finding.status !== "resolved" && finding.status !== "accepted");
  if (unresolved.some((finding) => finding.severity === "critical")) return "DO NOT SHIP";
  const score = calculateReleaseScore(findings);
  if (score < 78 || unresolved.some((finding) => finding.severity === "high")) return "READY WITH REVIEW";
  return "READY TO SHIP";
}

export function countBySeverity(findings: Finding[]) {
  return findings.reduce(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>,
  );
}

export function categoryReadiness(findings: Finding[], category: AuditCategory): number {
  const categoryFindings = findings.filter(
    (finding) => finding.category === category && finding.status !== "resolved" && finding.status !== "accepted",
  );
  if (!categoryFindings.length) return 96;
  const penalty = categoryFindings.reduce((total, finding) => total + severityPenalty[finding.severity], 0);
  return Math.max(38, Math.min(96, 100 - penalty * 2));
}

export function domainReadiness(findings: Finding[], domainId: AuditDomainId): number {
  const unresolved = findings.filter(
    (finding) => getDomainForFinding(finding).id === domainId && finding.status !== "resolved" && finding.status !== "accepted",
  );
  if (!unresolved.length) return 96;
  const domainPenalty: Record<Severity, number> = { critical: 35, high: 16, medium: 6, low: 2, info: 0 };
  const penalty = unresolved.reduce((total, finding) => total + domainPenalty[finding.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function severityLabel(severity: Severity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
