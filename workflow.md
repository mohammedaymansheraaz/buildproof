# BuildProof — Implementation Workflow

## Product intent

BuildProof is an evidence-backed release-assurance workspace for software teams. It connects product intent, repository context, browser behavior, cloud readiness, safe security posture, and release evidence into a decision: **ship, review, or hold**.

The current build is a polished, fully interactive local demo with implemented Supabase authentication and a base Supabase persistence migration. It is deliberately not presented as a live penetration-testing service until its server-side audit authorization, durable runner, and isolated execution controls exist.

The first shippable scope is defined in `mvp.md`. The UI theme contract is defined in `design-theme.md`.

## Non-negotiable product rules

- Audit only systems the customer owns or is explicitly authorized to test.
- Keep active security tests disabled by default; never run destructive or exploit-oriented checks from the web application.
- Never expose private credentials, repository tokens, or cloud secrets in the browser, source code, Markdown, screenshots, or commits.
- Every finding must carry severity, confidence, redacted evidence, a clear next action, and a human-review path.
- A release can only be marked ready when its evidence is complete; incomplete work is **in progress** or **unknown**, never a positive verdict.
- The interface should feel like a precise, premium engineering instrument—not a generic AI chat product.

## Product experience model

BuildProof presents one application audit through five user-facing pillars. The named specialists remain available as evidence provenance and runner capabilities, but the user never has to choose between ten competing tools.

1. **Product Intelligence** — Product Understanding Agent, repository/app discovery, target verification, architecture signals, and scope/limitation mapping.
2. **Experience & Quality** — UI/UX testing, functional QA, critical user journeys, accessibility, and frontend behavior.
3. **Engineering & Scale** — performance, backend/API, cloud/configuration, database, DevOps/deployment, and code-architecture readiness.
4. **Security & Reliability** — security engineering, authentication/authorization, data protection, dependency/configuration posture, and safe vulnerability signals.
5. **AI & Launch Readiness** — conditional AI Evaluation Agent, Finance/CTO readiness and cost/FinOps signals, evidence coverage, launch checklist, and CTO-level release synthesis.

The CTO report is a deterministic evidence-and-policy layer inside AI & Launch Readiness, not a sixth scanner or a free-running agent. A model may summarize and prioritize verified evidence; it cannot create a finding without an artifact or override a release gate.

The desktop public experience is one cinematic **Audit Assembly** story, controlled by one scroll timeline:

1. Understand: repository and verified application target assemble into a product map.
2. Experience: interactions, journeys, and accessibility signals become visible.
3. Engineering: APIs, data, performance, and delivery systems open around the product.
4. Protect: security and reliability boundaries reveal risk evidence.
5. Decide: the five pillars form an evidence-coverage-aware release passport.

The `CinematicAuditCore` is progressive enhancement: capable desktop browsers receive a draggable WebGL model and scroll-linked state transitions; reduced-motion, compact, and non-WebGL environments receive the same semantic content as static CSS panels. Do not add a second scroll story or another competing scroll controller.

## Credential handling

- Put secrets only in the ignored `.env` file or a deployment secret manager.
- Never paste a GitHub, OpenRouter, Nebius, OpenAI, Supabase, database, cloud, or runner credential into this file.
- The prototype may use a fine-grained, read-only `GITHUB_TOKEN` on the server for an explicitly scoped repository audit. It must never reach the browser, source code, markdown, logs, screenshots, or client storage.
- Public repositories do not require a token. For a private repository, use a user-authorized fine-grained token only for the requested audit and delete it after use unless a future encrypted connection flow is implemented.
- Migrate repository access to a least-privilege GitHub App with short-lived installation tokens before production multi-tenant use.
- Default AI routing to OpenRouter; Nebius and OpenAI are optional server-side fallbacks selected only by explicit configuration.
- If a credential is ever pasted into a document or commit, revoke/rotate it immediately before continuing.

## Delivery checklist

### 1. Foundation

- [x] Set up the Next.js + TypeScript application.
- [x] Add global design tokens, accessible typography, responsive behavior, and visible keyboard focus.
- [x] Add `.env` and `.env.example` with safe placeholders and integration notes.
- [x] Create typed domain models for audits, plans, findings, evidence, fixes, and verdicts.

### 2. Local product workflow

- [x] Release Lens dashboard with release posture, active audits, risk trend, and recent findings.
- [x] Fix the collapsed navigation rail so every icon remains visible, labelled, and keyboard-addressable.
- [x] Turn the dashboard lens into an interactive WebGL release assembly with selectable evidence surfaces; retain a CSS/reduced-motion fallback.
- [x] Make the dashboard decision and full-card next actions unambiguous, and verify the result in desktop and mobile Chromium.
- [x] Reframe dashboard, scope wizard, findings, live audit, and reports around the five MVP pillars without exposing ten separate tools.
- [x] Add a desktop-first cinematic audit core with WebGL/CSS progressive enhancement, selectable expert disciplines, and scroll-linked story chapters.
- [x] Consolidate the landing into one five-stage Audit Assembly sequence; remove duplicate/competing scroll narratives and make the final CTA lead into registration.
- [x] Replace flat dashboard surface bars with five-pillar health, specialist perspectives, recommendations, evidence counts, limitations, and real filtered evidence links.
- [x] Update the scope wizard, live audit path, findings query filter, and report summary to use the same five-pillar mental model.
- [x] Add a founder-facing MVP scope document and a shared Evidence Glass design theme.
- [x] New Audit wizard for source, product intent, scope, and review/launch.
- [x] Generated test charter with editable workflow checks.
- [x] Live audit screen with job progression, trace-style activity, and evidence cards.
- [x] Findings workspace, Fix Center, verification state, and release report.
- [x] Deterministic local demo data so the competition presentation has a coherent end-to-end story.

### 3. Public product surface and authentication

- [x] Replace the root dashboard with a public BuildProof landing page.
- [x] Build the landing page as an audit journey with a persistent Login/Register path.
- [x] Add a GSAP ScrollTrigger + Lenis desktop sequence with a static, reduced-motion/mobile fallback.
- [x] Add a persistent glass header, Register/Login calls-to-action, proof, safety model, and final CTA.
- [x] Replace the temporary Clerk boundary with Supabase Auth plus the Supabase PostgreSQL foundation.
- [x] Implement Supabase email/password and Google OAuth flows, `/auth/callback`, styled registration/sign-in, password reset, session refresh, and proxy-protected routes.
- [x] Add local-only, visibly labelled demo credentials behind `AUDIT_MODE=demo` and `DEMO_AUTH_ENABLED=true`; exclude them completely from deployed environments.
- [ ] Configure the production Supabase project, Google OAuth provider, redirect URLs, and deployed environment variables; validate a real provider round trip.
- [ ] Add Supabase TOTP MFA later for an authenticator app. This is distinct from Google OAuth.

### 4. Production control plane — required before real audits

- [ ] Make `AUDIT_MODE` authoritative server-side. Demo mode must reject all real job creation.
- [ ] Require a signed-in user, organization membership, role authorization, project ownership, and a server-side scope record for every mutation.
- [ ] Make the first live audit require a GitHub repository plus a verified staging target. Verify a short-lived token at `/.well-known/buildproof-verification.txt` before queuing a run.
- [ ] Validate audit targets: public HTTPS verified host only; block localhost, private/link-local/metadata IPs, unsafe redirects, DNS rebinding, and production hosts by default.
- [ ] Require a separate owner-approved production policy with an expiry, test-account reference, module list, and rate budget.
- [ ] Replace browser `localStorage` state with server-owned data and immutable event records.
- [ ] Ensure reports cannot seal or export an in-progress audit as a release passport.

### 5. PostgreSQL and durable jobs

- [x] Add the initial Supabase PostgreSQL foundation migration and Supabase client/service boundary. The browser uses only the publishable key; privileged access stays in server/runner environments.
- [ ] Model `profiles`, `organizations`, `memberships`, `projects`, `repository_connections`, `audit_targets`, `target_verifications`, `audit_scopes`, `audit_runs`, `agent_jobs`, immutable `audit_events`, `findings`, `finding_evidence`, `artifacts`, `fix_proposals`, `verification_runs`, `release_reports`, and integration metadata.
- [ ] Put `org_id` on every tenant-owned row, add tenant-scoped indexes and foreign keys, and enforce server-side state transitions.
- [ ] Use idempotency keys plus a transactional outbox when an audit is created.
- [ ] Use `pg-boss` on Supabase PostgreSQL for durable jobs, retries, pause/cancel/resume, budgets, and status events; do not add Redis in the lean MVP.
- [ ] Store screenshots, traces, and report artifacts in private Supabase Storage; PostgreSQL stores redacted metadata and object keys.

### 6. Isolated audit runners

- [ ] Separate the control plane from disposable, no-root runner containers.
- [ ] Use adapters for Product Intelligence, Playwright browser QA, axe accessibility, Lighthouse performance, repository/source/dependency analysis, safe security baseline, conditional AI evaluation, and evidence generation.
- [ ] In the first live audit, treat cloud/database readiness as source/configuration evidence only; do not connect directly to cloud accounts or databases.
- [ ] Never mount the Docker socket or give an LLM arbitrary shell/network access.
- [ ] Redact cookies, headers, secrets, and personal data before logs, storage, exports, or model calls.
- [ ] Publish structured JSON/SARIF reports, canonical finding fingerprints, and evidence replay links.
- [ ] Offer fixes only as human-approved drafts/PRs followed by a linked verification run.

### 7. Quality bar

- [x] Run TypeScript, ESLint, and a production build for the current public/auth pass.
- [x] Inspect landing-page desktop, mobile, static fallback, and pinned motion states in a real browser.
- [ ] Add Playwright/Vitest coverage for tenant isolation, scope/target blocking, state transitions, launch authorization, and the full audit lifecycle.
- [ ] Deliberately upgrade the Next/PostCSS dependency chain after reviewing the current `npm audit` advisory; do not use a forced downgrade.

## Technical architecture

```text
Next.js public site + authenticated control plane
        |
        +-- Supabase Auth (email/password, Google OAuth, later MFA)
        |
        +-- Supabase PostgreSQL (tenant data, immutable events, decisions, RLS)
        |     +-- pg-boss + transactional outbox (durable audit jobs)
        |
        +-- Supabase Storage (private redacted screenshots, traces, report artifacts)
        |
        +-- Isolated disposable runner
              |
              +-- GitHub repository intelligence (server-only prototype token)
              +-- Browser QA (Playwright)
              +-- Accessibility and performance (axe, Lighthouse)
              +-- Source/config, dependency, and delivery-readiness adapters
              +-- Authorized non-destructive security baseline
              +-- Redaction + evidence/report generator
        |
        +-- AI interpretation adapter
              +-- OpenRouter free router (primary)
              +-- Nebius / OpenAI (optional configured fallback)
```

## Runtime integration configuration

| Integration | Why it is needed | Environment variable(s) |
| --- | --- | --- |
| Supabase | Implemented auth/persistence foundation; configure live email/password, Google OAuth, tenant PostgreSQL, RLS, and private Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; server/runner only: `SUPABASE_SECRET_KEY` |
| GitHub personal-token prototype | Read explicitly authorized repository metadata/content for an audit | server-only `GITHUB_TOKEN` (fine-grained, read-only, minimum repository access) |
| OpenRouter | Primary low-cost AI routing for intent parsing, evidence grouping, report synthesis, and fix briefs | `AI_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| Nebius fallback | Optional explicitly selected AI fallback | `NEBIUS_API_KEY`, `NEBIUS_MODEL` |
| OpenAI fallback | Optional explicitly selected AI fallback | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| PostgreSQL / pg-boss | Persist projects, runs, jobs, findings, evidence metadata, decisions, and durable jobs | Supabase database connection variables available server-side only |
| Local demo | Clearly separated presentation auth/fixtures | `AUDIT_MODE=demo`, `DEMO_AUTH_ENABLED=true` only on a local machine |
| Authorized runner | Isolated browser/security scan jobs | `AUDIT_RUNNER_URL`, `AUDIT_RUNNER_TOKEN` |

No real key is bundled with this repository. Do not use public/free credentials found online: they are unsafe, unreliable, and inappropriate for customer data. Provider free models are selected by configuration, not assumed to be permanently available. Do not add GitHub App credentials yet; the production migration from the server-only personal-token prototype is an explicit later milestone.

## Build order from here

1. Finish the presentation pass: tune the completed five-stage Audit Assembly in real-device testing, add the skip control, and add visual regression coverage.
2. Configure the live Supabase project and Google provider, set deployment environment variables, and validate email/password, reset, and OAuth round trips.
3. Extend the foundation migration with complete tenant RLS, private Storage, five-pillar state, an authenticated repository layer, and a seeded sample workspace.
4. Replace local demo mutations with authenticated server mutations and durable `pg-boss` audit jobs.
5. Add GitHub repository intake plus `/.well-known/buildproof-verification.txt` staging verification and enforce the safe first-live-audit scope.
6. Add isolated runner contracts for the safe scanner set; stream structured per-pillar progress, evidence, limitations, and coverage.
7. Add OpenRouter evidence interpretation with explicit Nebius/OpenAI fallback configuration; keep deterministic evidence and policy authoritative.
8. Add end-to-end lifecycle tests, rate limiting, CSP/HSTS, retention, production approval, and migrate repository access to a GitHub App.
