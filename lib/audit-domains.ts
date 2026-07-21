import { auditDomainIds } from "@/lib/types";
import type { AuditCategory, AuditDomainId, Finding } from "@/lib/types";

export { auditDomainIds };
export type { AuditDomainId };

export type AuditDomain = {
  id: AuditDomainId;
  number: string;
  label: string;
  shortLabel: string;
  description: string;
  outcomes: string[];
  agents: string[];
  categories: AuditCategory[];
  tone: "blue" | "sage" | "copper" | "rose";
  conditional?: boolean;
};

/**
 * The only audit taxonomy exposed at product level. Low-level checks remain
 * useful for evidence and runner orchestration, but users should reason about
 * the expert team and its outcome—not a catalog of technical tools.
 */
export const auditDomains: AuditDomain[] = [
  {
    id: "product",
    number: "01",
    label: "Product Intelligence",
    shortLabel: "Product intelligence",
    description: "Understands what the application promises, who it serves, and which journeys and boundaries deserve evidence.",
    outcomes: ["Mapped intent", "Approved surface", "Critical journeys"],
    agents: ["Product understanding agent", "Target-map analyst", "Journey planner"],
    categories: ["product"],
    tone: "blue",
  },
  {
    id: "experience",
    number: "02",
    label: "Application Experience & Quality",
    shortLabel: "Experience quality",
    description: "Evaluates the app as a real user would: journeys, interactions, behavior, and inclusive access.",
    outcomes: ["Complete journeys", "Usable interfaces", "Accessible behavior"],
    agents: ["UI/UX testing agent", "Functional QA agent", "Accessibility reviewer", "Frontend behavior analyst"],
    categories: ["functional", "accessibility"],
    tone: "sage",
  },
  {
    id: "engineering",
    number: "03",
    label: "Engineering & Scale",
    shortLabel: "Engineering & scale",
    description: "Follows requests through APIs, services, data, and delivery systems to judge production readiness.",
    outcomes: ["Efficient systems", "Reliable data flow", "Scalable delivery"],
    agents: ["Performance engineering agent", "Backend + cloud engineering agent", "Database engineering agent", "DevOps engineering agent", "Code architecture analyst"],
    categories: ["api", "cloud", "performance", "code", "database", "devops"],
    tone: "copper",
  },
  {
    id: "security",
    number: "04",
    label: "Security & Reliability Intelligence",
    shortLabel: "Security intelligence",
    description: "Connects authorization, data protection, vulnerability signals, and reliability safeguards into explainable risk.",
    outcomes: ["Protected data", "Reliable access", "Explained risk"],
    agents: ["Security engineering agent", "Identity reviewer", "Data protection analyst", "Reliability investigator"],
    categories: ["security"],
    tone: "rose",
  },
  {
    id: "ai-launch",
    number: "05",
    label: "AI & Launch Readiness",
    shortLabel: "AI & launch readiness",
    description: "Checks AI-specific behavior when present, then turns verified evidence, cost, and risk into a CTO-level launch decision.",
    outcomes: ["Conditional AI evaluation", "Cost-aware tradeoffs", "Decision-ready launch brief"],
    agents: ["AI evaluation agent", "Finance / CTO agent", "Launch decision synthesizer", "Cost optimization analyst"],
    categories: ["ai", "launch"],
    tone: "blue",
    conditional: true,
  },
];

/** Capabilities that cannot be evidenced from a staging URL alone. */
export const repositoryRequiredCategories: AuditCategory[] = ["code", "cloud", "database", "devops"];

export function domainRequiresRepository(domainId: AuditDomainId) {
  return getAuditDomain(domainId).categories.some((category) => repositoryRequiredCategories.includes(category));
}

/** Index at which each team has enough evidence to produce a reading in the current audit path. */
export const auditDomainStageIndex: Record<AuditDomainId, number> = {
  product: 0,
  experience: 1,
  engineering: 2,
  security: 3,
  "ai-launch": 4,
};

export function getAuditDomain(domainId: AuditDomainId) {
  return auditDomains.find((domain) => domain.id === domainId) ?? auditDomains[0];
}

export function getDomainForCategory(category: AuditCategory): AuditDomain {
  return auditDomains.find((domain) => domain.categories.includes(category)) ?? getAuditDomain("engineering");
}

export function getDomainForFinding(finding: Finding): AuditDomain {
  return finding.primaryDomain ? getAuditDomain(finding.primaryDomain) : getDomainForCategory(finding.category);
}

export function getDomainFindings(findings: Finding[], domainId: AuditDomainId) {
  return findings.filter((finding) => getDomainForFinding(finding).id === domainId);
}
