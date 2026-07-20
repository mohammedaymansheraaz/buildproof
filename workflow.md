# BuildProof — Implementation Workflow

## Product intent

BuildProof is an evidence-backed release-assurance workspace for software teams. It connects product intent, repository context, browser behavior, cloud readiness, safe security posture, and release evidence into a decision: **ship, review, or hold**.

The current build is a polished, fully interactive local demo plus a production-shaped public/auth foundation. It is deliberately not presented as a live penetration-testing service until its server-side authorization, persistence, and isolated runner controls exist.

The first shippable scope is defined in `mvp.md`. The UI theme contract is defined in `design-theme.md`.

## Non-negotiable product rules

- Audit only systems the customer owns or is explicitly authorized to test.
- Keep active security tests disabled by default; never run destructive or exploit-oriented checks from the web application.
- Never expose private credentials, repository tokens, or cloud secrets in the browser, source code, Markdown, screenshots, or commits.
- Every finding must carry severity, confidence, redacted evidence, a clear next action, and a human-review path.
- A release can only be marked ready when its evidence is complete; incomplete work is **in progress** or **unknown**, never a positive verdict.
- The interface should feel like a precise, premium engineering instrument—not a generic AI chat product.

## Product experience model

BuildProof presents one application audit through three user-facing expert teams. Individual low-level checks remain useful as evidence provenance and runner capabilities, but they are not the primary navigation model.

1. **Application Experience & Quality** — journey QA, UI behavior, functional testing, accessibility, and frontend quality.
2. **Engineering Performance & Infrastructure** — API, backend, data flow, cloud, performance, code architecture, and delivery readiness.
3. **Security & Reliability Intelligence** — authorization, data protection, safe vulnerability signals, identity, and reliability review.

The desktop public experience follows a cinematic five-scene story:

1. Application intake and audit-boundary mapping.
2. Experience & quality analysis.
3. Engineering systems analysis.
4. Security & reliability intelligence.
5. A unified application health report with replayable evidence.

The `CinematicAuditCore` is progressive enhancement: capable desktop browsers receive a draggable WebGL model and scroll-linked discipline transitions; reduced-motion, compact, and non-WebGL environments receive the same semantic content and a CSS model.

## Credential handling

- Put secrets only in the ignored `.env` file or a deployment secret manager.
- Never paste a GitHub, OpenAI, Clerk, database, cloud, or runner credential into this file.
- Prefer a per-organization GitHub App with least-privilege, short-lived installation tokens over a shared `GITHUB_TOKEN`.
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
- [x] Turn the dashboard lens into an interactive WebGL release assembly with selectable Experience, Engineering, and Security evidence surfaces; retain a CSS/reduced-motion fallback.
- [x] Make the dashboard decision and full-card next actions unambiguous, and verify the result in desktop and mobile Chromium.
- [x] Reframe the visible audit product around the three expert teams: Experience & Quality, Engineering & Infrastructure, and Security & Reliability.
- [x] Add a desktop-first cinematic audit core with WebGL/CSS progressive enhancement, selectable expert disciplines, and scroll-linked story chapters.
- [x] Replace flat dashboard surface bars with category-level health, specialist perspectives, recommendations, evidence counts, and real filtered evidence links.
- [x] Update the scope wizard, live audit path, findings query filter, and report summary to use the same three-team mental model.
- [x] Add a founder-facing MVP scope document and a shared Evidence Glass design theme.
- [x] New Audit wizard for source, product intent, scope, and review/launch.
- [x] Generated test charter with editable workflow checks.
- [x] Live audit screen with job progression, trace-style activity, and evidence cards.
- [x] Findings workspace, Fix Center, verification state, and release report.
- [x] Deterministic local demo data so the competition presentation has a coherent end-to-end story.

### 3. Public product surface and authentication

- [x] Replace the root dashboard with a public BuildProof landing page.
- [x] Build the landing page as an audit journey: Repo Intelligence → Browser QA → API & Cloud → Security Baseline → Evidence & Verdict.
- [x] Add a GSAP ScrollTrigger + Lenis desktop sequence with a static, reduced-motion/mobile fallback.
- [x] Add a persistent glass header, Register/Login calls-to-action, proof, safety model, and final CTA.
- [x] Add Clerk provider wiring, `/sign-in`, `/sign-up`, and protected workspace route boundaries.
- [x] Keep a clear local setup state when Clerk keys are absent instead of faking a login.
- [ ] Replace the temporary Clerk boundary with Supabase Auth plus Supabase PostgreSQL. Use email/password first; add Google OAuth only when it is needed.
- [ ] Create a user-owned Supabase project and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env`.
- [ ] Enable Supabase email/password, configure the `/auth/callback` redirect, and implement styled sign-in, registration, password reset, and protected-route session refresh.
- [ ] Add Supabase TOTP MFA later for an authenticator app. This is distinct from Google OAuth.

### 4. Production control plane — required before real audits

- [ ] Make `AUDIT_MODE` authoritative server-side. Demo mode must reject all real job creation.
- [ ] Require a signed-in user, organization membership, role authorization, project ownership, and a server-side scope record for every mutation.
- [ ] Validate audit targets: verified host only; block localhost, private/link-local/metadata IPs, unsafe redirects, and DNS rebinding; default to preview/staging.
- [ ] Require a separate owner-approved production policy with an expiry, test-account reference, module list, and rate budget.
- [ ] Replace browser `localStorage` state with server-owned data and immutable event records.
- [ ] Ensure reports cannot seal or export an in-progress audit as a release passport.

### 5. PostgreSQL and durable jobs

- [ ] Add Supabase PostgreSQL migrations and a repository/service boundary. The browser will use only the publishable key; privileged access stays in server/runner environments.
- [ ] Model `organizations`, `users`, `memberships`, `projects`, `audit_targets`, `audit_scopes`, `audit_runs`, `audit_jobs`, immutable `audit_events`, `findings`, `finding_evidence`, `artifacts`, `fix_proposals`, `verification_runs`, `release_decisions`, and integration metadata.
- [ ] Put `org_id` on every tenant-owned row, add tenant-scoped indexes and foreign keys, and enforce server-side state transitions.
- [ ] Use idempotency keys plus a transactional outbox when an audit is created.
- [ ] Add Redis/queue workers with pause, cancel, resume, job budgets, and delta audits.
- [ ] Store screenshots, videos, and traces in object storage; PostgreSQL stores redacted metadata and object keys.

### 6. Isolated audit runners

- [ ] Separate the control plane from disposable, no-root runner containers.
- [ ] Use adapters for repository intelligence, Playwright browser QA, API/cloud checks, safe security baseline, accessibility, performance, and evidence generation.
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
        +-- Supabase Auth (users, sessions, email/password, optional OAuth/MFA)
        |
        +-- Supabase PostgreSQL (tenant data, immutable audit events, decisions, RLS)
        +-- Redis / queue + transactional outbox
        |
        +-- Isolated disposable runner
              |
              +-- Repo intelligence
              +-- Browser QA (Playwright)
              +-- API and cloud/config adapters
              +-- Authorized non-destructive security baseline
              +-- Accessibility/performance adapters
              +-- Redaction + evidence/report generator
        |
        +-- Object storage (screenshots, traces, report artifacts)
```

## Required integrations when moving beyond demo mode

| Integration | Why it is needed | Environment variable(s) |
| --- | --- | --- |
| Supabase | Email/password sessions, tenant PostgreSQL, later OAuth and TOTP MFA | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; server/runner only: `SUPABASE_SECRET_KEY` |
| OpenAI | Intent parsing, test-plan generation, report synthesis, fix briefs | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| GitHub App | Private repository connection and optional draft pull requests | `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET` |
| PostgreSQL | Persist projects, runs, findings, evidence metadata, and decisions | `DATABASE_URL`, later `DIRECT_URL` / migration URL |
| Redis / queue | Durable background audits and retries | `REDIS_URL` |
| Object storage | Screenshots, Playwright traces, reports | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |
| Authorized runner | Isolated browser/security scan jobs | `AUDIT_RUNNER_URL`, `AUDIT_RUNNER_TOKEN` |

No real key is bundled with this repository. Do not use public/free credentials found online: they are unsafe, unreliable, and inappropriate for customer data.

## Build order from here

1. Finish the presentation pass: tune cinematic pacing in real-device testing and add Playwright visual regression coverage for the desktop story.
2. Configure Supabase Auth and add organization/role boundaries.
3. Add Supabase PostgreSQL migrations, RLS, real `PillarSummary` / specialist-agent state, an authenticated repository layer, and a seeded sample workspace.
4. Replace local demo mutations with authenticated server mutations.
5. Add queue/outbox and isolated runner contracts that report structured per-agent progress and evidence.
6. Add GitHub, OpenAI, evidence-storage, and runner integrations behind scope/policy checks.
7. Add end-to-end tests, production observability, rate limiting, CSP/HSTS, retention, and launch review.
