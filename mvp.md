# BuildProof MVP

## Product promise

BuildProof gives a founder or engineering team an evidence-backed answer to one release question:

> Is this application ready to ship, what was actually checked, and what needs human attention?

The first live audit combines a GitHub repository with a **verified staging URL**. BuildProof maps the product, runs safe evidence-producing checks, and turns the result into a clear release decision: **Ship, Review, or Hold**. It is an expert audit workspace, not a menu of disconnected scanners or a free-running AI agent.

## Five visible pillars

The dashboard, audit setup, landing story, and report use five understandable pillars. The detailed specialists run inside a pillar and appear only when a user opens its evidence; they are not ten competing navigation items.

| Visible pillar | Internal specialist work | User outcome |
| --- | --- | --- |
| **1. Product Intelligence** | Product Understanding Agent; repo/app discovery; framework, route, dependency, and risk-map discovery | What BuildProof understands about the app, its boundaries, and what will be checked |
| **2. Experience & Quality** | UI/UX Testing; Functional QA; user journeys; accessibility; frontend behavior | Whether people can use the product smoothly and complete its critical flows |
| **3. Engineering & Scale** | Performance; backend/API; cloud/config; database; DevOps/deployment; architecture | Whether the system is efficient, maintainable, and production-ready |
| **4. Security & Reliability** | Security engineering; authentication/authorization; dependency/configuration review; data-protection posture | What risks exist, their impact, and the safest next action |
| **5. AI & Launch Readiness** | AI Evaluation Agent when applicable; Finance/CTO readiness signals; cost/FinOps signals; release checklist; CTO-level report synthesis | Whether AI features, operating assumptions, evidence coverage, and release gates support launch |

The **CTO-level report is a decision layer**, not a sixth autonomous scanner. It combines verified evidence from all five pillars with deterministic release policy. AI writes concise explanations and recommendations; it does not invent evidence or override release gates.

## MVP user experience

### Cinematic public journey

The desktop landing page is one scroll-driven **Audit Assembly** story, not several overlapping animations:

1. **Understand** — a repository and verified application target assemble into a product map.
2. **Experience** — interfaces, journeys, interaction signals, and accessibility evidence become visible.
3. **Engineering** — APIs, database paths, performance, delivery configuration, and infrastructure relationships open around the product.
4. **Protect** — the model closes into identity, data, and reliability boundaries; risks resolve into evidence cards.
5. **Decide** — the five pillars lock into a release passport with coverage, risks, and a Ship / Review / Hold verdict.

Use one GSAP ScrollTrigger timeline with Lenis smoothing and one central React Three Fiber object. Readable copy, controls, and findings remain semantic HTML. Reduced-motion and no-WebGL users receive the same content as static, accessible panels. The header always exposes **Log in** and **Start an audit**; the end-of-story CTA opens registration.

### Auth and entry

1. A visitor registers or logs in with **Supabase email/password** or **Google OAuth**.
2. A successful session lands at the dashboard, not a generic profile page.
3. Local development may expose clearly labelled sample credentials through a local-only demo mode. Demo credentials must never be deployed, seeded into production, or grant access to real projects.
4. An authenticator app (TOTP MFA) is a later hardening feature; it is different from Google OAuth and is not required for the first MVP.

### First live audit

1. The user creates a project and supplies a GitHub repository URL plus a staging URL.
2. BuildProof verifies the staging target by requiring a short-lived project token at `/.well-known/buildproof-verification.txt`. It only accepts public HTTPS staging/preview hosts; localhost, private/link-local/metadata ranges, unsafe redirects, and production hosts are rejected in the MVP.
3. The user confirms ownership/authorization. Product Intelligence is mandatory; Experience, Engineering, and Security are selected by default; the AI Evaluation sub-check is conditional when no AI feature is discovered, while launch-readiness synthesis still runs.
4. Product Intelligence builds a target map: repository, immutable commit SHA, technology signals, reachable routes, dependencies, declared integrations, and audit limitations.
5. Safe specialists run through durable jobs and stream structured progress, coverage, and redacted evidence to the dashboard.
6. The report only seals when required jobs complete or explicitly report their limitation. Partial coverage is labelled **Incomplete** and cannot become Ship.

The UI must explicitly explain the limitation of a URL-only target: BuildProof can observe the live website, but it cannot inspect private source code, database contents, cloud accounts, or deployment configuration without the authorized repository/integration evidence.

## What the first live audit actually checks

| Pillar | First safe evidence path |
| --- | --- |
| Product Intelligence | GitHub metadata and shallow repository inspection; framework/config discovery; staging reachability; route and declared-product map |
| Experience & Quality | Playwright smoke journeys against allowed staging routes; screenshots and traces; axe-core accessibility baseline; frontend console/network failures |
| Engineering & Scale | Lighthouse snapshot; API/runtime/config review from source; dependency and migration/configuration analysis; Docker, CI, IaC, and deployment-readiness signals. No direct database or cloud-account access in the MVP. |
| Security & Reliability | Gitleaks, Semgrep, dependency vulnerability signals, passive TLS/header/cookie checks, and approved authentication-flow checks using a dedicated test account when supplied. No exploitation or destructive testing. |
| AI & Launch Readiness | Detect declared AI use; evaluate redacted prompts/outputs only when enabled; estimate code/config cost risks; calculate evidence coverage and produce the CTO release decision. It does not inspect customer model traffic, cloud bills, or financial systems. |

Each specialist returns a structured result: `status`, `coverage`, `observations`, `evidence IDs`, `limitations`, `confidence`, and normalized findings. Findings require an artifact such as a scanner result, source location, screenshot, trace, or sanitized request metadata. A model can group and explain evidence, but cannot create a finding without an artifact.

## Dashboard and report contract

The dashboard answers the release question within one screen:

- Current project, connected repository/commit, verified staging target, and audit status.
- Overall health and release decision, with a visible evidence-coverage percentage.
- Five pillar cards with score or **Evidence gathering**, active specialist jobs, severity counts, and a direct evidence link.
- A live audit timeline from target mapping through report synthesis.
- A clear limitations panel for unavailable repository, cloud, database, test-account, or AI evidence.

The detailed report preserves provenance: category, severity, confidence, evidence, why it matters, recommendation, owner, verification state, and report timestamp. It may export a release report only after its coverage and policy requirements are satisfied.

## Lean technical architecture

```text
Next.js public site + authenticated control plane
        |
        +-- Supabase Auth
        |     +-- email/password and Google OAuth
        |
        +-- Supabase PostgreSQL + Row Level Security
        |     +-- projects, targets, runs, jobs, events, findings, reports
        |     +-- pg-boss job queue (no Redis in MVP)
        |
        +-- Supabase Storage
        |     +-- private redacted screenshots, traces, and report artifacts
        |
        +-- isolated TypeScript audit runner
              +-- GitHub repo adapter
              +-- Playwright / axe / Lighthouse
              +-- static source and dependency scanners
              +-- evidence redaction and normalized result writer
        |
        +-- AI interpretation adapter
              +-- OpenRouter free router (primary)
              +-- Nebius or OpenAI (optional approved fallback)
```

Supabase provides the managed PostgreSQL database for the MVP; a separate PostgreSQL installation is unnecessary. `pg-boss` uses that PostgreSQL database for durable audit jobs, retries, cancellation, rate budgets, and status events. The worker is server-only, unprivileged, isolated from the Docker socket, and limited to the authorized GitHub and staging hosts.

## MVP data and access model

Use Supabase Auth identities and these tenant-scoped records:

- `profiles`, `organizations`, `memberships`, and `projects`
- `repository_connections`, `audit_targets`, `target_verifications`, and `audit_scopes`
- `audit_runs`, `agent_jobs`, immutable `audit_events`, and `artifacts`
- `findings`, `finding_evidence`, `fix_proposals`, `verification_runs`, and `release_reports`

Every tenant-owned row has `org_id`, timestamps, and Row Level Security. Browser clients use only the Supabase publishable key. Service-role credentials, encryption keys, repository tokens, AI keys, and runner credentials remain server-only. Storage objects are private and accessed through short-lived signed URLs after authorization.

## Integrations and environment contract

No real credential belongs in source control, Markdown, screenshots, client bundles, or browser storage. The local ignored `.env` contains values; `.env.example` contains names and empty placeholders only.

| Integration | MVP purpose | Required variables |
| --- | --- | --- |
| Supabase | Auth, PostgreSQL, RLS, private artifact storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SECRET_KEY` |
| GitHub prototype | Read repository metadata/content for the authorized audit | server-only `GITHUB_TOKEN`; use a fine-grained, read-only token with only the required repository access |
| OpenRouter | Primary low-cost AI routing for product understanding, evidence grouping, and report language | server-only `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| Nebius fallback | Optional model provider when explicitly configured | server-only `NEBIUS_API_KEY`, `NEBIUS_MODEL` |
| OpenAI fallback | Optional model provider when explicitly configured | server-only `OPENAI_API_KEY`, `OPENAI_MODEL` |
| Runner | Isolated audit execution and job callbacks | `AUDIT_RUNNER_URL`, `AUDIT_RUNNER_TOKEN`, `CREDENTIAL_ENCRYPTION_KEY` |
| Local demo | Presentation-only demo auth and fixture runs | `AUDIT_MODE=demo`, `DEMO_AUTH_ENABLED=true` locally only |

`AI_PROVIDER=openrouter` is the default. The application must route to Nebius or OpenAI only when that provider is explicitly configured and selected. Free-model availability changes; the selected model is configuration, not a hard-coded product guarantee. AI requests contain only minimized, redacted evidence and are logged as provider/model usage—not raw secrets or customer data.

The GitHub personal token is a temporary prototype integration. It stays server-only, is used only for the scoped audit, and must never be sent to the browser or stored in Markdown. Public repositories can run without a token. The production migration replaces it with a least-privilege GitHub App and short-lived installation tokens.

## Safety boundaries and known limitations

- Only audit systems the user owns or has explicit written authorization to test.
- First live audits target verified staging/preview environments, not production by default.
- No active penetration testing, exploit execution, credential attacks, destructive actions, arbitrary shell access, arbitrary network discovery, or automatic code changes.
- Database and cloud findings are source/configuration-based until a separately approved, read-only integration exists.
- Authenticated journey checks require dedicated test credentials supplied through a secure server-side mechanism; otherwise they are reported as unavailable, not passed.
- AI evaluation is optional, bounded, redacted, and cannot certify model safety or legal compliance.
- Scores are evidence/coverage-aware. Missing evidence lowers coverage and blocks a positive release verdict; a high-looking demo fixture never represents a live audit.
- Recommendations are drafts for human review. Fixes become code only through an approved human workflow and a linked verification run.

## Definition of a functional MVP

1. A user signs up with email/password or Google, creates a project, and sees only their organization’s data.
2. They connect a public or authorized GitHub repository, verify a staging URL, acknowledge scope, and start an audit.
3. A pg-boss job runs the approved safe checks, persists events and redacted artifacts, and survives a browser refresh.
4. The dashboard updates the five pillar states from real job evidence, never from fabricated success states.
5. The user drills into a finding, sees its provenance and limitation, and opens a report with a deterministic Ship / Review / Hold decision.
6. Demo mode remains isolated, visually labelled, and unavailable in production.

## Delivery order

1. Consolidate the landing into the one cinematic Audit Assembly and complete desktop interaction/visual regression coverage.
2. Implement Supabase auth, protected routes, email/password, Google OAuth, and local-only demo credentials.
3. Add Supabase migrations, RLS, Storage buckets, and authenticated project/audit mutations.
4. Implement `pg-boss`, runner contracts, auditable events, cancellation/time budgets, and secure artifact handling.
5. Build GitHub-token repository intake plus staging verification and the first safe five-pillar audit.
6. Add OpenRouter interpretation with Nebius/OpenAI optional fallbacks; keep deterministic scanner evidence authoritative.
7. Add launch policy, reports, full lifecycle tests, security hardening, and then migrate repository access to a GitHub App.
