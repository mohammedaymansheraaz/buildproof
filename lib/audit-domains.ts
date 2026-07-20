import type { AuditCategory, Finding } from "@/lib/types";

export const auditDomainIds = ["experience", "engineering", "security"] as const;

export type AuditDomainId = (typeof auditDomainIds)[number];

export type AuditDomain = {
  id: AuditDomainId;
  number: string;
  label: string;
  shortLabel: string;
  description: string;
  outcomes: string[];
  agents: string[];
  categories: AuditCategory[];
};

/**
 * The only audit taxonomy exposed at product level. Low-level checks remain
 * useful for evidence and runner orchestration, but users should reason about
 * the expert team and its outcome—not a catalog of technical tools.
 */
export const auditDomains: AuditDomain[] = [
  {
    id: "experience",
    number: "01",
    label: "Application Experience & Quality",
    shortLabel: "Experience quality",
    description: "Evaluates the app as a real user would: journeys, interactions, behavior, and inclusive access.",
    outcomes: ["Complete journeys", "Usable interfaces", "Accessible behavior"],
    agents: ["Journey analyst", "UI behavior specialist", "Accessibility reviewer", "Frontend quality agent"],
    categories: ["functional", "accessibility"],
  },
  {
    id: "engineering",
    number: "02",
    label: "Engineering Performance & Infrastructure",
    shortLabel: "Engineering health",
    description: "Follows requests through APIs, services, data, and delivery systems to judge production readiness.",
    outcomes: ["Efficient systems", "Reliable data flow", "Scalable delivery"],
    agents: ["Performance engineer", "Backend analyst", "Cloud architect", "Data and deployment reviewer"],
    categories: ["api", "cloud", "performance", "code"],
  },
  {
    id: "security",
    number: "03",
    label: "Security & Reliability Intelligence",
    shortLabel: "Security intelligence",
    description: "Connects authorization, data protection, vulnerability signals, and reliability safeguards into explainable risk.",
    outcomes: ["Protected data", "Reliable access", "Explained risk"],
    agents: ["Security assessor", "Identity reviewer", "Data protection analyst", "Reliability investigator"],
    categories: ["security"],
  },
];

/** Index at which each team has enough evidence to produce a reading in the current audit path. */
export const auditDomainStageIndex: Record<AuditDomainId, number> = {
  experience: 1,
  engineering: 2,
  security: 3,
};

export function getAuditDomain(domainId: AuditDomainId) {
  return auditDomains.find((domain) => domain.id === domainId) ?? auditDomains[0];
}

export function getDomainForCategory(category: AuditCategory): AuditDomain {
  return auditDomains.find((domain) => domain.categories.includes(category)) ?? auditDomains[1];
}

export function getDomainForFinding(finding: Finding): AuditDomain {
  return finding.primaryDomain ? getAuditDomain(finding.primaryDomain) : getDomainForCategory(finding.category);
}

export function getDomainFindings(findings: Finding[], domainId: AuditDomainId) {
  return findings.filter((finding) => getDomainForFinding(finding).id === domainId);
}
