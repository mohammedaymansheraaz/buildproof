/**
 * The narrative source for the public BuildProof audit film.
 *
 * These are illustrative product readings, not results from a live audit.
 * A real run should replace the evidence strings with collected evidence while
 * retaining this same execution order and information architecture.
 */

export type AgentId =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10";

export type FilmChapterId =
  | "product-intelligence"
  | "experience-quality"
  | "engineering-infrastructure"
  | "security-reliability"
  | "ai-launch-readiness";

export type AgentRailEntry = {
  id: AgentId;
  displayLabel: string;
  shortLabel: string;
  caption: string;
  optional?: boolean;
};

export type CinematicBeat = {
  id: string;
  agentIds: readonly AgentId[];
  eyebrow: string;
  title: string;
  body: string;
  metric: string;
  evidence: readonly string[];
  transition?: string;
};

export type CinematicChapter = {
  id: FilmChapterId;
  number: string;
  title: string;
  shortTitle: string;
  summary: string;
  agentIds: readonly AgentId[];
  beats: readonly CinematicBeat[];
};

/** The rail always reflects the real execution order, rather than category order. */
export const allAgents: readonly AgentRailEntry[] = [
  {
    id: "01",
    displayLabel: "Product Understanding Agent",
    shortLabel: "Product intelligence",
    caption: "scope map",
  },
  {
    id: "02",
    displayLabel: "UI/UX Testing Agent",
    shortLabel: "Experience reading",
    caption: "interface evidence",
  },
  {
    id: "03",
    displayLabel: "Functional QA Agent",
    shortLabel: "Journey replay",
    caption: "behavioural proof",
  },
  {
    id: "04",
    displayLabel: "Performance Engineer Agent",
    shortLabel: "Runtime trace",
    caption: "latency evidence",
  },
  {
    id: "05",
    displayLabel: "Backend + Cloud Engineer Agent",
    shortLabel: "Service topology",
    caption: "system path",
  },
  {
    id: "06",
    displayLabel: "Database Engineer Agent",
    shortLabel: "Data-path review",
    caption: "persistence evidence",
  },
  {
    id: "07",
    displayLabel: "Security Engineer Agent",
    shortLabel: "Security gate",
    caption: "risk validation",
  },
  {
    id: "08",
    displayLabel: "DevOps Engineer Agent",
    shortLabel: "Delivery verification",
    caption: "release operation",
  },
  {
    id: "09",
    displayLabel: "AI Evaluation Agent",
    shortLabel: "AI evaluation",
    caption: "optional model review",
    optional: true,
  },
  {
    id: "10",
    displayLabel: "Final CTO-Level Report",
    shortLabel: "Release verdict",
    caption: "decision record",
  },
] as const;

export const cinematicChapters: readonly CinematicChapter[] = [
  {
    id: "product-intelligence",
    number: "01",
    title: "Product Intelligence",
    shortTitle: "Understand the product before testing it.",
    summary:
      "The first agent establishes the system boundary, critical paths, roles, and trust assumptions that make the remaining checks meaningful.",
    agentIds: ["01"],
    beats: [
      {
        id: "scope-manifest",
        agentIds: ["01"],
        eyebrow: "01 · Product Understanding Agent",
        title: "The audit begins by drawing the boundary.",
        body:
          "BuildProof reads the approved repository, target environment, routes, and declared integrations. It records what can be observed before it makes a claim about what is safe.",
        metric: "Scope manifest · source, surface, environment",
        evidence: [
          "Repository and deployment target declared",
          "Public, authenticated, and privileged routes separated",
          "Third-party integration boundaries recorded",
        ],
        transition: "A test only means something when its surface is explicit.",
      },
      {
        id: "critical-path-map",
        agentIds: ["01"],
        eyebrow: "01 · Product Understanding Agent",
        title: "Then it finds the work that matters to a customer.",
        body:
          "The product map turns screens and endpoints into journeys: entry, identity, creation, payment, collaboration, recovery, and exit. High-consequence paths become the audit’s first queue.",
        metric: "Critical-path map · roles × journeys × trust boundaries",
        evidence: [
          "Actor and permission model sketched",
          "State-changing journeys marked for replay",
          "Sensitive data boundaries linked to their owners",
        ],
        transition: "The experience team now knows which promises the interface makes.",
      },
      {
        id: "audit-brief",
        agentIds: ["01"],
        eyebrow: "01 · Product Understanding Agent",
        title: "One shared brief aligns every specialist.",
        body:
          "Instead of ten disconnected scans, every following agent receives the same scope, risk assumptions, and evidence format. Findings can be traced back to a user outcome, not only a file or endpoint.",
        metric: "Audit brief · shared context, shared evidence standard",
        evidence: [
          "Journey priority and acceptance conditions prepared",
          "Known exclusions remain visible in the report",
          "Specialist handoffs preserve source context",
        ],
      },
    ],
  },
  {
    id: "experience-quality",
    number: "02",
    title: "Application Experience & Quality",
    shortTitle: "Watch the application behave like a real product.",
    summary:
      "The interface and functional agents read the same journey from two perspectives: what a person understands, and what the system actually completes.",
    agentIds: ["02", "03"],
    beats: [
      {
        id: "interface-reading",
        agentIds: ["02"],
        eyebrow: "02 · UI/UX Testing Agent",
        title: "First, the interface is read as a customer would read it.",
        body:
          "The agent inspects hierarchy, labels, focus states, feedback, contrast, and responsive behaviour. It asks whether the next action is clear before it asks whether the request succeeds.",
        metric: "Interface reading · hierarchy, state, accessibility",
        evidence: [
          "Interactive controls and visible labels paired",
          "Keyboard focus and error recovery observed",
          "Viewport changes compared against the intended flow",
        ],
        transition: "A clear screen still has to complete the promise it makes.",
      },
      {
        id: "journey-replay",
        agentIds: ["03"],
        eyebrow: "03 · Functional QA Agent",
        title: "Then the promise is replayed, step by step.",
        body:
          "Functional QA follows the mapped journeys through happy paths, cancellation, retry, invalid input, and state recovery. Browser actions, requests, and resulting application state stay connected as one trace.",
        metric: "Journey replay · action → request → resulting state",
        evidence: [
          "Critical path replayed with visible checkpoints",
          "Invalid and interrupted states retained as evidence",
          "Observed behaviour linked to the initiating control",
        ],
        transition: "The trace now travels beneath the browser, into runtime and services.",
      },
      {
        id: "experience-evidence",
        agentIds: ["02", "03"],
        eyebrow: "02–03 · Experience evidence",
        title: "A finding is more than a screenshot.",
        body:
          "Each issue carries the moment a person encountered it, the action that triggered it, and the system response. That makes a usability concern actionable for product, design, and engineering at once.",
        metric: "Evidence thread · screen, step, request, outcome",
        evidence: [
          "Reproducible sequence captured",
          "Affected role and route identified",
          "Severity based on consequence, not decoration",
        ],
      },
    ],
  },
  {
    id: "engineering-infrastructure",
    number: "03",
    title: "Engineering Performance & Infrastructure",
    shortTitle: "Follow one interaction through every system that carries it.",
    summary:
      "Runtime, service, data, and release-readiness evidence form one engineering story. DevOps belongs to this discipline, while its formal delivery verification runs after the security gate.",
    agentIds: ["04", "05", "06", "08"],
    beats: [
      {
        id: "runtime-trace",
        agentIds: ["04"],
        eyebrow: "04 · Performance Engineer Agent",
        title: "A customer action becomes a runtime trace.",
        body:
          "The performance agent measures the path from navigation and rendering to interaction, request, and response. It separates browser work, network wait, and server time so slow feels become explainable.",
        metric: "Runtime trace · LCP, INP, CLS, long tasks",
        evidence: [
          "Navigation and interaction timings captured",
          "Long browser tasks isolated from network wait",
          "Hot paths selected for service-level follow-up",
        ],
        transition: "The request leaves the browser; now the system topology takes over.",
      },
      {
        id: "service-topology",
        agentIds: ["05"],
        eyebrow: "05 · Backend + Cloud Engineer Agent",
        title: "The trace crosses the service boundary.",
        body:
          "Backend and cloud analysis follows the same request through API routes, workers, queues, storage, and external dependencies. It makes ownership, retries, timeouts, and failure boundaries visible.",
        metric: "Service topology · browser → API → worker → dependency",
        evidence: [
          "Request path and service owners connected",
          "Timeout, retry, and failure behaviour reviewed",
          "Runtime configuration boundary identified",
        ],
        transition: "Every service decision eventually becomes a data decision.",
      },
      {
        id: "data-path-review",
        agentIds: ["06"],
        eyebrow: "06 · Database Engineer Agent",
        title: "The data path is inspected where it persists.",
        body:
          "The database agent traces reads, writes, migrations, indexes, retention, and recovery through the critical journey. It looks for contention, missing constraints, unsafe access patterns, and growth limits.",
        metric: "Data-path review · write → query → retention → recovery",
        evidence: [
          "Read and write paths linked to user journeys",
          "Schema constraints and migration safety reviewed",
          "Query shape and capacity risks marked for owners",
        ],
        transition: "The engineering picture is complete enough to prepare a release operation.",
      },
      {
        id: "release-operation-plan",
        agentIds: ["08"],
        eyebrow: "08 · DevOps Engineer Agent · engineering capability",
        title: "Delivery is planned before it is cleared.",
        body:
          "DevOps turns the trace into an operational plan: build, environment, migration, smoke check, observation, and rollback. The plan belongs to Engineering; its formal delivery verification waits for Security Agent 07 to complete the gate.",
        metric: "Release operation · build → migrate → smoke → observe → rollback",
        evidence: [
          "Environment separation and deploy inputs enumerated",
          "Migration and rollback paths prepared",
          "Release telemetry and ownership expectations defined",
        ],
      },
    ],
  },
  {
    id: "security-reliability",
    number: "04",
    title: "Security & Reliability Intelligence",
    shortTitle: "Prove the release can be trusted before it is delivered.",
    summary:
      "Security first validates the risk boundary. Only then does DevOps perform the ordered delivery verification that confirms the release can be operated safely.",
    agentIds: ["07", "08"],
    beats: [
      {
        id: "security-surface",
        agentIds: ["07"],
        eyebrow: "07 · Security Engineer Agent",
        title: "The security gate starts with the real attack surface.",
        body:
          "The security agent checks authentication, authorization, exposed inputs, secrets, data handling, and dependency boundaries against the product map. It distinguishes observed evidence from assumptions and ranks risk by consequence.",
        metric: "Security gate · identity, access, input, data, dependencies",
        evidence: [
          "Role boundaries tested against protected actions",
          "Sensitive paths reviewed for exposure and validation",
          "Findings retain reproducible evidence and confidence",
        ],
        transition: "Once the risk boundary is understood, delivery can be verified in the right order.",
      },
      {
        id: "security-decision",
        agentIds: ["07"],
        eyebrow: "07 · Security Engineer Agent",
        title: "The gate makes risk legible, not sensational.",
        body:
          "A hold is tied to an affected path, a realistic impact, and a remediation owner. Passing checks are also recorded, so the release decision reflects the full evidence set rather than an unranked list of alerts.",
        metric: "Risk decision · finding × confidence × release consequence",
        evidence: [
          "Severity and confidence kept separate",
          "Exploitability tied to the scoped environment",
          "Remediation path and re-check condition recorded",
        ],
        transition: "Security clears the conditions for the delivery verification.",
      },
      {
        id: "delivery-verification",
        agentIds: ["08"],
        eyebrow: "08 · DevOps Engineer Agent · ordered execution",
        title: "Now delivery verification can confirm the release operation.",
        body:
          "After Security Agent 07 completes its gate, DevOps verifies the operational evidence: CI inputs, environment separation, secret handling, migration sequencing, smoke checks, telemetry, and rollback readiness.",
        metric: "Delivery verification · CI → environment → deploy → observe → rollback",
        evidence: [
          "Release inputs checked against approved environments",
          "Migration, smoke test, and rollback evidence connected",
          "Observability and incident ownership available at release",
        ],
      },
    ],
  },
  {
    id: "ai-launch-readiness",
    number: "05",
    title: "AI & Launch Readiness",
    shortTitle: "Turn technical evidence into a decision the team can act on.",
    summary:
      "AI evaluation activates only when the application uses AI. The CTO-level report then joins every specialist’s evidence into a clear release recommendation.",
    agentIds: ["09", "10"],
    beats: [
      {
        id: "ai-applicability",
        agentIds: ["09"],
        eyebrow: "09 · AI Evaluation Agent · optional",
        title: "If the product uses AI, its behaviour becomes part of the audit.",
        body:
          "The AI evaluation agent is intentionally conditional. When an AI feature exists, it reviews task quality, failure handling, data exposure, guardrails, latency, and cost signals without claiming coverage where there is no model surface.",
        metric: "AI evaluation · quality, safety, latency, cost",
        evidence: [
          "Model-facing journeys identified only when present",
          "Prompt, output, and fallback behaviour tied to user impact",
          "Evaluation coverage and exclusions made explicit",
        ],
        transition: "Every specialist has now contributed an evidence thread.",
      },
      {
        id: "evidence-assembly",
        agentIds: ["10"],
        eyebrow: "10 · Final CTO-Level Report",
        title: "The evidence converges into one release view.",
        body:
          "The report groups results by outcome: experience, engineering, security, and delivery. It keeps the links to the underlying trace, but puts owners, priority, and release effect first.",
        metric: "Decision record · evidence → owner → action → release effect",
        evidence: [
          "Findings grouped by shared customer consequence",
          "Duplicate symptoms consolidated into root paths",
          "Owners and re-audit conditions visible together",
        ],
        transition: "The conclusion is a decision with evidence behind it.",
      },
      {
        id: "release-verdict",
        agentIds: ["10"],
        eyebrow: "10 · Final CTO-Level Report",
        title: "A release verdict tells the team what happens next.",
        body:
          "BuildProof can recommend release, conditional release, or hold. The verdict is never a decorative score: it carries the unresolved risks, the work required to change the decision, and the proof needed for a re-check.",
        metric: "Release verdict · release / conditional / hold",
        evidence: [
          "Overall health and category scores explained",
          "Blocking conditions and next owners listed",
          "Re-audit path defined before the release window",
        ],
      },
    ],
  },
] as const;
