# BuildProof landing-page prototype lab

This directory is deliberately isolated from the BuildProof application. Nothing here is imported by the Next.js product, changes its routes, or depends on its runtime. These are three standalone HTML reference experiences intended to help select a visual and storytelling direction before any production landing-page work is integrated.

Open `index.html` in a browser, then choose a concept. Each concept uses only local HTML, CSS, JavaScript, inline SVG, and mock data. No credentials, network calls, analytics, or audit logic are present.

## Product in one sentence

**BuildProof is an AI-powered release-assurance platform that gives founders and engineering teams evidence-backed confidence that a web application is usable, reliable, secure, and ready to ship.**

It is not a generic chatbot, vulnerability scanner, or dashboard full of disconnected tools. A user connects a repository and a safe test target; BuildProof coordinates specialized audit agents, turns their findings into traceable evidence, and delivers a decision-ready report.

## The problem it solves

Modern B2B SaaS teams can ship quickly but often discover broken user journeys, fragile integrations, infrastructure risk, or security gaps late in the release process. Technical tools are fragmented: a product person sees usability problems, an engineer sees an API problem, a cloud reviewer sees a deployment problem, and a security specialist sees an authorization gap. The founder still needs one clear answer: **can we release, what must be fixed first, and why?**

BuildProof combines those perspectives into one governed audit. It should help teams move from intuition and scattered alerts to a defensible release decision.

## Target users

| User | Job to be done | What they need to see first |
| --- | --- | --- |
| Founder / product lead | Decide whether a release is safe and where to spend the next engineering cycle. | Health score, release verdict, blocked journeys, business impact, recommended priorities. |
| Engineering lead / CTO | Understand cross-system risk and turn it into a clear remediation plan. | Pillar scores, evidence, affected components, ownership, release gates. |
| QA / product engineer | Find incomplete flows and regressions before users do. | Reproduction steps, screenshots/trace evidence, flow coverage, severity. |
| Platform / cloud engineer | Validate runtime behavior, deployment readiness, data flow, and capacity risk. | API and database evidence, architecture observations, runbook/deployment signals. |
| Security engineer | Review only authorized assets and interpret findings responsibly. | Scope, authorization record, vulnerability evidence, remediation context, confidence. |

## Product inputs and consent model

The user starts an audit by providing only scoped, authorized inputs:

1. A GitHub repository URL or approved code connection.
2. An optional staging/test application URL.
3. Test credentials or an approved test account, when a journey requires authentication.
4. A selected audit profile and written confirmation that the user owns or is authorized to test the target.
5. Optional evidence sources such as deployment metadata, logs, or cloud configuration export.

BuildProof must show clear limitations at the point of connection: public code and a browser-visible target do not reveal every private service, secret, production configuration, or internal data path. It should say what it can inspect, what needs an explicit connection, and what it cannot responsibly infer.

## The ten-agent system

Internally the system uses ten specialized perspectives. The customer should never have to decipher ten unrelated products. The user-facing navigation groups them into five plain-language pillars while preserving the individual agents in the audit detail.

| # | Specialized agent | Primary responsibility | Visible pillar |
| --- | --- | --- | --- |
| 01 | Product Understanding Agent | Maps product intent, roles, journeys, dependencies, and critical release paths before testing begins. | Product Intelligence |
| 02 | UI/UX Testing Agent | Reviews information hierarchy, interaction clarity, visual states, accessibility cues, and usability friction. | Application Experience & Quality |
| 03 | Functional QA Agent | Executes approved user journeys, validates controls, forms, auth states, error paths, and regression behavior. | Application Experience & Quality |
| 04 | Performance Engineer Agent | Measures loading, rendering, runtime behavior, bottlenecks, and user-perceived performance. | Engineering Performance & Infrastructure |
| 05 | Backend + Cloud Engineer Agent | Reviews APIs, service boundaries, data flow, cloud architecture, reliability, and scalability evidence. | Engineering Performance & Infrastructure |
| 06 | Database Engineer Agent | Evaluates query/data-path signals, schema concerns, integrity, retention, backup, and performance evidence. | Engineering Performance & Infrastructure |
| 07 | Security Engineer Agent | Runs authorized security checks, reviews vulnerabilities, authn/authz boundaries, secrets exposure, and data protection. | Security & Reliability Intelligence |
| 08 | DevOps Engineer Agent | Reviews deployment readiness, CI/CD signals, environment separation, observability, rollback, and operational safeguards. | Engineering Performance & Infrastructure |
| 09 | AI Evaluation Agent | Conditional agent for applications with AI features: tests prompt boundaries, output quality, reliability, safety, and cost signals. | AI & Launch Readiness |
| 10 | Finance / CTO Agent | Synthesizes evidence into business impact, risk priority, cost implications, ownership, and a final release recommendation. | AI & Launch Readiness |

### The five visible pillars

1. **Product Intelligence** — understands the application before judging it. It creates the product map, inventory, roles, critical journeys, and audit scope.
2. **Application Experience & Quality** — combines UI/UX testing and Functional QA. It asks whether a real person can understand, complete, and trust the experience.
3. **Engineering Performance & Infrastructure** — combines performance, backend/cloud, database, and DevOps expertise. It examines data and request flow, runtime efficiency, resilience, deployment practice, and growth readiness. “Engineering & Scale” may be used as a shorter visual label only when space is limited.
4. **Security & Reliability Intelligence** — focuses the authorized Security Engineer review on controlled security posture, vulnerabilities, authentication and authorization, and data protection evidence.
5. **AI & Launch Readiness** — combines optional AI evaluation with Finance/CTO synthesis. It turns technical evidence into a responsible release decision, cost/risk picture, and action plan.

The final CTO-level report is a decision layer, not an eleventh scanner. It references evidence from every relevant agent and never invents a result where evidence is missing.

## End-to-end audit flow

1. **Connect & authorize** — User signs in, selects a repository, supplies an authorized staging URL, and confirms scope.
2. **Understand** — Product Understanding Agent builds a map of pages, components, roles, integrations, journeys, and high-risk surfaces.
3. **Plan** — BuildProof proposes an audit plan, shows coverage boundaries, and requests any missing safe test credentials or data sources.
4. **Inspect** — Specialist agents execute bounded browser, code, API, infrastructure, database, security, and optional AI checks.
5. **Corroborate** — Findings are de-duplicated and linked to screenshots, traces, test output, code locations, configuration references, or explicit gaps in evidence.
6. **Prioritize** — The Finance/CTO agent groups issues by severity, confidence, affected journey, release impact, remediation effort, and suggested owner.
7. **Decide & improve** — The user receives a release verdict, detailed report, remediation queue, and re-audit workflow after fixes land.

## The dashboard handoff

The landing page ends with a clear Register / Sign in CTA. Authentication should support normal email/password and Google OAuth when configured. On success the user lands in a guided dashboard rather than an empty analytics screen:

1. **Welcome / create audit** — repository URL, staging URL, scope consent, optional credentials.
2. **Audit setup** — selected pillars, exclusions, availability of cloud/API evidence, clear capability limits.
3. **Live audit workspace** — five pillar cards, activity/evidence stream, coverage progress, stateful running/completed/needs-input moments.
4. **Findings workspace** — filters by pillar, severity, status, owner, journey, and confidence; each finding opens to evidence and remediation.
5. **Report / release decision** — overall health, score breakdown, blockers, recommendations, report export/share, and re-audit.

For demos or first-run convenience, a clearly labeled demo account can show pre-populated sample data. It must never be presented as a real authentication mechanism in production.

## Evidence, score, and report model

### Sample audit data used by prototypes

The prototypes use non-live mock readings to make the interface concrete:

| Reading | Value | Meaning |
| --- | --- | --- |
| Application health | 78 / 100 | Overall weighted readiness reading, not a guarantee of security or correctness. |
| Product Intelligence | 92 | High confidence in the mapped product surface and release paths. |
| Experience & Quality | 81 | Mostly complete journeys; a few usability and functional concerns remain. |
| Engineering Performance & Infrastructure | 73 | Performance, service/data, and deployment observations need attention before growth. |
| Security & Reliability Intelligence | 68 | One high-priority authorization concern is present. |
| AI & Launch Readiness | 76 | Decision layer sees a conditional release path once blockers are resolved. |
| Evidence coverage | 82% | Share of intended scope represented by direct or corroborated evidence. |
| Critical paths | 12 | Sample count of user journeys prioritized for a launch. |
| Known blockers | 3 | Sample count of issues that could change the release decision. |

### Finding format

Every finding should include a plain-language title, severity, confidence, pillar and agent, affected journey/component, evidence links, impact, recommendation, suggested owner, status, and re-test state. Severity uses semantic colors only:

- **Pass / low concern** — green, not decorative.
- **Caution / medium** — amber, needs planned attention.
- **Hold / high or critical** — red, requires action before the stated release gate.

Scores should explain the inputs behind them. A score cannot substitute for evidence, coverage, or a human release decision.

### Example evidence thread

```
Journey: Invite teammate → accept invitation → first workspace visit
Agent: Functional QA Agent
Observed: invitation confirmation route returns an inconsistent state after a second refresh
Evidence: browser replay, request trace, affected component reference
Impact: new user may not reach an active workspace
Confidence: high
Recommendation: make acceptance idempotent and add a regression test for retry/reload
Suggested owner: Product Engineering
```

## Safety, limits, and trust requirements

BuildProof is an **authorized testing** system. It must not imply unrestricted penetration testing, secret harvesting, production attack simulation, or access beyond the customer’s explicit scope. Security features are bounded by approved targets, safe modes, rate limits, authentication, audit logs, and human review gates.

The product must clearly state:

- Results represent the configured scope and available evidence, not proof that every defect or vulnerability is absent.
- Repository-only inspection cannot validate hidden runtime systems, private cloud settings, or production data without an approved connection.
- Test credentials and connected data sources must be stored/protected using least privilege, encryption, scoped access, retention controls, and revocation.
- High-risk checks require clear authorization and should default to safe, non-destructive techniques.
- AI-generated interpretation must link back to concrete evidence and identify uncertainty or missing coverage.
- Auto-fix, when introduced, should only propose a patch or open a reviewable change; it must never silently alter production.

## Design brief shared by all concepts

### Desired feeling

Premium, calm, specific, and technically credible — as though an expert engineering team is inspecting a real application in real time. The site should feel cinematic and exploratory on desktop without becoming a generic neon “AI” dashboard, hacker cliché, or sci-fi decoration.

### Core visual language

- Dark, refined foundation; ink/graphite/near-black rather than pure black.
- Translucent panels with restrained blur, hairline borders, depth, and readable contrast.
- A cool signal tone only for active flow and selection; a warm accent for a rare highlight; semantic green/amber/red strictly for verdicts.
- Quiet sans display type with monospaced evidence/data type.
- 3D depth may be created with CSS, inline SVG, perspective, grids, maps, and layered panels. It should communicate product structure rather than exist as ornament.
- Use spacious desktop composition. Mobile can stack cleanly but is not the primary reference target.

### Motion and interaction principles

- Treat scroll as storytelling: application enters → experience review → engineering depth → security/reliability → report and release decision.
- Motion must have a purpose: reveal data, connect a cause to evidence, or show a state change.
- Do not use multiple competing metaphors for navigation. Each concept has one governing interaction model.
- Respect `prefers-reduced-motion`: all important content stays visible, no essential information depends on animation, and moving layers settle into a readable static layout.
- Keyboard focus, contrast, labeled buttons, semantic headings, and clear CTA destinations matter as much as the visual moment.

## Three concept directions

| Prototype | Storytelling mechanism | Personality | Best when |
| --- | --- | --- | --- |
| 01 — Evidence Observatory | A single vertical inspection beam passes through five evidence chambers. | Calm, editorial, precise, Apple-like product story. | The landing page should feel like a guided audit with a polished “one bold moment.” |
| 02 — Command Center | A live, desktop-style mission console lets the visitor switch audit lenses. | Confident, useful, operations-oriented. | The product must immediately show its working dashboard and buyer value. |
| 03 — Release Atlas | A spatial topology map transforms from app surface to release decision. | Architectural, exploratory, memorable. | The team wants a more original visual identity without generic cyber aesthetics. |

## Production implementation notes (not part of this prototype suite)

- Keep the production landing page as one cohesive scroll narrative. Avoid a second overlapping scroll system or duplicate “cinematic” module.
- Reuse the existing application’s theme/tokens where appropriate. Prototype styles are intentionally not imported.
- Prefer GSAP ScrollTrigger + Lenis only if motion is smooth and has a static/reduced-motion fallback; otherwise choose clean sticky or fade/slide behavior.
- The production 3D object should be driven by the same progress as the narrative, never compete with drag controls in the main story.
- Auth screens need the same visual language as the landing page but should use real provider integrations (email/password, Google OAuth), protected routes, error states, reset-password flow, and proper session handling.
- Real audit execution requires authenticated server routes, GitHub access, a database such as Supabase/PostgreSQL, scoped encrypted secrets, a job queue/worker layer, evidence storage, rate limiting, audit logs, and model-provider configuration. Do not expose any API key or token to the client.
